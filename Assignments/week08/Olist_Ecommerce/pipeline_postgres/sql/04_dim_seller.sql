-- ============================================================
-- dim_seller: Seller dimension with geolocation enrichment
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
)
SELECT
    ROW_NUMBER() OVER (ORDER BY s.seller_id)::INTEGER AS seller_key,
    s.seller_id,
    INITCAP(s.seller_city) AS seller_city,
    s.seller_state,
    s.seller_zip_code_prefix,
    g.latitude,
    g.longitude
FROM staging.sellers s
LEFT JOIN geo_dedup g
    ON s.seller_zip_code_prefix = g.geolocation_zip_code_prefix;
