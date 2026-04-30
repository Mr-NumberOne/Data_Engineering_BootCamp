-- ============================================================
-- fact_leads: Seller acquisition leads fact table
-- ============================================================
-- Grain: one row per qualified lead (mql_id)
--
-- The degenerate origin column has been migrated to
-- dim_marketing_origin as a conformed dimension (marketing_origin_key).
-- COALESCE to -1 for missing seller and marketing_origin keys.
-- ============================================================

DROP TABLE IF EXISTS dwh.fact_leads CASCADE;

CREATE TABLE dwh.fact_leads AS
SELECT
    ROW_NUMBER() OVER (ORDER BY lq.mql_id)::INTEGER AS lead_key,

    lq.mql_id,
    COALESCE(ds.seller_key, -1) AS seller_key,
    COALESCE(dmo.marketing_origin_key, -1) AS marketing_origin_key,

    COALESCE(
        CAST(TO_CHAR(lq.first_contact_date::TIMESTAMP, 'YYYYMMDD') AS INTEGER),
        -1
    ) AS contact_date_key,
    COALESCE(
        CAST(TO_CHAR(lc.won_date::TIMESTAMP, 'YYYYMMDD') AS INTEGER),
        -1
    ) AS won_date_key,

    lq.landing_page_id,

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
    ON lc.seller_id = ds.seller_id
    AND ds.is_current = TRUE
LEFT JOIN dwh.dim_marketing_origin dmo
    ON COALESCE(NULLIF(TRIM(lq.origin), ''), 'unknown') = dmo.origin;
