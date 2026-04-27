-- ============================================================
-- dim_payment_type: Payment type lookup dimension
-- ============================================================

DROP TABLE IF EXISTS dwh.dim_payment_type CASCADE;

CREATE TABLE dwh.dim_payment_type AS
SELECT
    ROW_NUMBER() OVER (ORDER BY payment_type_clean)::INTEGER AS payment_type_key,
    payment_type_clean AS payment_type
FROM (
    SELECT DISTINCT
        CASE WHEN payment_type = 'not_defined' THEN 'other' ELSE payment_type END
            AS payment_type_clean
    FROM staging.order_payments
) sub;
