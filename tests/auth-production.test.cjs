const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { once } = require('node:events');

const root = path.resolve(__dirname, '..');
const next = require.resolve('next/dist/bin/next');

function launch(args, directory, env) {
  const child = spawn(process.execPath, [next, ...args], { cwd: directory, env, stdio: ['ignore', 'pipe', 'pipe'] });
  let output = '';
  for (const stream of [child.stdout, child.stderr]) stream.on('data', chunk => { output = (output + chunk).slice(-100000); });
  return { child, output: () => output };
}

async function stop(child) {
  if (child.exitCode !== null || child.signalCode !== null) return;
  const closed = once(child, 'close');
  child.kill('SIGTERM');
  const timer = setTimeout(() => child.kill('SIGKILL'), 5000).unref();
  try { await closed; } finally { clearTimeout(timer); }
}

async function availablePort() {
  const server = net.createServer();
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  const port = server.address().port;
  await new Promise(resolve => server.close(resolve));
  return port;
}

async function requestWhenReady(url, child) {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null || child.signalCode !== null) throw new Error('Production auth server exited before accepting requests');
    try { return await fetch(url, { signal: AbortSignal.timeout(1000), redirect: 'manual' }); }
    catch { await new Promise(resolve => setTimeout(resolve, 100)); }
  }
  throw new Error('Production auth server did not accept requests');
}

test('fresh production auth bundling serves Google providers and CSRF without database or OAuth credentials', { timeout: 90000 }, async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'biblechorus-production-auth-'));
  let production;
  try {
    // Exercise the actual configuration, auth callbacks and Pages bridge. The
    // small isolated app avoids stale build artifacts and never loads real .env.
    for (const file of ['next.config.mjs', 'package.json', 'tsconfig.json', 'auth.ts', 'db.js', 'knexfile.js', 'pages/api/auth/[...nextauth].ts']) {
      const target = path.join(directory, file);
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.copyFileSync(path.join(root, file), target);
    }
    fs.symlinkSync(path.join(root, 'node_modules'), path.join(directory, 'node_modules'), 'dir');
    const port = await availablePort();
    const origin = `http://127.0.0.1:${port}`;
    const authOrigin = `http://localhost:${port}`;
    // Explicitly isolated environment: no DATABASE_URL, PG*, Google, AWS, email,
    // or developer secrets. This test never enters an OAuth/callback workflow.
    const env = {
      PATH: process.env.PATH || '', NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1', AUTH_TRUST_HOST: 'true',
      NEXTAUTH_SECRET: 'offline-production-auth-regression-only', NEXTAUTH_URL: authOrigin,
    };
    const build = launch(['build', directory, '--no-lint'], directory, env);
    const timer = setTimeout(() => build.child.kill('SIGKILL'), 60000).unref();
    try {
      const [code] = await once(build.child, 'close');
      assert.equal(code, 0, `Fresh production build failed:\n${build.output()}`);
    } finally { clearTimeout(timer); await stop(build.child); }

    production = launch(['start', directory, '--hostname', '127.0.0.1', '--port', String(port)], directory, env);
    const providers = await requestWhenReady(`${origin}/api/auth/providers`, production.child);
    assert.equal(providers.status, 200, `Production providers endpoint failed:\n${production.output()}`);
    const provider = (await providers.json()).google;
    assert.equal(provider.id, 'google');
    assert.equal(provider.name, 'Google');
    assert.equal(provider.signinUrl, `${authOrigin}/api/auth/signin/google`);
    assert.equal(provider.callbackUrl, `${authOrigin}/api/auth/callback/google`);

    const csrf = await fetch(`${origin}/api/auth/csrf`, { signal: AbortSignal.timeout(5000), redirect: 'manual' });
    assert.equal(csrf.status, 200, `Production CSRF endpoint failed:\n${production.output()}`);
    assert.match((await csrf.json()).csrfToken, /^[a-f0-9]{64}$/);
    assert.ok(csrf.headers.getSetCookie().some(cookie => /csrf-token=/.test(cookie) && /HttpOnly/i.test(cookie)), 'The actual Pages bridge must forward the CSRF cookie');
    assert.doesNotMatch(production.output(), /ERR_MODULE_NOT_FOUND|Cannot find module.*next\/server/);
  } finally {
    if (production) await stop(production.child);
    fs.rmSync(directory, { recursive: true, force: true });
  }
});
