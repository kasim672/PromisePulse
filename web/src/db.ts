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

export type WarehouseProgress={phase:'manifest'|'engine'|'tables'|'ready';completed:number;total:number;table?:string}
export type WarehouseLoadOptions={signal?:AbortSignal;onProgress?:(value:WarehouseProgress)=>void}
const tables = ['dim_customer', 'dim_product', 'dim_seller', 'dim_date', 'fact_orders', 'fact_order_items']

function cleanValue(value: unknown): string | number | boolean | null {
  if (value === undefined || value === null) return null
  if (typeof value === 'bigint') return Number(value)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (typeof value === 'number' || typeof value === 'string' || typeof value === 'boolean') return value
  if (typeof value === 'object' && value !== null && 'toNumber' in value && typeof value.toNumber === 'function') return Number(value.toNumber())
  return String(value)
}

export async function loadWarehouse({signal,onProgress}:WarehouseLoadOptions={}): Promise<Warehouse> {
  const notify=(value:WarehouseProgress)=>{if(!signal?.aborted)onProgress?.(value)}
  notify({phase:'manifest',completed:0,total:0})
  const base = import.meta.env.BASE_URL
  const manifestResponse = await fetch(`${base}data/manifest.json`, { cache: 'no-store',signal })
  if (!manifestResponse.ok) throw new Error('Data export missing. Run the Python export command in the README first.')
  const manifest = await manifestResponse.json() as Manifest
  notify({phase:'engine',completed:0,total:0})
  if(signal?.aborted)throw new DOMException('Load cancelled','AbortError')
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
    const required=[...tables, ...(manifest.model.status === 'evaluated' ? ['risk_predictions'] : [])]
    let completed=0
    for (const table of required) {
      if(signal?.aborted)throw new DOMException('Load cancelled','AbortError')
      notify({phase:'tables',completed,total:required.length,table})
      const response = await fetch(`${base}data/${table}.parquet`,{signal})
      if (!response.ok) throw new Error(`Missing warehouse file ${table}.parquet; regenerate the export.`)
      await db.registerFileBuffer(`${table}.parquet`, new Uint8Array(await response.arrayBuffer()))
      await conn.query(`CREATE VIEW ${table} AS SELECT * FROM read_parquet('${table}.parquet')`)
      completed++
      notify({phase:'tables',completed,total:required.length,table})
    }
    notify({phase:'ready',completed,total:required.length})
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
