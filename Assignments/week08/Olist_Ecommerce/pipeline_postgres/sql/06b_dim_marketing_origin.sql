-- ============================================================
-- dim_marketing_origin: Conformed marketing channel dimension
-- ============================================================
-- Extracted from fact_leads.origin to prevent degenerate
-- dimension anti-pattern. Enables cross-fact-table analysis
-- of marketing channel effectiveness.
-- Unknown member row inserted at marketing_origin_key = -1.
-- ============================================================

DROP TABLE IF EXISTS dwh.dim_marketing_origin CASCADE;

CREATE TABLE dwh.dim_marketing_origin AS
SELECT
    ROW_NUMBER() OVER (ORDER BY origin_clean)::INTEGER AS marketing_origin_key,
    origin_clean AS origin
FROM (
    SELECT DISTINCT
        COALESCE(NULLIF(TRIM(origin), ''), 'unknown') AS origin_clean
    FROM staging.leads_qualified
) sub

UNION ALL

SELECT -1 AS marketing_origin_key, 'Unknown' AS origin;
