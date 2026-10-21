/** Read-only OLAP for the premium interface. All series are computed from Olist Parquet facts. */
export type YearSelection = 'all' | '2016' | '2017' | '2018'
const yearPredicate = (year: YearSelection, alias = 'o') =>
  year === 'all' ? 'TRUE' : `EXTRACT(YEAR FROM ${alias}.purchase_ts) = ${Number(year)}`

export function dashboardQueries(year: YearSelection) {
  const period = yearPredicate(year)
  return {
    summary: `SELECT COUNT(*) AS orders,
      ROUND(SUM(payment_total),2) AS revenue,
      ROUND(AVG(payment_total),2) AS avg_value,
      COUNT(is_late) AS evaluated_deliveries,
      COUNT(*) FILTER (WHERE is_late = true) AS late_orders,
      COUNT(*) FILTER (WHERE is_late = false) AS ontime_orders,
      ROUND(100.0 * COUNT(*) FILTER (WHERE is_late = false)/NULLIF(COUNT(is_late),0),1) AS ontime_pct,
      ROUND(AVG(date_diff('day',purchase_ts,delivered_ts)) FILTER (WHERE is_late IS NOT NULL),1) AS delivery_days
      FROM fact_orders o WHERE ${period}`,
    monthly: `SELECT strftime(o.purchase_ts, '%Y-%m') AS period,
      COUNT(*) AS orders, ROUND(SUM(o.payment_total),2) AS revenue,
      COUNT(*) FILTER (WHERE o.is_late = true) AS late_orders
      FROM fact_orders o WHERE ${period} AND o.purchase_ts IS NOT NULL
      GROUP BY 1 ORDER BY 1`,
    states: `SELECT c.customer_state AS state, COUNT(*) AS orders,
      ROUND(SUM(o.payment_total),2) AS revenue,
      COUNT(*) FILTER (WHERE o.is_late = true) AS late_orders,
      ROUND(100.0*COUNT(*) FILTER (WHERE o.is_late = true) / NULLIF(COUNT(o.is_late),0),1) AS late_pct
      FROM fact_orders o JOIN dim_customer c USING(customer_id)
      WHERE ${period} AND c.customer_state IS NOT NULL GROUP BY 1 ORDER BY orders DESC`,
    delivery: `SELECT CASE WHEN is_late = true THEN 'Delayed'
      WHEN is_late = false THEN 'On time' ELSE 'Outcome unknown' END AS outcome,
      COUNT(*) AS orders FROM fact_orders o WHERE ${period}
      GROUP BY 1 ORDER BY orders DESC`,
    recent: `SELECT o.order_id AS order_id, strftime(o.purchase_ts,'%d %b %Y') AS purchased,
      c.customer_state AS state, ROUND(o.payment_total,2) AS value,
      o.order_status AS status,
      CASE WHEN o.is_late = true THEN 'Delayed'
      WHEN o.is_late = false THEN 'On time' ELSE 'Unknown' END AS outcome
      FROM fact_orders o LEFT JOIN dim_customer c USING(customer_id)
      WHERE ${period} AND o.purchase_ts IS NOT NULL
      ORDER BY o.purchase_ts DESC LIMIT 12`,
    categories: `SELECT COALESCE(p.category,'Unknown') AS category, COUNT(*) AS items,
      ROUND(SUM(i.price),2) AS sales
      FROM fact_order_items i JOIN fact_orders o USING(order_id)
      LEFT JOIN dim_product p USING(product_id)
      WHERE ${period} GROUP BY 1 ORDER BY sales DESC NULLS LAST LIMIT 10`,
  }
}

