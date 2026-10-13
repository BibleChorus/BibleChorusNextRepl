const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const braces = require('braces');

const root = path.resolve(__dirname, '..');
const excessive = { name: 'SyntaxError', message: 'Maximum nesting depth of 100 exceeded' };
const nested = (count, open = '{', close = '}') => open.repeat(count) + 'x' + close.repeat(count);

test('installed braces contents match the pinned security patch', () => {
  require('../scripts/verify-braces-patch.cjs');
});

test('deep patterns fail promptly with a controlled error in every public string API', () => {
  // Each reproducer runs in a bounded, secret-free subprocess. Without the patch,
  // the 9,801-character balanced-brace case overflows compile/expand on Node 22/24.
  const source = `
    const assert = require('node:assert/strict');
    const braces = require('braces');
    const nested = (n, a, b) => a.repeat(n) + 'x' + b.repeat(n);
    const patterns = [nested(4900, '{', '}'), nested(4900, '(', ')'),
      nested(2400, '{(', ')}'), '{'.repeat(4900), '('.repeat(4900)];
    for (const pattern of patterns) {
      for (const method of ['parse', 'compile', 'expand', 'stringify', 'create']) {
        assert.throws(() => braces[method](pattern, {maxDepth: Infinity, rangeLimit: false}),
          ${JSON.stringify(excessive)});
      }
      assert.throws(() => braces(pattern), ${JSON.stringify(excessive)});
      assert.throws(() => braces([pattern], {expand: true}), ${JSON.stringify(excessive)});
    }
  `;
  const result = spawnSync(process.execPath, ['--max-old-space-size=128', '-e', source], {
    cwd: root, encoding: 'utf8', timeout: 5000, env: {},
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.signal, null);
});

test('100 nested blocks remain supported; block 101 is rejected', () => {
  for (const [open, close] of [['{', '}'], ['(', ')'], ['{(', ')}']]) {
    const count = open.length === 2 ? 50 : 100;
    const input = nested(count, open, close);
    assert.equal(braces.stringify(input), input);
    assert.equal(braces.compile(input), input);
    assert.deepEqual(braces.expand(input), [input]);
    for (const method of ['parse', 'compile', 'expand', 'stringify']) {
      assert.throws(() => braces[method](nested(count + 1, open, close)), excessive);
    }
  }
  assert.throws(() => braces.parse('{'.repeat(10001)), { name: 'SyntaxError', message: /max characters/ });
});

test('caller-supplied deep or cyclic ASTs cannot bypass walker guards', () => {
  const makeAst = depth => {
    const ast = { type: 'root', nodes: [] };
    let parent = ast;
    for (let i = 0; i < depth; i++) {
      const child = { type: 'brace', nodes: [], parent };
      parent.nodes.push(child);
      parent = child;
    }
    parent.nodes.push({ type: 'text', value: 'x', parent });
    return ast;
  };
  for (const method of ['compile', 'expand', 'stringify']) {
    assert.doesNotThrow(() => braces[method](makeAst(100)));
    assert.throws(() => braces[method](makeAst(101), { maxDepth: Infinity }), excessive);
    const cycle = { type: 'root', nodes: [] };
    cycle.nodes.push(cycle);
    assert.throws(() => braces[method](cycle), excessive);
  }
  // Expansion follows both parent chains as well as child nodes.
  const parent = { type: 'paren', nodes: [] };
  parent.parent = parent;
  const ast = { type: 'paren', nodes: [{ type: 'brace', nodes: [{type: 'text', value: 'x'}] }], parent };
  assert.throws(() => braces.expand(ast), excessive);
});

test('ordinary lists, ranges, literals and escaping retain their existing behavior', () => {
  assert.equal(braces.compile('src/{pages,components}/**/*.{ts,tsx}'), 'src/(pages|components)/**/*.(ts|tsx)');
  assert.deepEqual(braces.expand('file-{01..03}.{ts,js}'), ['file-01.ts', 'file-01.js', 'file-02.ts', 'file-02.js', 'file-03.ts', 'file-03.js']);
  assert.deepEqual(braces.expand('{a,{b,c}}'), ['a', 'b', 'c']);
  assert.deepEqual(braces.expand('{1..5..2}'), ['1', '3', '5']);
  assert.deepEqual(braces.expand('{a,a,b}', {nodupes: true}), ['a', 'b']);
  assert.equal(braces.stringify('{a,b}'), '{a,b}');
  assert.deepEqual(braces.expand('${a,b}'), ['${a,b}']);
  assert.equal(braces.compile('\\{literal\\}'), '{literal}');
  assert.equal(braces.compile('{unclosed'), '{unclosed');
  // Quoted, escaped and character-class braces do not form nested AST blocks.
  assert.doesNotThrow(() => braces.compile('"' + '{'.repeat(101) + '"'));
  assert.doesNotThrow(() => braces.compile('\\{'.repeat(101)));
  assert.doesNotThrow(() => braces.compile('[' + '{'.repeat(101) + ']'));
});

test('micromatch and chokidar consumers retain glob matching and watching', async () => {
  const micromatch = require('micromatch');
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'biblechorus-braces-'));
  let watcher;
  try {
    fs.writeFileSync(path.join(directory, 'one.ts'), '');
    fs.writeFileSync(path.join(directory, 'two.tsx'), '');
    fs.writeFileSync(path.join(directory, 'skip.txt'), '');
    const pattern = '*.{ts,tsx}';
    assert.deepEqual(micromatch(['one.ts', 'two.tsx', 'skip.txt'], pattern), ['one.ts', 'two.tsx']);
    assert.deepEqual(require('fast-glob').sync(pattern, {cwd: directory}).sort(), ['one.ts', 'two.tsx']);
    assert.deepEqual(micromatch.braceExpand('file-{1..3}.ts'), ['file-1.ts', 'file-2.ts', 'file-3.ts']);
    assert.throws(() => micromatch.braces(nested(101)), excessive);
    watcher = require('chokidar').watch(path.join(directory, pattern), {persistent: false});
    const found = [];
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('Chokidar never became ready')), 5000);
      watcher.on('add', file => found.push(path.basename(file)));
      watcher.once('error', error => { clearTimeout(timer); reject(error); });
      watcher.once('ready', () => { clearTimeout(timer); resolve(); });
    });
    assert.deepEqual(found.sort(), ['one.ts', 'two.tsx']);
  } finally {
    if (watcher) await watcher.close();
    fs.rmSync(directory, {recursive: true, force: true});
  }
});
