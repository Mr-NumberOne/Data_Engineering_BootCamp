-- ============================================================
-- OLIST DATA WAREHOUSE — ANALYTICAL QUERIES (PostgreSQL)
-- ============================================================
-- Run against PostgreSQL database: olist_dwh
-- All DWH tables are in the 'dwh' schema.
-- ============================================================


-- ============================================================
-- Q1: SALES TRENDING OVER TIME
-- Monthly revenue with month-over-month growth percentage
-- ============================================================
-- Business value: Identifies seasonal patterns and growth trajectory
-- ============================================================

SELECT
    d.year_month,
    d.year,
    d.month,
    d.month_name,
    COUNT(DISTINCT f.order_id)              AS total_orders,
    COUNT(f.order_item_key)                 AS total_items,
    ROUND(SUM(f.price)::NUMERIC, 2)        AS revenue,
    ROUND(SUM(f.freight_value)::NUMERIC, 2) AS freight_revenue,
    ROUND((SUM(f.price) + SUM(f.freight_value))::NUMERIC, 2) AS total_revenue,
    ROUND((
        (SUM(f.price) - LAG(SUM(f.price)) OVER (ORDER BY d.year, d.month))
        / NULLIF(LAG(SUM(f.price)) OVER (ORDER BY d.year, d.month), 0) * 100
    )::NUMERIC, 1) AS revenue_mom_growth_pct
FROM dwh.fact_order_items f
INNER JOIN dwh.dim_date d ON f.purchase_date_key = d.date_key
GROUP BY d.year_month, d.year, d.month, d.month_name
ORDER BY d.year, d.month;


-- ============================================================
-- Q2: MOST VALUABLE CUSTOMERS (RFM Analysis)
-- Recency, Frequency, Monetary segmentation
-- ============================================================
-- Business value: Identifies high-value customers for retention
-- campaigns and VIP programs
-- ============================================================

WITH customer_metrics AS (
    SELECT
        f.customer_key,
        dc.customer_city,
        dc.customer_state,
        COUNT(DISTINCT f.order_id)   AS order_count,
        ROUND(SUM(f.price)::NUMERIC, 2)      AS total_spent,
        ROUND(AVG(f.price)::NUMERIC, 2)      AS avg_order_value,
        MAX(d.full_date)             AS last_order_date,
        MIN(d.full_date)             AS first_order_date
    FROM dwh.fact_order_items f
    INNER JOIN dwh.dim_customer dc ON f.customer_key = dc.customer_key
    INNER JOIN dwh.dim_date d ON f.purchase_date_key = d.date_key
    GROUP BY f.customer_key, dc.customer_city, dc.customer_state
)
SELECT
    customer_key,
    customer_city,
    customer_state,
    order_count,
    total_spent,
    avg_order_value,
    first_order_date,
    last_order_date,
    CASE
        WHEN order_count >= 3 AND total_spent >= 500 THEN 'VIP'
        WHEN order_count >= 2 OR total_spent >= 300  THEN 'Loyal'
        WHEN total_spent >= 100                      THEN 'Regular'
        ELSE 'New'
    END AS customer_segment
FROM customer_metrics
ORDER BY total_spent DESC
LIMIT 20;


-- ============================================================
-- Q3: DELIVERY PERFORMANCE ANALYSIS
-- Late delivery rate by state and overall metrics
-- ============================================================
-- Business value: Identifies logistics bottlenecks and 
-- geographic areas with delivery issues
-- ============================================================

SELECT
    dc.customer_state,
    COUNT(*)                                               AS total_deliveries,
    ROUND(AVG(f.delivery_days)::NUMERIC, 1)                AS avg_delivery_days,
    ROUND(AVG(f.estimated_delivery_days)::NUMERIC, 1)      AS avg_estimated_days,
    ROUND(AVG(f.delivery_days - f.estimated_delivery_days)::NUMERIC, 1) AS avg_days_vs_estimate,
    SUM(f.is_late_delivery)                                AS late_deliveries,
    ROUND(
        SUM(f.is_late_delivery) * 100.0 / NULLIF(COUNT(f.is_late_delivery), 0)
    , 1)::NUMERIC AS late_delivery_pct,
    ROUND(AVG(CASE WHEN f.is_late_delivery = 1 
              THEN f.delivery_days - f.estimated_delivery_days END)::NUMERIC, 1) 
        AS avg_days_late_when_late
