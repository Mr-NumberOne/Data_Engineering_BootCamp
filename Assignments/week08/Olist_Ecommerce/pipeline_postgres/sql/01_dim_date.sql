-- ============================================================
-- dim_date: Calendar dimension generated from order date range
-- ============================================================
-- PostgreSQL version: uses generate_series with DATE type
-- and EXTRACT/TO_CHAR for date parts
-- ============================================================

DROP TABLE IF EXISTS dwh.dim_date CASCADE;

CREATE TABLE dwh.dim_date AS
WITH date_bounds AS (
    SELECT
        (MIN(order_purchase_timestamp::DATE) - INTERVAL '30 days')::DATE AS min_date,
        (MAX(order_purchase_timestamp::DATE) + INTERVAL '60 days')::DATE AS max_date
    FROM staging.orders
),
date_spine AS (
    SELECT d::DATE AS full_date
    FROM date_bounds,
         generate_series(min_date, max_date, '1 day'::INTERVAL) AS d
)
SELECT
    CAST(TO_CHAR(full_date, 'YYYYMMDD') AS INTEGER) AS date_key,
    full_date,
    EXTRACT(YEAR FROM full_date)::INTEGER            AS year,
    EXTRACT(QUARTER FROM full_date)::INTEGER         AS quarter,
    EXTRACT(MONTH FROM full_date)::INTEGER           AS month,
    TO_CHAR(full_date, 'Month')                      AS month_name,
    EXTRACT(DAY FROM full_date)::INTEGER             AS day,
    EXTRACT(DOW FROM full_date)::INTEGER             AS day_of_week,
    TO_CHAR(full_date, 'Day')                        AS day_name,
    CASE WHEN EXTRACT(DOW FROM full_date) IN (0, 6) THEN 1 ELSE 0 END AS is_weekend,
    EXTRACT(WEEK FROM full_date)::INTEGER            AS week_of_year,
    TO_CHAR(full_date, 'YYYY-MM')                    AS year_month
FROM date_spine
ORDER BY full_date;
