-- ============================================================
-- dim_seller: SCD Type 2 — Seller dimension
-- ============================================================
-- Structural SCD2 for architectural conformance with dim_customer.
-- No seller location changes exist in this dataset, so each
-- seller produces exactly one version row.
-- valid_from = earliest order involving this seller.
-- Unknown member row inserted at seller_key = -1.
-- ============================================================

DROP TABLE IF EXISTS dwh.dim_seller CASCADE;

CREATE TABLE dwh.dim_seller AS

WITH geo_dedup AS (
    SELECT
        geolocation_zip_code_prefix,
        AVG(geolocation_lat) AS latitude,
        AVG(geolocation_lng) AS longitude
    FROM staging.geolocation
    GROUP BY geolocation_zip_code_prefix
),

-- Earliest order timestamp per seller
seller_first_order AS (
    SELECT
        oi.seller_id,
        MIN(o.order_purchase_timestamp::DATE) AS first_order_date
    FROM staging.order_items oi
    INNER JOIN staging.orders o ON oi.order_id = o.order_id
    GROUP BY oi.seller_id
)

SELECT
    ROW_NUMBER() OVER (ORDER BY s.seller_id)::INTEGER AS seller_key,
    s.seller_id,
    INITCAP(s.seller_city) AS seller_city,
    s.seller_state,
    s.seller_zip_code_prefix,
    g.latitude,
    g.longitude,
    COALESCE(sfo.first_order_date, '1900-01-01'::DATE) AS valid_from,
    '9999-12-31'::DATE AS valid_to,
    TRUE AS is_current
FROM staging.sellers s
LEFT JOIN geo_dedup g
    ON s.seller_zip_code_prefix = g.geolocation_zip_code_prefix
LEFT JOIN seller_first_order sfo
    ON s.seller_id = sfo.seller_id

UNION ALL

SELECT
    -1 AS seller_key,
    'Unknown' AS seller_id,
    'Unknown' AS seller_city,
    'XX' AS seller_state,
    '00000' AS seller_zip_code_prefix,
    NULL::DOUBLE PRECISION AS latitude,
    NULL::DOUBLE PRECISION AS longitude,
    '1900-01-01'::DATE AS valid_from,
    '9999-12-31'::DATE AS valid_to,
    TRUE AS is_current;