FROM dwh.fact_order_items f
INNER JOIN dwh.dim_customer dc ON f.customer_key = dc.customer_key
WHERE f.delivery_days IS NOT NULL
  AND f.is_late_delivery IS NOT NULL
GROUP BY dc.customer_state
ORDER BY late_delivery_pct DESC;


-- ============================================================
-- Q4: TOP PRODUCT CATEGORIES BY REVENUE
-- Revenue, volume, and average review score per category
-- ============================================================
-- Business value: Identifies which product categories drive
-- revenue and which have quality issues (low reviews)
-- ============================================================

SELECT
    dp.product_category_name_english          AS category,
    COUNT(DISTINCT f.order_id)                AS orders,
    COUNT(f.order_item_key)                   AS items_sold,
    ROUND(SUM(f.price)::NUMERIC, 2)           AS revenue,
    ROUND(AVG(f.price)::NUMERIC, 2)           AS avg_price,
    ROUND((SUM(f.price) * 100.0 / SUM(SUM(f.price)) OVER ())::NUMERIC, 1) AS revenue_share_pct,
    ROUND(AVG(r.review_score)::NUMERIC, 2)    AS avg_review_score
FROM dwh.fact_order_items f
INNER JOIN dwh.dim_product dp ON f.product_key = dp.product_key
LEFT JOIN dwh.fact_reviews r ON f.order_id = r.order_id
GROUP BY dp.product_category_name_english
ORDER BY revenue DESC
LIMIT 15;


-- ============================================================
-- Q5: PAYMENT METHOD ANALYSIS
-- Distribution, average value, and installment patterns
-- ============================================================
-- Business value: Understanding payment preferences helps
-- optimize checkout flow and financial planning
-- ============================================================

SELECT
    pt.payment_type,
    COUNT(*)                                  AS transaction_count,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER ())::NUMERIC, 1) AS pct_of_transactions,
    ROUND(SUM(fp.payment_value)::NUMERIC, 2)  AS total_value,
    ROUND(AVG(fp.payment_value)::NUMERIC, 2)  AS avg_value,
    ROUND(AVG(fp.payment_installments)::NUMERIC, 1) AS avg_installments,
    MAX(fp.payment_installments)              AS max_installments
FROM dwh.fact_payments fp
INNER JOIN dwh.dim_payment_type pt ON fp.payment_type_key = pt.payment_type_key
GROUP BY pt.payment_type
ORDER BY total_value DESC;


-- ============================================================
-- Q6: SELLER PERFORMANCE DASHBOARD
-- Top sellers by revenue with delivery and review metrics
-- ============================================================
-- Business value: Identifies best and worst performing sellers
-- for marketplace management decisions
-- ============================================================

SELECT
    ds.seller_key,
    ds.seller_city,
    ds.seller_state,
    COUNT(DISTINCT f.order_id)                AS orders_fulfilled,
    COUNT(f.order_item_key)                   AS items_sold,
    ROUND(SUM(f.price)::NUMERIC, 2)           AS total_revenue,
    ROUND(AVG(f.delivery_days)::NUMERIC, 1)   AS avg_delivery_days,
    ROUND((
        SUM(f.is_late_delivery) * 100.0 / NULLIF(COUNT(f.is_late_delivery), 0)
    )::NUMERIC, 1) AS late_pct,
    ROUND(AVG(r.review_score)::NUMERIC, 2)    AS avg_review_score
FROM dwh.fact_order_items f
INNER JOIN dwh.dim_seller ds ON f.seller_key = ds.seller_key
LEFT JOIN dwh.fact_reviews r ON f.order_id = r.order_id
WHERE f.delivery_days IS NOT NULL
GROUP BY ds.seller_key, ds.seller_city, ds.seller_state
HAVING COUNT(f.order_item_key) >= 10
ORDER BY total_revenue DESC
LIMIT 20;


-- ============================================================
-- Q7: SEASONAL & DAY-OF-WEEK PATTERNS
-- Order volume and revenue by day of week
-- ============================================================
-- Business value: Optimizes marketing spend timing and
-- operational staffing decisions
-- ============================================================

