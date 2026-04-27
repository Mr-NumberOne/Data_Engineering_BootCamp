-- ============================================================
-- dim_order_status: Order status lookup dimension
-- ============================================================

DROP TABLE IF EXISTS dwh.dim_order_status CASCADE;

CREATE TABLE dwh.dim_order_status AS
SELECT
    ROW_NUMBER() OVER (ORDER BY order_status)::INTEGER AS order_status_key,
    order_status
FROM (
    SELECT DISTINCT order_status
    FROM staging.orders
) sub;
