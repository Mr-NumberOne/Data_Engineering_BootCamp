-- ============================================================
-- fact_reviews: Customer review fact table
-- ============================================================
-- Grain: one row per review
-- Uses DISTINCT ON to get the first product per order
-- ============================================================

DROP TABLE IF EXISTS dwh.fact_reviews CASCADE;

CREATE TABLE dwh.fact_reviews AS
WITH first_product AS (
    SELECT DISTINCT ON (order_id)
        order_id,
        product_id
    FROM staging.order_items
    ORDER BY order_id, order_item_id
)
SELECT
    ROW_NUMBER() OVER (ORDER BY r.review_id)::INTEGER AS review_key,

    r.order_id,
    r.review_id,
    dc.customer_key,
    dp.product_key,

    COALESCE(
        CAST(TO_CHAR(r.review_creation_date::TIMESTAMP, 'YYYYMMDD') AS INTEGER),
        -1
    ) AS review_date_key,

    r.review_score,
    CASE WHEN r.review_comment_message IS NOT NULL THEN 1 ELSE 0 END AS has_comment,

    ROUND(EXTRACT(EPOCH FROM (
        r.review_answer_timestamp::TIMESTAMP -
        r.review_creation_date::TIMESTAMP
    )) / 3600.0, 2) AS response_time_hours

FROM staging.order_reviews r
INNER JOIN staging.orders o
    ON r.order_id = o.order_id
INNER JOIN staging.customers c
    ON o.customer_id = c.customer_id
INNER JOIN dwh.dim_customer dc
    ON c.customer_unique_id = dc.customer_unique_id
LEFT JOIN first_product fp
    ON r.order_id = fp.order_id
LEFT JOIN dwh.dim_product dp
    ON fp.product_id = dp.product_id;
