const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');

// Run the actual SSR function with offline dependencies. Extracting its syntax
// node avoids loading unrelated browser-only UI modules into the Node test.
function serverSideProps(playlist, viewer) {
  const filename = path.resolve(__dirname, '../pages/playlists/[id].tsx');
  const source = fs.readFileSync(filename, 'utf8');
  const parsed = ts.createSourceFile(filename, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  let initializer;
  function visit(node) {
    if (ts.isVariableDeclaration(node) && node.name.getText(parsed) === 'getServerSideProps') initializer = node.initializer;
    ts.forEachChild(node, visit);
  }
  visit(parsed);
  assert.ok(initializer, 'The real playlist SSR function must exist');
  const code = ts.transpileModule(`exports.getServerSideProps = ${initializer.getText(parsed)};`, { compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.CommonJS } }).outputText;
  const queries = [];
  function db(table) {
    queries.push(table);
    const rows = table === 'playlists' ? [playlist] : table === 'users' ? [{ id: playlist.user_id, username: 'Creator', password_hash: 'private' }] : [];
    const query = {
      where() { return query; }, join() { return query; }, leftJoin() { return query; }, select() { return query; }, orderBy() { return query; },
      async first() { return rows[0]; },
      then(resolve, reject) { return Promise.resolve(rows).then(resolve, reject); },
    };
    return query;
  }
  const exports = {};
  vm.runInNewContext(code, {
    exports, db,
    getAuthenticatedUser: async () => viewer,
    parsePostgresArray: value => Array.isArray(value) ? value : [],
    console: { error() {} },
  }, { filename });
  return { handler: exports.getServerSideProps, queries };
}

test('private auto and manual playlists reject signed-out and other-user SSR reads', async () => {
  for (const is_auto of [true, false]) {
    for (const viewer of [null, { id: 8 }]) {
      const { handler, queries } = serverSideProps({ id: 10, user_id: 7, is_public: false, is_auto }, viewer);
      const result = await handler({ params: { id: '10' }, req: {}, res: {} });
      assert.equal(result.notFound, true);
      assert.equal(result.props, undefined);
      assert.deepEqual(queries, ['playlists'], 'No songs or creator data should be loaded after privacy denial');
    }
  }
});

test('public system auto playlists and private playlist owners retain SSR access', async () => {
  const cases = [
    [{ id: 10, user_id: null, is_public: true, is_auto: true }, null],
    [{ id: 11, user_id: 7, is_public: false, is_auto: true }, { id: 7 }],
    [{ id: 12, user_id: 7, is_public: false, is_auto: false }, { id: 7 }],
  ];
  for (const [playlist, viewer] of cases) {
    const { handler } = serverSideProps(playlist, viewer);
    const result = await handler({ params: { id: String(playlist.id) }, req: {}, res: {} });
    assert.equal(result.notFound, undefined);
    assert.equal(result.props.playlist.id, playlist.id);
    assert.equal(result.props.creatorUsername, 'Creator');
    assert.equal(result.props.password_hash, undefined);
  }
});
