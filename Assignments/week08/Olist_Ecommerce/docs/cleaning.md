# Olist E-Commerce Data Warehouse — Cleaning Decisions

This document outlines the data cleaning strategies employed throughout the **ELT (Extract, Load, Transform)** pipeline. 

By adhering to the ELT paradigm, we perform minimal cleaning during the extraction phase and handle all complex business-logic cleaning inside the database during the SQL transformation phase.

## 1. Extract & Load (Python Phase)

During the `extract_load.py` phase, data is moved from the `olist.sqlite` source database into the PostgreSQL `staging` schema.

**Decisions:**
- **Raw Fidelity**: No rows are dropped, and no text is altered. The `staging` tables perfectly mirror the source.
- **Data Types**: The only "cleaning" performed here is casting string representations of dates into native PostgreSQL `TIMESTAMP` formats. This is handled dynamically via Pandas for specific columns (e.g., `order_purchase_timestamp`, `review_creation_date`).

## 2. Transformation (SQL Phase)

All heavy cleaning occurs as data moves from the `staging` schema into the final Kimball-modeled `dwh` (Data Warehouse) schema.

### A. Missing Data (Unknown Members)
In dimensional modeling, an inner join on missing dimensions drops facts (revenue). To prevent this, we never use `NULL` foreign keys in fact tables.
- **Decision**: We inject a surrogate key of `-1` (the **"Unknown Member"**) into every dimension table (`dim_customer`, `dim_product`, etc.).
- **Application**: In the fact tables, we use `COALESCE(dim_key, -1)` during joins. For example, if an order has a `product_id` that doesn't exist in the product catalog, it safely links to the `-1` product row, ensuring the revenue isn't lost.

### B. Geographic Deduplication
The `geolocation` table contains over 1,000,000 coordinates, but multiple different latitude/longitude pairs map to the exact same `zip_code_prefix` due to tracking variations.
- **Decision**: We compute the exact `AVG(geolocation_lat)` and `AVG(geolocation_lng)` per `zip_code_prefix` to create a single, clean coordinate pair for every zip code before attaching it to customers and sellers.

### C. Text Normalization
- **City Names**: Brazilian city names in the source data suffer from inconsistent casing (e.g., "SAO PAULO", "sao paulo", "Sao Paulo").
- **Decision**: We apply PostgreSQL's `INITCAP()` function to standardize all city names in `dim_customer` and `dim_seller`.

### D. Categorical Standardization
- **Payment Types**: The `order_payments` table contains a payment type labeled `'not_defined'`, which is semantically ambiguous.
- **Decision**: In `dim_payment_type`, we explicitly map `'not_defined'` to `'other'` to provide a cleaner presentation layer for analysts.
- **Marketing Origins**: In `fact_leads`, empty strings and `NULL` values for the `origin` channel are explicitly coalesced to `'unknown'` before being extracted into the new `dim_marketing_origin`.

### E. Product Category Translation
The source system provides product categories exclusively in Portuguese (`cama_mesa_banho`), but we need an English presentation layer.
- **Decision**: We perform a `LEFT JOIN` on the translation table during the creation of `dim_product`. 
- **Handling Missing Translations**: 610 products have a category but no English translation. We use `COALESCE(english, portuguese, 'Unknown')` so the pipeline gracefully falls back to Portuguese if an English translation is missing, and to `'Unknown'` if the category is entirely `NULL`.

## 3. Slowly Changing Dimensions (SCD Type 2)

Customers can change locations (move to a new state or city) over the 2.5 years of dataset history. Overwriting their location with their most recent address (SCD Type 1) would ruin historical geographic revenue reporting.
- **Decision**: We implemented **SCD Type 2** for `dim_customer`. By linking a customer's address to their `order_purchase_timestamp`, we generate multiple row "versions" for a single customer. 
- **Result**: Fact tables use temporal joins (`order_date >= valid_from AND order_date < valid_to`) to ensure revenue is attributed to the exact state the customer lived in at the moment of purchase.
