-- ============================================================
-- fact_leads: Seller acquisition leads fact table
-- ============================================================
-- Grain: one row per qualified lead (mql_id)
-- ============================================================

DROP TABLE IF EXISTS dwh.fact_leads CASCADE;

CREATE TABLE dwh.fact_leads AS
SELECT
    ROW_NUMBER() OVER (ORDER BY lq.mql_id)::INTEGER AS lead_key,

    lq.mql_id,
    ds.seller_key,

    COALESCE(
        CAST(TO_CHAR(lq.first_contact_date::TIMESTAMP, 'YYYYMMDD') AS INTEGER),
        -1
    ) AS contact_date_key,
    COALESCE(
        CAST(TO_CHAR(lc.won_date::TIMESTAMP, 'YYYYMMDD') AS INTEGER),
        -1
    ) AS won_date_key,

    lq.landing_page_id,
    COALESCE(lq.origin, 'unknown') AS origin,

    CASE WHEN lc.seller_id IS NOT NULL THEN 1 ELSE 0 END AS is_converted,

    ROUND(EXTRACT(EPOCH FROM (
        lc.won_date::TIMESTAMP -
        lq.first_contact_date::TIMESTAMP
    )) / 86400.0, 2) AS conversion_days,

    lc.business_segment,
    lc.lead_type,
    lc.business_type,
    lc.declared_monthly_revenue

FROM staging.leads_qualified lq
LEFT JOIN staging.leads_closed lc
    ON lq.mql_id = lc.mql_id
LEFT JOIN dwh.dim_seller ds
    ON lc.seller_id = ds.seller_id;
