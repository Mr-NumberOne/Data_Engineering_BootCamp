-- ============================================================
-- dim_product: Product dimension with English category names
-- ============================================================
-- Unknown member row inserted at product_key = -1.
-- ============================================================

DROP TABLE IF EXISTS dwh.dim_product CASCADE;

CREATE TABLE dwh.dim_product AS
SELECT
    ROW_NUMBER() OVER (ORDER BY p.product_id)::INTEGER AS product_key,
    p.product_id,
    COALESCE(p.product_category_name, 'Unknown') AS product_category_name,
    COALESCE(
        t.product_category_name_english,
        p.product_category_name,
        'Unknown'
    ) AS product_category_name_english,
    p.product_name_lenght    AS product_name_length,
    p.product_description_lenght AS product_description_length,
    p.product_photos_qty,
    p.product_weight_g,
    p.product_length_cm,
    p.product_height_cm,
    p.product_width_cm
FROM staging.products p
LEFT JOIN staging.product_category_name_translation t
    ON p.product_category_name = t.product_category_name

UNION ALL

SELECT
    -1 AS product_key,
    'Unknown' AS product_id,
    'Unknown' AS product_category_name,
    'Unknown' AS product_category_name_english,
    NULL::BIGINT AS product_name_length,
    NULL::BIGINT AS product_description_length,
    NULL::BIGINT AS product_photos_qty,
    NULL::BIGINT AS product_weight_g,
    NULL::BIGINT AS product_length_cm,
    NULL::BIGINT AS product_height_cm,
    NULL::BIGINT AS product_width_cm;
