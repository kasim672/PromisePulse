export type Primitive = string | number | boolean | null
export type RecordRow = Record<string, Primitive>
export type Tab = 'Overview' | 'OLAP Lab' | 'Risk Center' | 'Data Catalog' | 'Pipeline & Quality' | 'Intelligence' | 'Analytics Atlas' | 'Welcome' | 'Customer Cohorts' | 'Delivery Lab' | 'Research Studio' | 'AI Studio'

export interface RawFile {
  file: string
  table: string
  rows: number
  bytes: number
}
export interface ModelReport {
  status: 'evaluated' | 'not_trained'
  prediction_time?: string
  target?: string
  train_rows?: number
  validation_rows?: number
  test_rows?: number
  threshold?: number
  model_metrics?: Record<string, number | null>
  baseline_metrics?: Record<string, number | null>
  test_start?: string
  test_end?: string
  reason?: string
}
export interface Manifest {
  title: string
  generated_at: string
  dataset: {
    name: string
    provider: string
    url: string
    license: string
    period: string
  }
  source_files: RawFile[]
  warehouse: Record<string, number>
  quality: Record<string, number | string>
  model: ModelReport
  lineage: string[]
}
