/** Run after installing web dependencies: node tests/test_sql_generation.cjs */
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const ts = require(require.resolve('typescript', { paths: [path.join(__dirname, '../web')] }))
const Module = module.constructor
const filename = path.join(__dirname, '../web/src/queries.ts')
const js = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText
const m = new Module(filename, module)
m.filename = filename
m.paths = module.paths
m._compile(js, filename)
const { buildOlapQuery, riskQuery } = m.exports
const input = { start: '2016-01-01', end: '2018-12-31', state: 'SP', secondState: 'RJ' }
for (const name of ['Roll-up', 'Drill-down', 'Slice', 'Dice', 'Pivot']) {
  const sql = buildOlapQuery(name, input)
  assert.match(sql, /^SELECT /)
  assert.match(sql, /FROM fact_orders/)
}
assert.match(buildOlapQuery('Roll-up', input), /GROUP BY ROLLUP/)
assert.match(riskQuery(.7), /0\.700/)
assert.throws(() => buildOlapQuery('Slice', { ...input, state: "SP';DROP TABLE fact_orders;--" }))
assert.throws(() => riskQuery(5))
console.log('PASS: 5 executable OLAP templates and input-guard checks')
