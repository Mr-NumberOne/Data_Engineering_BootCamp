-- ============================================================
-- Indexes & Primary Keys for PostgreSQL
-- ============================================================
-- PostgreSQL supports real primary keys and B-tree indexes.
-- We add ALTER TABLE constraints after data load for performance
-- (loading data into an unindexed table is faster, then we index).
--
-- SCD2 additions: composite indexes on (business_key, valid_from,
-- valid_to) for efficient temporal range joins in fact tables.
-- ============================================================

-- ──────────────────────────────────────────────
-- Dimension primary keys
-- ──────────────────────────────────────────────
ALTER TABLE dwh.dim_date ADD PRIMARY KEY (date_key);
ALTER TABLE dwh.dim_customer ADD PRIMARY KEY (customer_key);
ALTER TABLE dwh.dim_product ADD PRIMARY KEY (product_key);
ALTER TABLE dwh.dim_seller ADD PRIMARY KEY (seller_key);
ALTER TABLE dwh.dim_payment_type ADD PRIMARY KEY (payment_type_key);
ALTER TABLE dwh.dim_order_status ADD PRIMARY KEY (order_status_key);
ALTER TABLE dwh.dim_marketing_origin ADD PRIMARY KEY (marketing_origin_key);

-- Dimension business key indexes
CREATE INDEX IF NOT EXISTS idx_dim_customer_bk
    ON dwh.dim_customer (customer_unique_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dim_product_bk
    ON dwh.dim_product (product_id);
CREATE INDEX IF NOT EXISTS idx_dim_seller_bk
    ON dwh.dim_seller (seller_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dim_marketing_origin_bk
    ON dwh.dim_marketing_origin (origin);

-- SCD2 temporal join indexes (critical for fact table load performance)
CREATE INDEX IF NOT EXISTS idx_dim_customer_scd2
    ON dwh.dim_customer (customer_unique_id, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_dim_customer_current
    ON dwh.dim_customer (is_current) WHERE is_current = TRUE;

CREATE INDEX IF NOT EXISTS idx_dim_seller_scd2
    ON dwh.dim_seller (seller_id, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_dim_seller_current
    ON dwh.dim_seller (is_current) WHERE is_current = TRUE;

-- ──────────────────────────────────────────────
-- Fact table: fact_order_items
-- ──────────────────────────────────────────────
ALTER TABLE dwh.fact_order_items ADD PRIMARY KEY (order_item_key);

CREATE INDEX IF NOT EXISTS idx_foi_date
    ON dwh.fact_order_items (purchase_date_key);
CREATE INDEX IF NOT EXISTS idx_foi_customer
    ON dwh.fact_order_items (customer_key);
CREATE INDEX IF NOT EXISTS idx_foi_product
    ON dwh.fact_order_items (product_key);
CREATE INDEX IF NOT EXISTS idx_foi_seller
    ON dwh.fact_order_items (seller_key);
CREATE INDEX IF NOT EXISTS idx_foi_order_id
    ON dwh.fact_order_items (order_id);

-- ──────────────────────────────────────────────
-- Fact table: fact_payments
-- ──────────────────────────────────────────────
ALTER TABLE dwh.fact_payments ADD PRIMARY KEY (payment_key);

CREATE INDEX IF NOT EXISTS idx_fp_date
    ON dwh.fact_payments (purchase_date_key);
CREATE INDEX IF NOT EXISTS idx_fp_customer
    ON dwh.fact_payments (customer_key);
CREATE INDEX IF NOT EXISTS idx_fp_order_id
    ON dwh.fact_payments (order_id);

-- ──────────────────────────────────────────────
-- Fact table: fact_reviews
-- ──────────────────────────────────────────────
ALTER TABLE dwh.fact_reviews ADD PRIMARY KEY (review_key);

CREATE INDEX IF NOT EXISTS idx_fr_date
    ON dwh.fact_reviews (review_date_key);
CREATE INDEX IF NOT EXISTS idx_fr_product
    ON dwh.fact_reviews (product_key);
CREATE INDEX IF NOT EXISTS idx_fr_customer
    ON dwh.fact_reviews (customer_key);

-- ──────────────────────────────────────────────
-- Fact table: fact_leads
-- ──────────────────────────────────────────────
ALTER TABLE dwh.fact_leads ADD PRIMARY KEY (lead_key);

CREATE INDEX IF NOT EXISTS idx_fl_contact_date
    ON dwh.fact_leads (contact_date_key);
CREATE INDEX IF NOT EXISTS idx_fl_marketing_origin
    ON dwh.fact_leads (marketing_origin_key);
CREATE INDEX IF NOT EXISTS idx_fl_seller
    ON dwh.fact_leads (seller_key);

-- ──────────────────────────────────────────────
-- ANALYZE: Update PostgreSQL query planner statistics
-- ──────────────────────────────────────────────
ANALYZE dwh.dim_date;
ANALYZE dwh.dim_customer;
ANALYZE dwh.dim_product;
ANALYZE dwh.dim_seller;
ANALYZE dwh.dim_payment_type;
ANALYZE dwh.dim_order_status;
ANALYZE dwh.dim_marketing_origin;
ANALYZE dwh.fact_order_items;
ANALYZE dwh.fact_payments;
ANALYZE dwh.fact_reviews;
ANALYZE dwh.fact_leads;
