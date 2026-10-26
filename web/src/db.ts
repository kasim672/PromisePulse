import * as duckdb from '@duckdb/duckdb-wasm'
import ehWasm from '@duckdb/duckdb-wasm/dist/duckdb-eh.wasm?url'
import mvpWasm from '@duckdb/duckdb-wasm/dist/duckdb-mvp.wasm?url'
import ehWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-eh.worker.js?url'
import mvpWorker from '@duckdb/duckdb-wasm/dist/duckdb-browser-mvp.worker.js?url'
import type { Manifest, RecordRow } from './types'

export interface Warehouse {
  manifest: Manifest
  query(sql: string): Promise<RecordRow[]>
  close(): Promise<void>
}

const tables = ['dim_customer', 'dim_product', 'dim_seller', 'dim_date', 'fact_orders', 'fact_order_items']

function cleanValue(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'bigint') return Number(value)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof value.toNumber === 'function') return Number(value.toNumber())
  return String(value)
}

export async function loadWarehouse(): Promise<Warehouse> {
  const base = import.meta.env.BASE_URL
  const manifestResponse = await fetch(`${base}data/manifest.json`, { cache: 'no-store' })
  if (!manifestResponse.ok) throw new Error('Data export missing. Run the Python export command in the README first.')
  const manifest = await manifestResponse.json() as Manifest
  const bundles = {
    mvp: { mainModule: mvpWasm, mainWorker: mvpWorker },
    eh: { mainModule: ehWasm, mainWorker: ehWorker },
  }
  const bundle = await duckdb.selectBundle(bundles)
  const worker = new Worker(bundle.mainWorker!)
  const db = new duckdb.AsyncDuckDB(new duckdb.ConsoleLogger(), worker)
  try {
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker)
    const conn = await db.connect()
    // Fetch independent static Parquet assets concurrently; keep registrations and
    // view creation ordered because DuckDB's underlying connection is serialized.
    const required = [...tables, ...(manifest.model.status === 'evaluated' ? ['risk_predictions'] : [])]
    const files = await Promise.all(required.map(async table => {
      const response = await fetch(`${base}data/${table}.parquet`)
      if (!response.ok) throw new Error(`Missing warehouse file ${table}.parquet; regenerate the export.`)
      return {table, buffer:new Uint8Array(await response.arrayBuffer())}
    }))
    for (const file of files) {
      await db.registerFileBuffer(`${file.table}.parquet`, file.buffer)
      await conn.query(`CREATE VIEW ${file.table} AS SELECT * FROM read_parquet('${file.table}.parquet')`)
    }
    return {
      manifest,
      async query(sql) {
        // All authored queries are SELECT/WITH-only. Never pass untrusted SQL into mutation APIs.
        if (!/^\s*(SELECT|WITH|EXPLAIN)\b/i.test(sql) || /;\s*\S/.test(sql)) throw new Error('Only a single read-only query is supported.')
        const result = await conn.query(sql)
        return result.toArray().map((row) => {
          const obj = row.toJSON() as Record<string, unknown>
          return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, cleanValue(v)]))
        })
      },
      async close() { await conn.close(); await db.terminate(); worker.terminate() },
    }
  } catch (error) {
    await db.terminate()
    worker.terminate()
    throw error
  }
}
