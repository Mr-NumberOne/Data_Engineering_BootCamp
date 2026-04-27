-- ============================================================
-- dim_product: Product dimension with English category names
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
    ON p.product_category_name = t.product_category_name;
