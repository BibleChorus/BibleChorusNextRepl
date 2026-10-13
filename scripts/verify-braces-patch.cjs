// Local mitigation for GHSA-vfj7-8cjw-p6xm. Keep the original package identity.
// Fail closed when lifecycle scripts were skipped or dependency contents change.
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const expected = {
  "parse.js": "5fbdfcb2abea5710ed132a120a574ee7a61afb5c8feed59cb711b796caf31c67",
  "compile.js": "d979d0f0a4fd28273bdda5ba438240ac9531df9f9989dfd05e143e63243e6f28",
  "expand.js": "b686921a0547f7d9358963dfe67b4fe724198deeb465e2bf29832c387f30e4f6",
  "stringify.js": "2bd34311992fda811e6c60edafc78a34b7146f973239150b7c274e502b26b04c"
};
const root = path.resolve(__dirname, '..');
const lock = JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
const entries = Object.entries(lock.packages).filter(([name]) => name.endsWith('/braces'));
if (entries.length !== 1 || entries[0][0] !== 'node_modules/braces' || entries[0][1].version !== '3.0.3') {
  throw new Error('Braces dependency graph changed; review the security mitigation before running the app.');
}
const directory = path.join(root, 'node_modules/braces');
if (JSON.parse(fs.readFileSync(path.join(directory, 'package.json'), 'utf8')).version !== '3.0.3') {
  throw new Error('Unexpected braces version; review the security mitigation before running the app.');
}
for (const [file, hash] of Object.entries(expected)) {
  const actual = createHash('sha256').update(fs.readFileSync(path.join(directory, 'lib', file))).digest('hex');
  if (actual !== hash) {
    throw new Error(`Braces security patch missing or changed (${file}); run npm ci with lifecycle scripts enabled.`);
  }
}
