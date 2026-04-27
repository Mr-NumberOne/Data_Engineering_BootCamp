-- ============================================================
-- Indexes & Primary Keys for PostgreSQL
-- ============================================================
-- PostgreSQL supports real primary keys and B-tree indexes.
-- We add ALTER TABLE constraints after data load for performance
-- (loading data into an unindexed table is faster, then we index).
--
-- PostgreSQL B-tree indexes excel at both point lookups AND 
-- range scans, unlike DuckDB's ART indexes which are primarily
-- for point lookups.
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

-- Dimension business key unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_dim_customer_bk ON dwh.dim_customer (customer_unique_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dim_product_bk ON dwh.dim_product (product_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_dim_seller_bk ON dwh.dim_seller (seller_id);

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

-- ──────────────────────────────────────────────
-- ANALYZE: Update PostgreSQL query planner statistics
-- ──────────────────────────────────────────────
-- Critical for query performance. Without ANALYZE, the planner
-- may choose suboptimal execution plans (e.g., seq scan vs index scan).
-- ──────────────────────────────────────────────
ANALYZE dwh.dim_date;
ANALYZE dwh.dim_customer;
ANALYZE dwh.dim_product;
ANALYZE dwh.dim_seller;
ANALYZE dwh.dim_payment_type;
ANALYZE dwh.dim_order_status;
ANALYZE dwh.fact_order_items;
ANALYZE dwh.fact_payments;
ANALYZE dwh.fact_reviews;
ANALYZE dwh.fact_leads;
