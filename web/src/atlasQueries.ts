/**
 * Reproducible historical analytical views for Analytics Atlas.
 *
 * Facts use one grain at a time:
 *   order lens = fact_orders, payment_total counted once per order
 *   item lens = fact_order_items, item price/freight (NEVER payment_total)
 * Privacy: state/year filters are validated against a fixed allowlist.
 * These are observational, descriptive aggregations; never causal claims.
 */
export type AtlasLens='commerce'|'weekday'|'hour'|'geography'|'delivery'|'reviews'|'category'|'sellers'|'laboratory'
export type AtlasYear='all'|'2016'|'2017'|'2018'
export type AtlasState='ALL'|'AC'|'AL'|'AP'|'AM'|'BA'|'CE'|'DF'|'ES'|'GO'|'MA'|'MT'|'MS'|'MG'|'PA'|'PB'|'PR'|'PE'|'PI'|'RJ'|'RN'|'RS'|'RO'|'RR'|'SC'|'SP'|'SE'|'TO'
export const ATLAS_STATES:AtlasState[]=['ALL','AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
export type AtlasShape='bars'|'line'|'area'|'dots'
export type AtlasMetric={
  id:string;title:string;field:string;unit:'number'|'brl'|'percent'|'days';shape:AtlasShape;
  insight:string;
}
export type AtlasGroup={
  id:AtlasLens;title:string;subtitle:string;grain:string;metrics:AtlasMetric[];
}
const metric=(id:string,title:string,field:string,unit:AtlasMetric['unit'],shape:AtlasShape,insight:string):AtlasMetric=>({id,title,field,unit,shape,insight})
export const ATLAS_GROUPS:AtlasGroup[]=[
  {id:'commerce',title:'Commercial pulse',subtitle:'Growth, revenue and delivery friction over purchase months',grain:'One row per order · purchase month',metrics:[
    metric('monthly-orders','Order volume by month','orders','number','area','Order counts capture transaction frequency, not unique customer retention.'),
    metric('monthly-payments','Recorded payments by month','payment_revenue','brl','bars','Sums order-level payment totals without multiplying by items.'),
    metric('monthly-ticket','Average paid value by month','avg_payment','brl','line','Only orders with observed payment totals contribute to the mean.'),
    metric('monthly-delay','Late delivery share by month','late_pct','percent','dots','Denominator is delivered orders with known punctuality, not all purchases.')
  ]},
  {id:'weekday',title:'Weekly behavior',subtitle:'Purchase-day comparisons with unambiguous seven-day bins',grain:'One row per order · purchase weekday',metrics:[
    metric('weekday-volume','Purchases by weekday','orders','number','bars','The weekday is based on order purchase timestamp.'),
    metric('weekday-payment','Payments by weekday','payment_revenue','brl','area','Recorded payments at order grain, not order-item turnover.'),
    metric('weekday-late','Late share by purchase weekday','late_pct','percent','dots','A descriptive association rather than weekday causation.'),
    metric('weekday-speed','Mean delivery duration by weekday','delivery_days','days','line','Measured from purchase to receipt for nonnegative observed durations.')
  ]},
  {id:'hour',title:'Hourly demand',subtitle:'Transaction timestamps, order value and late-outcome patterns',grain:'One row per order · purchase hour',metrics:[
    metric('hour-volume','Purchases by hour','orders','number','area','Hours reflect the timestamps supplied in the original dataset.'),
    metric('hour-payment','Recorded payment by hour','payment_revenue','brl','bars','Actual payments are aggregated at order grain.'),
    metric('hour-ticket','Average payment by hour','avg_payment','brl','line','Only non-null recorded payment totals enter averages.'),
    metric('hour-late','Late delivery share by hour','late_pct','percent','dots','The late label is known only for eligible delivered orders.')
  ]},
  {id:'geography',title:'Regional comparisons',subtitle:'State-level volume, paid value, delivery outcomes and duration',grain:'Customer state · order grain',metrics:[
    metric('state-volume','Historical orders by state','orders','number','bars','Customer state is not a live vehicle coordinate.'),
    metric('state-payment','Recorded payment by state','payment_revenue','brl','area','No payment-to-item join; totals remain reconciled.'),
    metric('state-late','Observed late share by state','late_pct','percent','dots','Small regions can have unstable rates; inspect sample counts.'),
    metric('state-speed','Delivery duration by state','delivery_days','days','Purchase-to-receipt means on observed valid deliveries.')
  ]},
  {id:'delivery',title:'Fulfillment anatomy',subtitle:'Nonnegative observed purchase-to-receipt duration buckets',grain:'Delivered orders with two timestamps',metrics:[
    metric('duration-volume','Delivery-time distribution','orders','number','bars','Observational duration bands; missing timestamps are excluded.'),
    metric('duration-payment','Payments across delivery-time bands','payment_revenue','brl','area','Payments of eligible orders, not delivery fee revenue.'),
    metric('duration-late','Late share by duration band','late_pct','percent','dots','Promised lead time differs by order; longer durations need not imply lateness.'),
    metric('duration-rating','Mean review score by duration','avg_review','number','line','Reviews are observational; missing review scores are excluded.')
  ]},
  {id:'reviews',title:'Customer experience',subtitle:'Review score distribution and conditional delivery characteristics',grain:'Orders with recorded review score',metrics:[
    metric('review-volume','Orders by rounded review score','orders','number','bars','Scores are grouped into 1–5 integer buckets, using rounded mean reviews.'),
    metric('review-payment','Payments by review score','payment_revenue','brl','area','Payment is at order grain; no item-level multiplication.'),
    metric('review-late','Late share by review score','late_pct','percent','dots','Associational only: late deliveries may coincide with poor reviews.'),
    metric('review-speed','Duration by review score','delivery_days','days','Only observed nonnegative delivery durations enter means.')
  ]},
  {id:'category',title:'Product economics',subtitle:'Item sales and shipping costs without mixing payment grain',grain:'One item per row · translated product category',metrics:[
    metric('cat-items','Items sold by category','items','number','bars','Counts order-item rows rather than distinct orders.'),
    metric('cat-sales','Item merchandise sales by category','item_sales','brl','area','Price sum only; not reconciled payment revenue.'),
    metric('cat-price','Mean product selling price','avg_price','brl','dots','Unit prices are averaged across order-item observations.'),
    metric('cat-freight','Freight share of price plus freight','freight_pct','percent','line','Freight/(merchandise price + freight), where nonzero.')
  ]},
  {id:'sellers',title:'Seller geography',subtitle:'Actual seller locations and item-level marketplace activity',grain:'Seller state · order-item grain',metrics:[
    metric('seller-coverage','Distinct sellers by home state','sellers','number','bars','Seller-state supply footprint; no fabricated facilities.'),
    metric('seller-items','Items fulfilled by seller state','items','number','area','Item counts represent sold items rather than unique orders.'),
    metric('seller-sales','Merchandise sales by seller state','item_sales','brl','bars','Summed item price, not order payment totals.'),
    metric('seller-freight','Mean listed freight by seller state','avg_freight','brl','dots','Freight is per item, not an estimate of shipment costs.')
  ]},
  {id:'laboratory',title:'Research laboratory',subtitle:'Linked two-dimensional distributions and held-out model diagnostics',grain:'Order-level, item-independent cross-tabs · held-out predictions',metrics:[
    metric('lab-weekhour','Purchase intensity · weekday × hour','orders','number','bars','Counts all eligible historical orders for each weekday-hour cell.'),
    metric('lab-state-month','Regional seasonality · state × month','orders','number','bars','State/month order counts reflect observed historical footprint.'),
    metric('lab-review-late','Review outcomes · score × punctuality','orders','number','bars','Shows conditional recorded review and known delivery outcomes.'),
    metric('lab-risk','Risk calibration · held-out deciles','observed_pct','percent','dots','Only evaluated held-out predictions; associations not real-time scoring.')
  ]}
]
export const ATLAS_CHART_COUNT=ATLAS_GROUPS.reduce((sum,g)=>sum+g.metrics.length,0)

function validated(year:AtlasYear,state:AtlasState){
  if(!['all','2016','2017','2018'].includes(year))throw new Error('Invalid year')
  if(!ATLAS_STATES.includes(state))throw new Error('Invalid state')
  return {
    year:year==='all'?'TRUE':\`EXTRACT(YEAR FROM o.purchase_ts)=\${Number(year)}\`,
    state:state==='ALL'?'TRUE':\`c.customer_state='\${state}'\`
  }
}
const O=\`FROM fact_orders o LEFT JOIN dim_customer c USING(customer_id)\`
const duration=\`date_diff('day',o.purchase_ts,o.delivered_ts)\`
const measures=\`COUNT(*) AS orders, ROUND(SUM(o.payment_total),2) AS payment_revenue,
ROUND(AVG(o.payment_total),2) AS avg_payment,
COUNT(o.is_late) AS labeled_orders,
ROUND(100.0*COUNT(*) FILTER(WHERE o.is_late=true)/NULLIF(COUNT(o.is_late),0),2) AS late_pct,
ROUND(AVG(\${duration}) FILTER(WHERE o.delivered_ts>=o.purchase_ts AND o.purchase_ts IS NOT NULL),2) AS delivery_days\`

export function atlasQuery(lens:AtlasLens,year:AtlasYear,state:AtlasState,modelEvaluated=false):string{
  const f=validated(year,state)
  const wh=\`WHERE o.purchase_ts IS NOT NULL AND \${f.year} AND \${f.state}\`
  switch(lens){
    case 'commerce': return \`SELECT strftime(o.purchase_ts,'%Y-%m') AS label,\${measures} \${O} \${wh} GROUP BY 1 ORDER BY 1\`
    case 'weekday': return \`SELECT CAST(EXTRACT(DOW FROM o.purchase_ts) AS VARCHAR) AS label,\${measures} \${O} \${wh} GROUP BY 1 ORDER BY 1\`
    case 'hour': return \`SELECT lpad(CAST(EXTRACT(HOUR FROM o.purchase_ts) AS VARCHAR),2,'0') AS label,\${measures} \${O} \${wh} GROUP BY 1 ORDER BY 1\`
    case 'geography': return \`SELECT c.customer_state AS label,\${measures} \${O} \${wh} AND c.customer_state IS NOT NULL GROUP BY 1 ORDER BY orders DESC\`
    case 'delivery': return \`SELECT CASE WHEN \${duration}<=7 THEN '01 · 0–7d' WHEN \${duration}<=14 THEN '02 · 8–14d' WHEN \${duration}<=21 THEN '03 · 15–21d' WHEN \${duration}<=30 THEN '04 · 22–30d' ELSE '05 · 31+d' END AS label,
       \${measures},ROUND(AVG(o.review_score),2) AS avg_review
       \${O} \${wh} AND o.delivered_ts>=o.purchase_ts AND o.order_status='delivered' GROUP BY 1 ORDER BY 1\`
    case 'reviews': return \`SELECT CAST(CAST(ROUND(o.review_score) AS INTEGER) AS VARCHAR) AS label,
       \${measures} \${O} \${wh} AND o.review_score BETWEEN 1 AND 5 GROUP BY 1 ORDER BY 1\`
    case 'category': return \`SELECT COALESCE(p.category,'Unknown') AS label,
       COUNT(*) AS items,ROUND(SUM(i.price),2) AS item_sales,
       ROUND(AVG(i.price),2) AS avg_price,ROUND(SUM(i.freight_value),2) AS freight_total,
       ROUND(100.0*SUM(i.freight_value)/NULLIF(SUM(i.price+i.freight_value),0),2) AS freight_pct
       FROM fact_order_items i JOIN fact_orders o USING(order_id)
       LEFT JOIN dim_customer c USING(customer_id)
       LEFT JOIN dim_product p USING(product_id)
       \${wh} GROUP BY 1 ORDER BY item_sales DESC NULLS LAST LIMIT 16\`
    case 'sellers': return \`SELECT s.seller_state AS label,
       COUNT(DISTINCT i.seller_id) AS sellers,COUNT(*) AS items,
       ROUND(SUM(i.price),2) AS item_sales,ROUND(AVG(i.freight_value),2) AS avg_freight
       FROM fact_order_items i JOIN fact_orders o USING(order_id)
       LEFT JOIN dim_customer c USING(customer_id)
       JOIN dim_seller s USING(seller_id)
       \${wh} AND s.seller_state IS NOT NULL GROUP BY 1 ORDER BY item_sales DESC NULLS LAST\`
    case 'laboratory': throw new Error('Use atlasLabQueries for matrix views')
  }
}

/** Full drill-downs are intentionally limited to aggregate cells (no customer-level disclosure). */
export function atlasLabQueries(year:AtlasYear,state:AtlasState,modelEvaluated:boolean){
  const f=validated(year,state)
  const wh=\`WHERE o.purchase_ts IS NOT NULL AND \${f.year} AND \${f.state}\`
  const all:{
    weekhour:string;statemonth:string;reviewlate:string;calibration:string|null
  }={
    weekhour:\`SELECT CAST(EXTRACT(DOW FROM o.purchase_ts) AS VARCHAR) AS y,
       lpad(CAST(EXTRACT(HOUR FROM o.purchase_ts) AS VARCHAR),2,'0') AS x,
       COUNT(*) AS orders \${O} \${wh} GROUP BY 1,2 ORDER BY 1,2\`,
    statemonth:\`SELECT c.customer_state AS y,strftime(o.purchase_ts,'%Y-%m') AS x,
       COUNT(*) AS orders \${O} \${wh} AND c.customer_state IS NOT NULL
       GROUP BY 1,2 ORDER BY 1,2\`,
    reviewlate:\`SELECT CAST(CAST(ROUND(o.review_score) AS INTEGER) AS VARCHAR) AS y,
       CASE WHEN o.is_late THEN 'Late' ELSE 'On time' END AS x,
       COUNT(*) AS orders \${O} \${wh} AND o.review_score BETWEEN 1 AND 5
       AND o.is_late IS NOT NULL GROUP BY 1,2 ORDER BY 1,2\`,
    calibration:modelEvaluated?\`SELECT CAST(FLOOR(LEAST(0.999999,GREATEST(0,risk_probability))*10) AS INTEGER) AS decile,
       COUNT(*) AS orders, ROUND(100.0*AVG(CAST(actual_late AS DOUBLE)),2) AS observed_pct,
       ROUND(100.0*AVG(risk_probability),2) AS predicted_pct
       FROM risk_predictions
       \${state==='ALL'?'WHERE TRUE':\`WHERE customer_state='\${state}'\`}
       GROUP BY 1 ORDER BY 1\`:null
  }
  return all
}
