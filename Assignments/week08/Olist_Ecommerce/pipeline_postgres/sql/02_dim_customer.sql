-- ============================================================
-- dim_customer: Customer dimension with geolocation enrichment
-- ============================================================
-- PostgreSQL version: uses DISTINCT ON for deduplication
-- and INITCAP for title casing city names
-- ============================================================

DROP TABLE IF EXISTS dwh.dim_customer CASCADE;

CREATE TABLE dwh.dim_customer AS
WITH geo_dedup AS (
    SELECT
        geolocation_zip_code_prefix,
        AVG(geolocation_lat) AS latitude,
        AVG(geolocation_lng) AS longitude
    FROM staging.geolocation
    GROUP BY geolocation_zip_code_prefix
),
cust_dedup AS (
    SELECT DISTINCT ON (customer_unique_id)
        customer_unique_id,
        customer_city,
        customer_state,
        customer_zip_code_prefix
    FROM staging.customers
    ORDER BY customer_unique_id
)
SELECT
    ROW_NUMBER() OVER (ORDER BY c.customer_unique_id)::INTEGER AS customer_key,
    c.customer_unique_id,
    INITCAP(c.customer_city) AS customer_city,
    c.customer_state,
    c.customer_zip_code_prefix,
    g.latitude,
    g.longitude
FROM cust_dedup c
LEFT JOIN geo_dedup g
    ON c.customer_zip_code_prefix = g.geolocation_zip_code_prefix;
