-- ============================================================
-- fact_order_items: Primary sales fact table
-- ============================================================
-- Grain: one row per order line item (order_id + order_item_id)
-- PostgreSQL version: uses EXTRACT(EPOCH FROM ...) for date diffs
-- and TO_CHAR for date_key generation
-- ============================================================

DROP TABLE IF EXISTS dwh.fact_order_items CASCADE;

CREATE TABLE dwh.fact_order_items AS
SELECT
    ROW_NUMBER() OVER (ORDER BY oi.order_id, oi.order_item_id)::INTEGER AS order_item_key,

    -- Natural keys
    oi.order_id,
    oi.order_item_id,

    -- Surrogate key lookups
    dc.customer_key,
    dp.product_key,
    ds.seller_key,
    dos.order_status_key,

    -- Date keys (integer YYYYMMDD)
    CAST(TO_CHAR(o.order_purchase_timestamp::TIMESTAMP, 'YYYYMMDD') AS INTEGER)
        AS purchase_date_key,
    COALESCE(CAST(TO_CHAR(o.order_approved_at::TIMESTAMP, 'YYYYMMDD') AS INTEGER), -1)
        AS approved_date_key,
    COALESCE(CAST(TO_CHAR(o.order_delivered_carrier_date::TIMESTAMP, 'YYYYMMDD') AS INTEGER), -1)
        AS delivered_carrier_date_key,
    COALESCE(CAST(TO_CHAR(o.order_delivered_customer_date::TIMESTAMP, 'YYYYMMDD') AS INTEGER), -1)
        AS delivered_customer_date_key,
    COALESCE(CAST(TO_CHAR(o.order_estimated_delivery_date::TIMESTAMP, 'YYYYMMDD') AS INTEGER), -1)
        AS estimated_delivery_date_key,

    -- Measures
    oi.price,
    oi.freight_value,

    -- Derived delivery metrics
    ROUND(EXTRACT(EPOCH FROM (
        o.order_delivered_customer_date::TIMESTAMP -
        o.order_purchase_timestamp::TIMESTAMP
    )) / 86400.0, 2) AS delivery_days,

    ROUND(EXTRACT(EPOCH FROM (
        o.order_estimated_delivery_date::TIMESTAMP -
        o.order_purchase_timestamp::TIMESTAMP
    )) / 86400.0, 2) AS estimated_delivery_days,

    CASE
        WHEN o.order_delivered_customer_date IS NOT NULL
             AND o.order_estimated_delivery_date IS NOT NULL
             AND o.order_delivered_customer_date::TIMESTAMP >
                 o.order_estimated_delivery_date::TIMESTAMP
        THEN 1
        WHEN o.order_delivered_customer_date IS NOT NULL
             AND o.order_estimated_delivery_date IS NOT NULL
        THEN 0
        ELSE NULL
    END AS is_late_delivery

FROM staging.order_items oi
INNER JOIN staging.orders o
    ON oi.order_id = o.order_id
INNER JOIN staging.customers c
    ON o.customer_id = c.customer_id
INNER JOIN dwh.dim_customer dc
    ON c.customer_unique_id = dc.customer_unique_id
INNER JOIN dwh.dim_product dp
    ON oi.product_id = dp.product_id
INNER JOIN dwh.dim_seller ds
    ON oi.seller_id = ds.seller_id
INNER JOIN dwh.dim_order_status dos
    ON o.order_status = dos.order_status;
