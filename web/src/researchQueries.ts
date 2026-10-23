/**
 * PromisePulse 4 — new, original empirical figure families.
 * Each result uses a clearly documented grain; no mock values or live events.
 * The 30 figures in these five families are ADDED to the existing 36-chart Atlas.
 */
import type {AtlasMetric,AtlasState,AtlasYear} from './atlasQueries'
import {ATLAS_STATES} from './atlasQueries'

export type ResearchGroupId='cohorts'|'promise'|'basket'|'weight'|'model'
export type ResearchGroup={id:ResearchGroupId;name:string;subtitle:string;grain:string;scope:string;metrics:AtlasMetric[]}
const M=(id:string,title:string,field:string,unit:AtlasMetric['unit'],shape:AtlasMetric['shape'],insight:string):AtlasMetric=>({id,title,field,unit,shape,insight})

export const RESEARCH_GROUPS:ResearchGroup[]=[
 {id:'cohorts',name:'Customer Cohort Observatory',subtitle:'First observed purchases, repeat activity and customer economics by cohort month',grain:'One row per customer_unique_id in filtered orders',scope:'First purchase is defined within the selected slice. Right-censoring makes recent repeat rates less mature.',metrics:[
  M('cohort-customers','Observed unique customers','customers','number','area','Number of customer-unique IDs assigned to their first observed purchase month within the filters.'),
  M('cohort-repeat','Observed repeat-order share','repeat_pct','percent','line','Share of observed customers with two or more orders; recent cohorts have shorter follow-up.'),
  M('cohort-frequency','Orders per observed customer','orders_per_customer','number','dots','Mean order count per customer in the selected source slice.'),
  M('cohort-value','Paid value per observed customer','payment_per_customer','brl','area','Mean sum of recorded payments per customer, not discounted lifetime value.'),
  M('cohort-ticket','Mean paid order value per customer','avg_ticket','brl','bars','Mean customer-specific payment per order; customers receive equal weight.'),
  M('cohort-review','Mean customer-level review score','avg_review','number','line','Only customers with recorded review outcomes contribute.')
 ]},
 {id:'promise',name:'Fulfillment Reliability Lab',subtitle:'Measured delivery versus promised window, without GPS or false operational clocks',grain:'One row per delivered order with valid purchase, promise and receipt dates',scope:'Promised-window bins depend on estimated vs purchase dates. Missing and undelivered outcomes are excluded.',metrics:[
  M('promise-orders','Deliveries by promised window','orders','number','bars','Eligible delivered orders grouped by the promised lead-time days.'),
  M('promise-late','Late share by promise window','late_pct','percent','dots','Known late outcomes and denominators within each promised window.'),
  M('promise-duration','Mean actual delivery duration','actual_days','days','line','Observed nonnegative purchase-to-receipt duration in days.'),
  M('promise-length','Mean estimated delivery window','promised_days','days','line','Purchase-to-estimated-delivery window, not a carrier SLA.'),
  M('promise-review','Review score versus promise window','review','number','dots','Observed review score associations only; no causal interpretation.'),
  M('promise-paid','Order payments versus promise window','payments','brl','area','Recorded order-grain payment sums, never multiplied by item joins.')
 ]},
 {id:'basket',name:'Basket Structure Science',subtitle:'Measure basket size against value, experience and late delivery',grain:'One order, grouped by recorded count of items',scope:'Only orders containing at least one item are included.',metrics:[
  M('basket-orders','Orders by basket size','orders','number','bars','Counts orders in each item-count band, not individual merchandise rows.'),
  M('basket-paid','Recorded payments by basket size','payments','brl','area','Order-level paid totals are summed once for each order.'),
  M('basket-ticket','Mean paid order value','avg_payment','brl','line','Average of recorded order payment totals.'),
  M('basket-freight','Mean recorded item freight total','avg_freight','brl','dots','Freight total is the sum of listed item freight on an order, not carrier costs.'),
  M('basket-late','Late share by basket size','late_pct','percent','dots','Eligible delivered outcomes are the only lateness denominator.'),
  M('basket-review','Mean review score by basket size','review','number','line','Only recorded reviews contribute to the score.')
 ]},
 {id:'weight',name:'Merchandise & Freight Physics',subtitle:'Weight bands, merchandise price and item-level shipping observations',grain:'One order item joined to a product weight',scope:'Unknown/negative product weights are excluded; weight is product metadata, not measured package mass.',metrics:[
  M('weight-items','Item count by product weight','items','number','bars','Distinct item rows in each recorded product-weight interval.'),
  M('weight-orders','Orders represented in weight bands','orders','number','area','Distinct orders within each band; the same order can appear in multiple bands.'),
  M('weight-sales','Item merchandise sales by weight','sales','brl','area','Sum of item prices; it is not collected order payment revenue.'),
  M('weight-price','Mean observed item price','avg_price','brl','line','Price per individual item, without order-level multiplication.'),
  M('weight-freight','Mean listed item freight','avg_freight','brl','dots','Displayed freight amounts are marketplace listing values, not realized carrier bills.'),
  M('weight-freightshare','Listed freight as a share of price+freight','freight_pct','percent','line','Percentage of gross price plus listed freight; not profit or cost of delivery.')
 ]},
 {id:'model',name:'AI Evidence Studio',subtitle:'Real held-out classification probabilities, lift and risk concentration',grain:'One historical test prediction per order; fixed evaluated cohort',scope:'Order-year filter does not apply to this fixed test cohort. State filter applies only to held-out customer state.',metrics:[
  M('model-population','Evaluated orders by predicted risk band','orders','number','bars','Test prediction count in each absolute 10-percentage-point risk band.'),
  M('model-events','Observed late deliveries per band','late_events','number','bars','Known positive test labels, not model predictions.'),
  M('model-observed','Observed late frequency by band','observed_pct','percent','dots','Actual fraction of delivered-late labels in a probability band.'),
  M('model-predicted','Mean model risk by band','predicted_pct','percent','line','Average held-out predicted probability within each band.'),
  M('model-lift','Observed lift versus test prevalence','lift','number','area','Observed late frequency divided by overall test prevalence for the selected state.'),
  M('model-capture','Share of all late outcomes by band','capture_pct','percent','dots','Fraction of observed late events falling inside each bin; not cumulative recall.')
 ]}
]
export const NEW_CHART_COUNT=RESEARCH_GROUPS.reduce((n,g)=>n+g.metrics.length,0)

