-- ============================================================
-- dim_customer: SCD Type 2 — Customer dimension
-- ============================================================
-- Tracks historical changes in customer geographic attributes.
-- Each geographic "version" gets its own row with temporal
-- boundaries (valid_from / valid_to) and a current-row flag.
-- Unknown member row inserted at customer_key = -1.
--
-- SCD2 detection logic:
--   1. Join customers → orders to get geo profile per timestamp
--   2. LAG() detects when (city, state, zip) changes
--   3. SUM() over change flags assigns a version group
--   4. LEAD(valid_from) computes valid_to for each version
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

-- Step 1: Each customer appearance with its order timestamp
customer_orders AS (
    SELECT
        c.customer_unique_id,
        c.customer_city,
        c.customer_state,
        c.customer_zip_code_prefix,
        o.order_purchase_timestamp,
        ROW_NUMBER() OVER (
            PARTITION BY c.customer_unique_id
            ORDER BY o.order_purchase_timestamp, c.customer_id
        ) AS rn
    FROM staging.customers c
    INNER JOIN staging.orders o ON c.customer_id = o.customer_id
),

-- Step 2: Flag rows where the geographic profile changed
change_flags AS (
    SELECT *,
        CASE WHEN
            LAG(customer_city) OVER w IS DISTINCT FROM customer_city
            OR LAG(customer_state) OVER w IS DISTINCT FROM customer_state
            OR LAG(customer_zip_code_prefix) OVER w IS DISTINCT FROM customer_zip_code_prefix
        THEN 1 ELSE 0 END AS is_new_version
    FROM customer_orders
    WINDOW w AS (PARTITION BY customer_unique_id ORDER BY rn)
),

-- Step 3: Assign a version group number per customer
version_groups AS (
    SELECT *,
        SUM(is_new_version) OVER (
            PARTITION BY customer_unique_id ORDER BY rn
        ) AS version_id
    FROM change_flags
),

-- Step 4: Collapse each version to one row with valid_from
versions AS (
    SELECT
        customer_unique_id,
        customer_city,
        customer_state,
        customer_zip_code_prefix,
        MIN(order_purchase_timestamp::DATE) AS valid_from,
        version_id
    FROM version_groups
    GROUP BY customer_unique_id, customer_city, customer_state,
             customer_zip_code_prefix, version_id
),

-- Step 5: Compute valid_to and is_current
scd2 AS (
    SELECT
        customer_unique_id,
        customer_city,
        customer_state,
        customer_zip_code_prefix,
        valid_from,
        COALESCE(
            LEAD(valid_from) OVER (
                PARTITION BY customer_unique_id ORDER BY valid_from
            ),
            '9999-12-31'::DATE
        ) AS valid_to,
        CASE WHEN ROW_NUMBER() OVER (
            PARTITION BY customer_unique_id ORDER BY valid_from DESC
        ) = 1 THEN TRUE ELSE FALSE END AS is_current
    FROM versions
)

-- Main SELECT: assign surrogate keys starting at 1
SELECT
    ROW_NUMBER() OVER (ORDER BY s.customer_unique_id, s.valid_from)::INTEGER
        AS customer_key,
    s.customer_unique_id,
    INITCAP(s.customer_city) AS customer_city,
    s.customer_state,
    s.customer_zip_code_prefix,
    g.latitude,
    g.longitude,
    s.valid_from,
    s.valid_to,
    s.is_current
FROM scd2 s
LEFT JOIN geo_dedup g
    ON s.customer_zip_code_prefix = g.geolocation_zip_code_prefix

UNION ALL

-- Unknown member row for late-arriving / missing dimensions
SELECT
    -1 AS customer_key,
    'Unknown' AS customer_unique_id,
    'Unknown' AS customer_city,
    'XX' AS customer_state,
    '00000' AS customer_zip_code_prefix,
    NULL::DOUBLE PRECISION AS latitude,
    NULL::DOUBLE PRECISION AS longitude,
    '1900-01-01'::DATE AS valid_from,
    '9999-12-31'::DATE AS valid_to,
    TRUE AS is_current;
