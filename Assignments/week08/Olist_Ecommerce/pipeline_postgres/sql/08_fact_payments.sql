-- ============================================================
-- fact_payments: Payment fact table
-- ============================================================
-- Grain: one row per payment transaction (order_id + payment_sequential)
-- ============================================================

DROP TABLE IF EXISTS dwh.fact_payments CASCADE;

CREATE TABLE dwh.fact_payments AS
SELECT
    ROW_NUMBER() OVER (ORDER BY op.order_id, op.payment_sequential)::INTEGER AS payment_key,

    op.order_id,
    dc.customer_key,
    dpt.payment_type_key,

    CAST(TO_CHAR(o.order_purchase_timestamp::TIMESTAMP, 'YYYYMMDD') AS INTEGER)
        AS purchase_date_key,

    op.payment_sequential,
    op.payment_installments,
    op.payment_value

FROM staging.order_payments op
INNER JOIN staging.orders o
    ON op.order_id = o.order_id
INNER JOIN staging.customers c
    ON o.customer_id = c.customer_id
INNER JOIN dwh.dim_customer dc
    ON c.customer_unique_id = dc.customer_unique_id
INNER JOIN dwh.dim_payment_type dpt
    ON CASE WHEN op.payment_type = 'not_defined' THEN 'other' ELSE op.payment_type END
       = dpt.payment_type;