export function insightQueries(year: YearSelection) {
  const period = yearPredicate(year)
  return {
    weekday: `SELECT EXTRACT(DOW FROM o.purchase_ts) AS weekday,
      COUNT(*) AS orders, ROUND(SUM(o.payment_total),2) AS revenue
      FROM fact_orders o WHERE ${period} AND o.purchase_ts IS NOT NULL GROUP BY 1 ORDER BY 1`,
    deliveryMonths: `SELECT strftime(o.purchase_ts,'%Y-%m') AS period,
      COUNT(*) FILTER (WHERE is_late = false) AS ontime,
      COUNT(*) FILTER (WHERE is_late = true) AS late
      FROM fact_orders o WHERE ${period} AND is_late IS NOT NULL GROUP BY 1 ORDER BY 1`,
    fulfillment: `SELECT CASE
        WHEN date_diff('day',o.purchase_ts,o.delivered_ts) <= 7 THEN '0–7d'
        WHEN date_diff('day',o.purchase_ts,o.delivered_ts) <= 14 THEN '8–14d'
        WHEN date_diff('day',o.purchase_ts,o.delivered_ts) <= 21 THEN '15–21d'
        WHEN date_diff('day',o.purchase_ts,o.delivered_ts) <= 30 THEN '22–30d'
        ELSE '31+d' END AS band,
        COUNT(*) AS orders
      FROM fact_orders o WHERE ${period}
      AND o.delivered_ts IS NOT NULL AND o.purchase_ts IS NOT NULL
      AND o.delivered_ts >= o.purchase_ts GROUP BY 1
      ORDER BY CASE band WHEN '0–7d' THEN 1 WHEN '8–14d' THEN 2
      WHEN '15–21d' THEN 3 WHEN '22–30d' THEN 4 ELSE 5 END`,
    review: `SELECT CAST(ROUND(o.review_score) AS INTEGER) AS score, COUNT(*) AS orders
      FROM fact_orders o WHERE ${period} AND o.review_score IS NOT NULL
      GROUP BY 1 ORDER BY 1`,
    basket: `SELECT CASE WHEN o.payment_total < 50 THEN 'Under R$50'
      WHEN o.payment_total < 100 THEN 'R$50–99'
      WHEN o.payment_total < 200 THEN 'R$100–199'
      WHEN o.payment_total < 500 THEN 'R$200–499'
      ELSE 'R$500+' END AS band, COUNT(*) AS orders
      FROM fact_orders o WHERE ${period} AND o.payment_total IS NOT NULL
      GROUP BY 1 ORDER BY CASE band WHEN 'Under R$50' THEN 1
      WHEN 'R$50–99' THEN 2 WHEN 'R$100–199' THEN 3 WHEN 'R$200–499' THEN 4 ELSE 5 END`,
    customerFrequency: `WITH customer_orders AS (
        SELECT c.customer_unique_id AS customer, COUNT(*) AS orders,
        SUM(o.payment_total) AS lifetime_value
        FROM fact_orders o JOIN dim_customer c USING(customer_id)
        WHERE ${period} AND c.customer_unique_id IS NOT NULL
        GROUP BY 1
      ) SELECT CASE WHEN orders >= 5 THEN '5+' ELSE CAST(orders AS VARCHAR) END AS purchases,
        COUNT(*) AS customers, ROUND(AVG(lifetime_value),2) AS avg_value
        FROM customer_orders GROUP BY 1
        ORDER BY CASE WHEN purchases='5+' THEN 5 ELSE CAST(purchases AS INTEGER) END`,
    repeat: `WITH per_customer AS (
      SELECT c.customer_unique_id AS customer, COUNT(*) AS orders,
      SUM(o.payment_total) AS revenue
      FROM fact_orders o JOIN dim_customer c USING(customer_id)
      WHERE ${period} AND c.customer_unique_id IS NOT NULL GROUP BY 1
    ) SELECT COUNT(*) AS customers, COUNT(*) FILTER (WHERE orders>1) AS repeat_customers,
      ROUND(100.0*COUNT(*) FILTER (WHERE orders>1)/NULLIF(COUNT(*),0),2) AS repeat_pct,
      ROUND(AVG(revenue),2) AS customer_value FROM per_customer`,
    sellers: `SELECT s.seller_state AS state, COUNT(DISTINCT i.seller_id) AS sellers,
      ROUND(SUM(i.price),2) AS sales
      FROM fact_order_items i JOIN fact_orders o USING(order_id)
      JOIN dim_seller s USING(seller_id) WHERE ${period}
      GROUP BY 1 ORDER BY sales DESC LIMIT 10`,
    freight: `SELECT CASE WHEN o.freight_total < 10 THEN 'Under R$10'
      WHEN o.freight_total < 25 THEN 'R$10–24'
      WHEN o.freight_total < 50 THEN 'R$25–49'
      WHEN o.freight_total < 100 THEN 'R$50–99'
      ELSE 'R$100+' END AS band,
      COUNT(*) AS orders FROM fact_orders o
      WHERE ${period} AND o.freight_total IS NOT NULL GROUP BY 1
      ORDER BY CASE band WHEN 'Under R$10' THEN 1 WHEN 'R$10–24' THEN 2
      WHEN 'R$25–49' THEN 3 WHEN 'R$50–99' THEN 4 ELSE 5 END`,
    riskCalibration: `SELECT CAST(FLOOR(LEAST(0.99999,GREATEST(0,risk_probability))*10) AS INTEGER) AS decile,
       COUNT(*) AS orders, ROUND(100.0*AVG(CAST(actual_late AS DOUBLE)),2) AS observed_late_pct,
       ROUND(100.0*AVG(risk_probability),2) AS mean_risk_pct
       FROM risk_predictions GROUP BY 1 ORDER BY 1`
  }
}