function where(year:AtlasYear,state:AtlasState){
 if(!(['all','2016','2017','2018'] as string[]).includes(year))throw new Error('Invalid historical year')
 if(!ATLAS_STATES.includes(state))throw new Error('Invalid Brazilian state')
 return {
  year:year==='all'?'TRUE':`EXTRACT(YEAR FROM o.purchase_ts)=${Number(year)}`,
  state:state==='ALL'?'TRUE':`c.customer_state='${state}'`,
  holdout:state==='ALL'?'TRUE':`customer_state='${state}'`,
 }
}

/** Queries return grouped, safe numeric aggregates only. No customer-row export. */
export function researchQuery(group:ResearchGroupId,year:AtlasYear,state:AtlasState):string{
 const f=where(year,state)
 const O=`FROM fact_orders o JOIN dim_customer c USING(customer_id) WHERE o.purchase_ts IS NOT NULL AND ${f.year} AND ${f.state}`
 const bucket=`CASE WHEN o.item_count=1 THEN '01 · 1 item' WHEN o.item_count=2 THEN '02 · 2 items' WHEN o.item_count=3 THEN '03 · 3 items' WHEN o.item_count=4 THEN '04 · 4 items' ELSE '05 · 5+ items' END`
 const promised=`date_diff('day',o.purchase_ts,o.estimated_delivery_ts)`
 const actual=`date_diff('day',o.purchase_ts,o.delivered_ts)`
 const promisedBand=`CASE WHEN promise_days<=7 THEN '01 · 0–7d' WHEN promise_days<=14 THEN '02 · 8–14d' WHEN promise_days<=21 THEN '03 · 15–21d' WHEN promise_days<=30 THEN '04 · 22–30d' ELSE '05 · 31+d' END`
 const weightBand=`CASE WHEN p.weight_g<250 THEN '01 · <250g' WHEN p.weight_g<500 THEN '02 · 250–499g' WHEN p.weight_g<1000 THEN '03 · 500–999g' WHEN p.weight_g<2000 THEN '04 · 1–1.99kg' WHEN p.weight_g<5000 THEN '05 · 2–4.99kg' ELSE '06 · 5kg+' END`
 switch(group){
 case 'cohorts': return `WITH selected AS (
   SELECT o.order_id,o.purchase_ts,o.payment_total,o.review_score,c.customer_unique_id
   ${O} AND c.customer_unique_id IS NOT NULL
 ), customer_observations AS (
   SELECT customer_unique_id,MIN(purchase_ts) AS first_observed,
          COUNT(*) AS customer_orders,SUM(payment_total) AS payments,
          ROUND(AVG(review_score),4) AS review
   FROM selected GROUP BY 1
 )
 SELECT strftime(first_observed,'%Y-%m') AS label,
        COUNT(*) AS customers,
        ROUND(100.0*COUNT(*) FILTER(WHERE customer_orders>=2)/NULLIF(COUNT(*),0),2) AS repeat_pct,
        ROUND(AVG(customer_orders),2) AS orders_per_customer,
        ROUND(AVG(payments),2) AS payment_per_customer,
        ROUND(AVG(payments/NULLIF(customer_orders,0)),2) AS avg_ticket,
        ROUND(AVG(review),2) AS avg_review
 FROM customer_observations GROUP BY 1 ORDER BY 1`
 case 'promise':return `WITH deliveries AS (
   SELECT o.*, ${promised} AS promise_days, ${actual} AS actual_days
   ${O} AND o.order_status='delivered'
       AND o.estimated_delivery_ts>=o.purchase_ts AND o.delivered_ts>=o.purchase_ts
 )
 SELECT ${promisedBand} AS label,
    COUNT(*) AS orders,
    COUNT(is_late) AS labeled_orders,
    COUNT(*) FILTER(WHERE is_late=true) AS late_orders,
    ROUND(100.0*COUNT(*) FILTER(WHERE is_late=true)/NULLIF(COUNT(is_late),0),2) AS late_pct,
    ROUND(AVG(actual_days),2) AS actual_days,
    ROUND(AVG(promise_days),2) AS promised_days,
    ROUND(AVG(review_score),2) AS review,
    ROUND(SUM(payment_total),2) AS payments
 FROM deliveries GROUP BY 1 ORDER BY 1`
 case 'basket':return `SELECT ${bucket} AS label,
    COUNT(*) AS orders,ROUND(SUM(o.payment_total),2) AS payments,
    ROUND(AVG(o.payment_total),2) AS avg_payment,
    ROUND(AVG(o.freight_total),2) AS avg_freight,
    COUNT(o.is_late) AS labeled_orders,
    COUNT(*) FILTER(WHERE o.is_late=true) AS late_orders,
    ROUND(100.0*COUNT(*) FILTER(WHERE o.is_late=true)/NULLIF(COUNT(o.is_late),0),2) AS late_pct,
    ROUND(AVG(o.review_score),2) AS review
    ${O} AND o.item_count>=1 GROUP BY 1 ORDER BY 1`
 case 'weight':return `SELECT ${weightBand} AS label,
    COUNT(*) AS items,COUNT(DISTINCT i.order_id) AS orders,
    ROUND(SUM(i.price),2) AS sales,
    ROUND(AVG(i.price),2) AS avg_price,
    ROUND(AVG(i.freight_value),2) AS avg_freight,
    ROUND(100.0*SUM(i.freight_value)/NULLIF(SUM(i.price+i.freight_value),0),2) AS freight_pct
    FROM fact_order_items i
    JOIN dim_product p USING(product_id)
    JOIN fact_orders o USING(order_id)
    JOIN dim_customer c USING(customer_id)
    WHERE o.purchase_ts IS NOT NULL AND ${f.year} AND ${f.state}
    AND p.weight_g IS NOT NULL AND p.weight_g>=0
    GROUP BY 1 ORDER BY 1`
 case 'model':return `WITH eligible AS (
    SELECT LEAST(0.999999,GREATEST(0,risk_probability)) AS p,CAST(actual_late AS DOUBLE) AS y
    FROM risk_predictions WHERE risk_probability IS NOT NULL
       AND actual_late IS NOT NULL AND ${f.holdout}
 ), baseline AS (SELECT AVG(y) AS prevalence,SUM(y) AS events FROM eligible),
 cells AS (
    SELECT CAST(FLOOR(p*10) AS INTEGER) AS bin,
    COUNT(*) AS orders,ROUND(SUM(y),0) AS late_events,
    ROUND(AVG(p)*100,2) AS predicted_pct,
    ROUND(AVG(y)*100,2) AS observed_pct,
    ROUND(AVG(y),8) AS observed_raw FROM eligible GROUP BY 1
 )
 SELECT CAST(bin*10 AS VARCHAR)||'–'||CAST((bin+1)*10 AS VARCHAR)||'%' AS label,
     orders,late_events,predicted_pct,observed_pct,
     ROUND(observed_raw/NULLIF(b.prevalence,0),2) AS lift,
     ROUND(100.0*late_events/NULLIF(b.events,0),2) AS capture_pct
 FROM cells CROSS JOIN baseline b ORDER BY bin`
 }
}
