export type OlapOperation = 'Roll-up' | 'Drill-down' | 'Slice' | 'Dice' | 'Pivot'

export const OVERVIEW_SQL = `
SELECT COUNT(*) AS total_orders,
       COUNT(DISTINCT customer_id) AS order_customers,
       ROUND(SUM(payment_total), 2) AS payment_revenue,
       ROUND(AVG(payment_total), 2) AS avg_order_value,
       ROUND(100.0 * COUNT(*) FILTER (WHERE is_late = true) / NULLIF(COUNT(is_late), 0), 2) AS late_rate_pct,
       COUNT(is_late) AS deliveries_with_known_outcome
FROM fact_orders`

export const TRENDS_SQL = `
SELECT d.year_month AS period,
       COUNT(*) AS orders,
       ROUND(SUM(o.payment_total), 2) AS payment_revenue
FROM fact_orders o JOIN dim_date d ON o.purchase_date = d.date_day
GROUP BY 1 ORDER BY 1`

export const CATEGORY_SQL = `
SELECT COALESCE(p.category, 'Unknown') AS category,
       COUNT(*) AS items_sold,
       COUNT(DISTINCT i.order_id) AS distinct_orders,
       ROUND(SUM(i.price),2) AS item_sales
FROM fact_order_items i
LEFT JOIN dim_product p USING(product_id)
GROUP BY 1 ORDER BY item_sales DESC NULLS LAST LIMIT 8`

export const STATE_SQL = `
SELECT c.customer_state AS state,
       COUNT(*) AS orders,
       ROUND(100.0 * COUNT(*) FILTER (WHERE o.is_late = true) / NULLIF(COUNT(o.is_late),0), 2) AS late_pct
FROM fact_orders o JOIN dim_customer c USING(customer_id)
WHERE c.customer_state IS NOT NULL
GROUP BY 1 HAVING COUNT(*) >= 50
ORDER BY orders DESC LIMIT 10`

export const WAREHOUSE_TABLES = [
  'fact_orders', 'fact_order_items', 'dim_customer', 'dim_product', 'dim_seller', 'dim_date',
] as const
export type WarehouseTable = typeof WAREHOUSE_TABLES[number]

function validDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) throw new Error('Invalid date filter')
  return date
}
function safeState(state: string) {
  if (!/^[A-Z]{2}$/.test(state)) throw new Error('Invalid Brazilian state abbreviation')
  return state
}
export interface OlapFilters {
  start: string
  end: string
  state: string
  secondState: string
}

export function buildOlapQuery(operation: OlapOperation, filters: OlapFilters): string {
  const start = validDate(filters.start)
  const end = validDate(filters.end)
  if (start > end) throw new Error('Start date must be before end date')
  const state = safeState(filters.state)
  const secondState = safeState(filters.secondState)
  const period = `o.purchase_date BETWEEN DATE '${start}' AND DATE '${end}'`
  const base = `FROM fact_orders o JOIN dim_customer c USING(customer_id)`
  switch (operation) {
    case 'Roll-up':
      return `SELECT CASE WHEN GROUPING(c.customer_state) = 1 THEN 'ALL STATES' ELSE COALESCE(c.customer_state,'Unknown') END AS state,\nCASE WHEN GROUPING(d.year_month) = 1 THEN 'ALL MONTHS' ELSE d.year_month END AS month,\nCOUNT(*) AS orders, ROUND(SUM(o.payment_total),2) AS payment_revenue\nFROM fact_orders o JOIN dim_customer c USING(customer_id) JOIN dim_date d ON o.purchase_date = d.date_day\nWHERE ${period}\nGROUP BY ROLLUP(c.customer_state, d.year_month)\nORDER BY state, month LIMIT 100`
    case 'Drill-down':
      return `SELECT c.customer_state AS state, d.year_month AS month,\nCOUNT(*) AS orders, ROUND(SUM(o.payment_total),2) AS payment_revenue\nFROM fact_orders o JOIN dim_customer c USING(customer_id) JOIN dim_date d ON o.purchase_date = d.date_day\nWHERE ${period} AND c.customer_state = '${state}'\nGROUP BY 1,2 ORDER BY 2`
    case 'Slice':
      return `SELECT c.customer_state AS state, o.order_status AS status,\nCOUNT(*) AS orders, ROUND(SUM(o.payment_total),2) AS payment_revenue,\nROUND(100.0 * COUNT(*) FILTER (WHERE o.is_late = true) / NULLIF(COUNT(o.is_late),0),2) AS late_pct\n${base}\nWHERE ${period} AND c.customer_state = '${state}'\nGROUP BY 1,2 ORDER BY orders DESC`
    case 'Dice':
      return `SELECT c.customer_state AS state, o.order_status AS status,\nCOUNT(*) AS orders, ROUND(SUM(o.payment_total),2) AS payment_revenue\n${base}\nWHERE ${period} AND c.customer_state IN ('${state}', '${secondState}')\nAND o.order_status IN ('delivered','shipped','canceled')\nGROUP BY 1,2 ORDER BY 1,2`
    case 'Pivot':
      return `SELECT d.year_month AS month,\nCOUNT(*) FILTER (WHERE c.customer_state='${state}') AS ${state}_orders,\nCOUNT(*) FILTER (WHERE c.customer_state='${secondState}') AS ${secondState}_orders,\nCOUNT(*) AS all_states_orders\nFROM fact_orders o JOIN dim_customer c USING(customer_id) JOIN dim_date d ON o.purchase_date=d.date_day\nWHERE ${period}\nGROUP BY 1 ORDER BY 1`
  }
}

export function riskQuery(threshold: number, limit = 250): string {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error('Invalid risk threshold')
  return `SELECT order_id, purchase_ts, customer_state, order_value, estimated_delivery_ts,\nROUND(risk_probability, 4) AS risk_probability, actual_late, predicted_risk,\nitem_count, freight_total, promised_days\nFROM risk_predictions\nWHERE risk_probability >= ${threshold.toFixed(3)}\nORDER BY risk_probability DESC LIMIT ${Math.min(1000, Math.max(1, limit))}`
}

/** Exploratory confusion matrix: browser recomputes this directly from held-out labels. */
export function exploratoryRiskMetricsQuery(threshold: number): string {
  if (!Number.isFinite(threshold) || threshold < 0 || threshold > 1) throw new Error('Invalid threshold')
  const t = threshold.toFixed(3)
  return `SELECT COUNT(*) AS test_orders,
SUM(CASE WHEN risk_probability >= ${t} AND actual_late = 1 THEN 1 ELSE 0 END) AS true_positives,
SUM(CASE WHEN risk_probability >= ${t} AND actual_late = 0 THEN 1 ELSE 0 END) AS false_positives,
SUM(CASE WHEN risk_probability < ${t} AND actual_late = 1 THEN 1 ELSE 0 END) AS false_negatives,
SUM(CASE WHEN risk_probability < ${t} AND actual_late = 0 THEN 1 ELSE 0 END) AS true_negatives
FROM risk_predictions`
}