SELECT
    d.day_name,
    d.day_of_week,
    COUNT(DISTINCT f.order_id)    AS orders,
    ROUND(SUM(f.price)::NUMERIC, 2) AS revenue,
    ROUND(AVG(f.price)::NUMERIC, 2) AS avg_item_price,
    d.is_weekend
FROM dwh.fact_order_items f
INNER JOIN dwh.dim_date d ON f.purchase_date_key = d.date_key
GROUP BY d.day_name, d.day_of_week, d.is_weekend
ORDER BY d.day_of_week;


-- ============================================================
-- Q8: LEAD CONVERSION FUNNEL
-- Conversion rate by origin with average conversion time
-- ============================================================
-- Business value: Identifies most effective acquisition channels
-- and informs marketing budget allocation
-- ============================================================

SELECT
    origin,
    COUNT(*)                                   AS total_leads,
    SUM(is_converted)                          AS converted_leads,
    ROUND((SUM(is_converted) * 100.0 / COUNT(*))::NUMERIC, 1) AS conversion_rate_pct,
    ROUND(AVG(CASE WHEN is_converted = 1 THEN conversion_days END)::NUMERIC, 1) 
        AS avg_conversion_days,
    ROUND(AVG(CASE WHEN is_converted = 1 THEN declared_monthly_revenue END)::NUMERIC, 2) 
        AS avg_declared_revenue
FROM dwh.fact_leads
GROUP BY origin
ORDER BY conversion_rate_pct DESC;


-- ============================================================
-- Q9: GEOGRAPHIC REVENUE DISTRIBUTION
-- Revenue and customer concentration by state
-- ============================================================
-- Business value: Identifies market penetration by geography
-- and opportunities for expansion
-- ============================================================

SELECT
    dc.customer_state                         AS state,
    COUNT(DISTINCT f.customer_key)            AS unique_customers,
    COUNT(DISTINCT f.order_id)                AS total_orders,
    ROUND(SUM(f.price)::NUMERIC, 2)           AS total_revenue,
    ROUND((SUM(f.price) / COUNT(DISTINCT f.customer_key))::NUMERIC, 2) AS revenue_per_customer,
    ROUND((SUM(f.price) * 100.0 / SUM(SUM(f.price)) OVER ())::NUMERIC, 1) AS revenue_share_pct,
    ROUND((
        SUM(SUM(f.price)) OVER (ORDER BY SUM(f.price) DESC) * 100.0 
        / SUM(SUM(f.price)) OVER ()
    )::NUMERIC, 1) AS cumulative_revenue_pct
FROM dwh.fact_order_items f
INNER JOIN dwh.dim_customer dc ON f.customer_key = dc.customer_key
GROUP BY dc.customer_state
ORDER BY total_revenue DESC;


-- ============================================================
-- Q10: CUSTOMER COHORT ANALYSIS
-- Repeat purchase rate by first-order month
-- ============================================================
-- Business value: Measures customer retention and identifies
-- whether newer cohorts are more or less engaged
-- ============================================================

WITH customer_orders AS (
    SELECT
        f.customer_key,
        d.year_month AS order_month,
        ROW_NUMBER() OVER (PARTITION BY f.customer_key ORDER BY MIN(d.full_date)) AS order_seq
    FROM dwh.fact_order_items f
    INNER JOIN dwh.dim_date d ON f.purchase_date_key = d.date_key
    GROUP BY f.customer_key, d.year_month
),
cohorts AS (
    SELECT
        customer_key,
        order_month AS cohort_month
    FROM customer_orders
    WHERE order_seq = 1
)
SELECT
    c.cohort_month,
    COUNT(DISTINCT c.customer_key) AS cohort_size,
    COUNT(DISTINCT CASE WHEN co.order_seq > 1 THEN c.customer_key END) AS repeat_customers,
    ROUND((
        COUNT(DISTINCT CASE WHEN co.order_seq > 1 THEN c.customer_key END) * 100.0 
        / COUNT(DISTINCT c.customer_key)
    )::NUMERIC, 1) AS repeat_rate_pct
FROM cohorts c
LEFT JOIN customer_orders co ON c.customer_key = co.customer_key
GROUP BY c.cohort_month
ORDER BY c.cohort_month;
