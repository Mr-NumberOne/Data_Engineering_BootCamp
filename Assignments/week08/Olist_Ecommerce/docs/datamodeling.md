# Data Modeling — Olist E-Commerce Data Warehouse

## Table of Contents

1. [Modeling Approach](#1-modeling-approach)
2. [Business Process Identification](#2-business-process-identification)
3. [Dimension Tables — Types & Design](#3-dimension-tables--types--design)
4. [Fact Tables — Types & Design](#4-fact-tables--types--design)
5. [Grain Decisions](#5-grain-decisions)
6. [Relationships](#6-relationships)
7. [Surrogate Keys vs. Natural Keys](#7-surrogate-keys-vs-natural-keys)
8. [SCD Strategy](#8-scd-strategy)

---

## 1. Modeling Approach

### Why Kimball Dimensional Modeling?

We follow **Ralph Kimball's dimensional modeling** methodology, which structures data around business processes using **fact** and **dimension** tables. The core philosophy is:

> *"Design the data warehouse around the business processes that generate the data, not around the organizational structure."*

This produces a **Galaxy Schema** (Fact Constellation) — multiple fact tables sharing conformed dimensions.

### The 4-Step Kimball Process We Followed

| Step | Question | Our Answer |
|---|---|---|
| 1. **Select the business process** | What are we measuring? | Order sales, payments, reviews, lead acquisition |
| 2. **Declare the grain** | What does one row represent? | One line item, one payment, one review, one lead |
| 3. **Identify the dimensions** | How do users describe the data? | By customer, product, seller, date, status, payment type, marketing origin |
| 4. **Identify the facts** | What are we measuring? | Price, freight, payment value, review score, conversion |

### Why Not Other Approaches?

| Approach | Why We Rejected It |
|---|---|
| **3NF / Inmon** | Would require 20+ normalized tables with complex joins. Overkill for a single-source analytical DWH. |
| **One Big Table (OBT)** | Flattening everything into one denormalized table causes grain conflicts — payment data would be duplicated across line items, inflating totals. |
| **Data Vault** | Hub-Link-Satellite pattern is designed for auditable, multi-source integration. Massive over-engineering for our single SQLite source. |
| **Snowflake Schema** | Normalizing dimensions (e.g., splitting `dim_product` into product + category + translation) adds joins without meaningful benefit at this scale. |

---

## 2. Business Process Identification

The first and most critical step in Kimball modeling is identifying **what the business does** — not what data exists, but what **processes generate** that data.

We identified **4 distinct business processes** in the Olist dataset:

### Process 1: Order Sales (Core Revenue Process)

- **What happens**: A customer places an order containing one or more products from one or more sellers.
- **Source tables**: `orders`, `order_items`, `customers`, `products`, `sellers`
- **Why it's a separate process**: This is the primary revenue-generating event. Every e-commerce analysis starts here.

### Process 2: Payment Processing

- **What happens**: A customer pays for an order using one or more payment methods (credit card, boleto, voucher, etc.).
- **Source tables**: `orders`, `order_payments`
- **Why it's separate from sales**: One order can have **multiple payments** (avg 1.04 per order). If we combined payments into the order items fact, an order with 2 items and 2 payments would produce 4 rows (cross join), **doubling** the apparent revenue.

### Process 3: Customer Reviews

- **What happens**: After delivery, a customer submits a review (1–5 stars, optional comment).
- **Source tables**: `orders`, `order_reviews`
- **Why it's separate**: Reviews are at the **order level** (1 review per order), while sales are at the **item level** (1.14 items per order avg). Combining them would duplicate review scores across line items — a 5-star review for a 3-item order would appear three times, skewing averages.

### Process 4: Seller Lead Acquisition

- **What happens**: A potential seller contacts Olist through marketing channels, and may eventually be onboarded as a seller.
- **Source tables**: `leads_qualified`, `leads_closed`
- **Why it's separate**: Completely different grain (leads, not orders), different actors (potential sellers, not customers), different timeline. This is a marketing/sales funnel, not a transactional process.

---

## 3. Dimension Tables — Types & Design

### Overview of Dimension Types Used

| Dimension | Type | Row Count | Description |
|---|---|---|---|
| `dim_date` | **Date/Calendar** | 864 | Generated calendar dimension |
| `dim_customer` | **Conformed / SCD2** | 96,356 | Tracks geographical changes over time |
| `dim_product` | **Conformed** | 32,952 | Shared across 2 fact tables |
| `dim_seller` | **Conformed / SCD2** | 3,096 | Shared across 2 fact tables |
| `dim_marketing_origin` | **Conformed** | 11 | Extracted from fact_leads to avoid degeneracy |
| `dim_payment_type` | **Junk (simplified)** | 6 | Low-cardinality lookup |
| `dim_order_status` | **Junk (simplified)** | 9 | Low-cardinality lookup |

### Type 1: Date/Calendar Dimension — `dim_date`

```
dim_date (864 rows)
├── date_key (PK) — integer YYYYMMDD format
├── full_date
├── year, quarter, month, day
├── month_name, day_name
├── day_of_week, is_weekend
├── week_of_year, year_month
```

**Why this type?**

- **Generated, not extracted** — We don't pull dates from the source. Instead, we generate a complete calendar using `generate_series()` covering the full date range (Aug 2016 – Dec 2018) with 30-day buffer on each end.
- **Integer key (YYYYMMDD)** — Enables fast range filtering (`WHERE date_key BETWEEN 20170101 AND 20171231`) without date parsing overhead. This is a Kimball best practice.
- **Pre-calculated attributes** — `is_weekend`, `quarter`, `day_name` avoid repeated `EXTRACT()` calls in every query.

**Why not just use the raw date?** Because analytical queries always need the same breakdowns (monthly trends, weekday patterns, quarterly reporting). Pre-computing these into a dimension eliminates repetitive date arithmetic across dozens of queries.

### Type 2: Conformed Dimensions — `dim_customer`, `dim_product`, `dim_seller`

These are **conformed dimensions** — the same dimension table is referenced by multiple fact tables, ensuring consistent analysis across business processes.

#### `dim_customer` (96,096 rows)

```
dim_customer
├── customer_key (PK) — surrogate integer key
├── customer_unique_id — business key (deduplicated)
├── customer_city (INITCAP normalized)
├── customer_state
├── customer_zip_code_prefix
├── latitude, longitude (from geolocation avg)
```

**Key design decisions:**

- **Deduplicated on `customer_unique_id`**: The source has 99,441 `customer_id` values (one per order), but only 96,096 unique customers. We use `customer_unique_id` as the business key to correctly identify repeat buyers.
- **Geolocation enrichment**: Latitude/longitude are averaged from the `geolocation` table (1M rows → 19K zip codes → avg per zip). This enables geographic analysis without a separate geo dimension.
- **City name normalization**: Applied `INITCAP()` to standardize "SAO PAULO" → "Sao Paulo".

**Why conformed?** This dimension is shared by `fact_order_items`, `fact_payments`, and `fact_reviews`. A customer who buys something, pays for it, and reviews it should appear as the same entity across all three analyses. Without conformance, a "top customers by revenue" report couldn't be compared to a "customers with lowest review scores" report.

#### `dim_product` (32,951 rows)

```
dim_product
├── product_key (PK)
├── product_id — business key
├── product_category_name (Portuguese)
├── product_category_name_english (translated)
├── product_name_length, product_description_length
├── product_photos_qty
├── product_weight_g, length_cm, height_cm, width_cm
```

**Key design decisions:**

- **Category translation merged in**: The source stores categories in Portuguese with a separate translation table. We join them at transform time, using `COALESCE(english, portuguese, 'Unknown')` as the fallback chain.
- **610 NULL categories → "Unknown"**: Rather than dropping these products (losing revenue data), we label the category as "Unknown". The product still has valid price and delivery data.
- **Physical dimensions included**: Weight and size attributes enable logistics analysis (e.g., "do heavier products have more delivery delays?").

**Why not snowflake the category?** Splitting `dim_product` into `dim_product` + `dim_category` + `dim_category_translation` would add 2 extra joins to every product query. With only 71 category translations, the denormalization overhead is negligible (< 1KB of repeated data), while the query simplification is significant.

#### `dim_seller` (3,095 rows)

```
dim_seller
├── seller_key (PK)
├── seller_id — business key
├── seller_city (INITCAP), seller_state
├── seller_zip_code_prefix
├── latitude, longitude (geo avg)
```

**Why conformed?** Shared between `fact_order_items` (seller fulfills orders) and `fact_leads` (seller was acquired through marketing). This conformance enables the query: "For sellers acquired through paid_search, what's their average delivery performance?"

### Type 3: Junk Dimensions (Simplified) — `dim_payment_type`, `dim_order_status`

```
dim_payment_type (5 rows)          dim_order_status (8 rows)
├── payment_type_key (PK)         ├── order_status_key (PK)
├── payment_type                  ├── order_status
```

**What is a junk dimension?** In Kimball methodology, a **junk dimension** collects low-cardinality flags and indicators that don't warrant their own dimension table. Our payment_type (5 values) and order_status (8 values) are simplified junk dimensions — each contains a single attribute with very few distinct values.

**Why not just store the string in the fact table?**

1. **Storage efficiency**: Storing a 4-byte integer key instead of a 11-character string ("credit_card") across 103,886 payment rows saves ~800KB. At scale (millions of rows), this matters.
2. **Consistency**: A lookup table prevents typos and inconsistencies (e.g., "credit_card" vs "Credit Card" vs "CC").
3. **Extensibility**: If we later add attributes (payment_type_category, is_instant_payment), we modify the dimension — not the fact table.

**Why we mapped `not_defined` → `other`**: The source data has 3 payments with `payment_type = 'not_defined'`. Rather than creating a meaningless category, we mapped these to `'other'` — semantically appropriate and analytically cleaner.

---

## 4. Fact Tables — Types & Design

### Overview of Fact Table Types

| Fact Table | Type | Row Count | Measures |
|---|---|---|---|
| `fact_order_items` | **Transaction** | 112,650 | price, freight_value, delivery_days, is_late_delivery |
| `fact_payments` | **Transaction** | 103,886 | payment_value, payment_installments |
| `fact_reviews` | **Transaction** | 99,224 | review_score, response_time_hours, has_comment |
| `fact_leads` | **Transaction** | 8,000 | is_converted, conversion_days, declared_monthly_revenue |

**All 4 are Transaction Fact Tables** — each row records a single business event at the most granular level. This is the most common and most flexible fact table type.

### Why Transaction Facts (Not Periodic Snapshots or Accumulating Snapshots)?

| Type | Description | Why We Didn't Use It |
|---|---|---|
| **Transaction** (chosen) | 1 row per event at the moment it occurs | Captures every individual sale, payment, review — maximum granularity |
| **Periodic Snapshot** | 1 row per time period per entity (e.g., monthly balance) | Would lose individual transaction detail. We can always aggregate transactions into snapshots via SQL — the reverse isn't possible. |
| **Accumulating Snapshot** | 1 row per entity lifecycle (e.g., order lifecycle) | Requires tracking state changes over time with milestone dates. Our batch-load design doesn't support in-flight order updates. |

**Key principle**: *Start with transaction facts. You can always roll them up into snapshots via queries, but you can never disaggregate a snapshot back to transactions.* Transaction facts preserve maximum analytical flexibility.

### Fact Table Details

#### `fact_order_items` — The Primary Sales Fact (112,650 rows)

```
fact_order_items
├── order_item_key (PK) — surrogate
├── order_id, order_item_id — natural key
├── customer_key (FK) → dim_customer
├── product_key (FK) → dim_product
├── seller_key (FK) → dim_seller
├── order_status_key (FK) → dim_order_status
├── purchase_date_key (FK) → dim_date
├── approved_date_key, delivered_carrier_date_key
├── delivered_customer_date_key, estimated_delivery_date_key
├── price (additive measure)
├── freight_value (additive measure)
├── delivery_days (derived: delivered - purchased)
├── estimated_delivery_days (derived: estimated - purchased)
├── is_late_delivery (derived flag: 1 if delivered > estimated)
```

**Design decisions:**

- **5 date keys**: Multiple role-playing dates (purchase, approved, carrier, delivered, estimated) all point to `dim_date` but represent different moments in the order lifecycle.
- **Pre-calculated delivery metrics**: `delivery_days`, `estimated_delivery_days`, and `is_late_delivery` are computed at transform time to avoid repeated date arithmetic in queries.
- **Additive measures**: `price` and `freight_value` can be safely summed across any dimension (by customer, by product, by date, etc.). This is a defining characteristic of well-designed measures.

#### `fact_payments` — Payment Transaction Fact (103,886 rows)

```
fact_payments
├── payment_key (PK)
├── order_id
├── customer_key (FK) → dim_customer
├── payment_type_key (FK) → dim_payment_type
├── purchase_date_key (FK) → dim_date
├── payment_sequential (which payment within the order)
├── payment_installments (how many installments)
├── payment_value (additive measure)
```

**Why separate from order items?**

- An order can have **multiple payments** (e.g., part credit card, part voucher).
- Combining with order_items would create a **fan-out**: 2 items × 2 payments = 4 rows, doubling both revenue and payment totals.
- The `payment_sequential` field (1st payment, 2nd payment) only makes sense at the payment grain, not the item grain.

#### `fact_reviews` — Customer Review Fact (99,224 rows)

```
fact_reviews
├── review_key (PK)
├── order_id, review_id
├── customer_key (FK) → dim_customer
├── product_key (FK) → dim_product (first product in order)
├── review_date_key (FK) → dim_date
├── review_score (semi-additive: can be averaged, not summed)
├── has_comment (derived flag)
├── response_time_hours (derived measure)
```

**Design decisions:**

- **Semi-additive measure**: `review_score` should be averaged (AVG), not summed (SUM). Summing stars doesn't produce a meaningful number.
- **Product linkage**: Reviews are at the order level, not the product level. For multi-item orders, we link to the **first product** (by `order_item_id`). This is a documented simplification.
- **Derived fields**: `has_comment` (boolean) and `response_time_hours` (review answer time - creation time) are pre-computed.

#### `fact_leads` — Seller Acquisition Fact (8,000 rows)

```
fact_leads
├── lead_key (PK)
├── mql_id — marketing qualified lead ID
├── seller_key (FK) → dim_seller (NULL if not converted)
├── contact_date_key (FK) → dim_date
├── won_date_key (FK) → dim_date (NULL if not converted)
├── origin (organic_search, paid_search, etc.)
├── is_converted (derived flag: 1 if lead became a seller)
├── conversion_days (derived: won_date - contact_date)
├── business_segment, lead_type, business_type
├── declared_monthly_revenue
```

**Design decisions:**

- **Nullable FKs**: `seller_key` and `won_date_key` are NULL for unconverted leads (92.5% of leads). This is correct — these leads never became sellers, so they have no seller record and no won date.
- **Sparse source columns excluded**: The source `leads_closed` table has columns like `has_company`, `has_gtin`, `average_stock` that are 92%+ NULL. We excluded these — they add no analytical value and bloat the schema.
- **`origin` kept as a degenerate dimension**: With only 7 distinct values, creating a separate `dim_origin` table would be over-engineering. The string is stored directly in the fact table.

---

## 5. Grain Decisions

**Grain** = what one row in the fact table represents. This is the single most important modeling decision.

| Fact Table | Grain Statement | Why This Grain? |
|---|---|---|
| `fact_order_items` | "One row per product sold in an order" | Allows analysis at the individual product level (which products sell most, which sellers ship fastest). An order-level grain would lose product-level detail. |
| `fact_payments` | "One row per payment within an order" | An order can be paid with multiple methods. Order-level grain would lose payment method breakdown. |
| `fact_reviews` | "One row per customer review" | Reviews are naturally at order level (1 per order). Going more granular (per item) would fabricate data. |
| `fact_leads` | "One row per marketing-qualified lead" | Each lead is a unique acquisition event. No finer grain exists. |

### Grain Violation Example (Why It Matters)

If we combined `fact_order_items` and `fact_payments` into one table:

```
Order #123 has: 2 items (chair $100, table $200) + 2 payments (credit $250, voucher $50)

WRONG (combined fact — cross join):
| item    | price | payment_type | payment_value |
|---------|-------|-------------|---------------|
| chair   | 100   | credit      | 250           |
| chair   | 100   | voucher     | 50            |
| table   | 200   | credit      | 250           |
| table   | 200   | voucher     | 50            |

SUM(price) = $600 ← WRONG! Actual = $300 (doubled!)
SUM(payment_value) = $600 ← WRONG! Actual = $300 (doubled!)
```

This is called **fan-out** — the hallmark of a grain violation. Separate fact tables eliminate this entirely.

---

## 6. Relationships

### All Relationships Are M:1 (Many-to-One)

In a dimensional model, **every fact-to-dimension relationship is M:1**:

- **Many** fact rows (the "many" side) reference **one** dimension row (the "one" side)
- This is enforced by the fact table having a foreign key pointing to the dimension's primary key

| Count | Relationship Type | Description |
|---|---|---|
| **14** | **M:1** (Many-to-One) | Every FK in every fact table points to one PK in a dimension |
| **0** | **M:M** (Many-to-Many) | Resolved by grain design — separate fact tables eliminate M:M |
| **0** | **1:1** (One-to-One) | If 1:1 existed, the tables would be merged (e.g., customer + geo → `dim_customer`) |

### Full Relationship Map

```
dim_date (1) ←────── (M) fact_order_items (M) ──────→ (1) dim_customer
                          (M) ──────→ (1) dim_product
                          (M) ──────→ (1) dim_seller
                          (M) ──────→ (1) dim_order_status

dim_date (1) ←────── (M) fact_payments    (M) ──────→ (1) dim_customer
                          (M) ──────→ (1) dim_payment_type

dim_date (1) ←────── (M) fact_reviews     (M) ──────→ (1) dim_customer
                          (M) ──────→ (1) dim_product

dim_date (1) ←────── (M) fact_leads       (M) ──────→ (1) dim_seller
dim_date (1) ←────── (M) fact_leads (won_date)
```

### How M:M Was Resolved

| Source Data Relationship | Problem | Resolution |
|---|---|---|
| Orders ↔ Payments | 1 order → M payments, 1 payment type → M orders | Separate `fact_payments` at payment-transaction grain |
| Orders ↔ Items | 1 order → M items | `fact_order_items` at line-item grain |
| Orders ↔ Reviews | 1 order → 1 review | Separate `fact_reviews` (different grain from items) |
| Customers ↔ Orders | 1 customer → M orders | Deduplicated `dim_customer` via `customer_unique_id` |

---

## 7. Surrogate Keys vs. Natural Keys

Every dimension table uses **integer surrogate keys** as primary keys, rather than the source system's natural keys.

| Dimension | Surrogate Key | Natural (Business) Key | Why Surrogate? |
|---|---|---|---|
| `dim_date` | `date_key` (YYYYMMDD int) | `full_date` | Integer comparison is faster than date parsing |
| `dim_customer` | `customer_key` (int) | `customer_unique_id` (32-char hash) | 4-byte int join vs. 32-byte string join |
| `dim_product` | `product_key` (int) | `product_id` (32-char hash) | Same — integer joins are 5-8x faster |
| `dim_seller` | `seller_key` (int) | `seller_id` (32-char hash) | Same |
| `dim_payment_type` | `payment_type_key` (int) | `payment_type` (varchar) | Consistency with other dims |
| `dim_order_status` | `order_status_key` (int) | `order_status` (varchar) | Consistency |

**Why surrogate keys?**

1. **Performance**: Integer joins (4 bytes) are faster than string joins (32 bytes) — especially when joining 112K fact rows to 96K dimension rows.
2. **Source independence**: If the source system changes its ID scheme (e.g., migrates from hash to UUID), our DWH doesn't break.
3. **SCD Type 2 support**: Surrogate keys allow multiple dimension rows for the same business entity (e.g., a customer who moved from Sao Paulo to Rio), each with different effective dates.
4. **Unknown/Missing Members**: Surrogate keys can represent missing data cleanly. We insert an **Unknown Member** row with key `-1` into every dimension. Fact tables use `COALESCE(dim_key, -1)` to ensure referential integrity even when source data is incomplete.

---

## 8. SCD Strategy

### Current Strategy: Mixed (Type 1 & Type 2)

Our architecture employs a hybrid approach depending on the dimension's volatility and analytical requirements:

| Dimension | SCD Type | Behavior | Why? |
|---|---|---|---|
| `dim_customer` | **Type 2** | Add new row with `valid_from`, `valid_to`, `is_current` | Customers occasionally move. We track 122 geographical changes across orders to ensure accurate historical geo-analysis. |
| `dim_seller` | **Type 2** | Add new row with `valid_from`, `valid_to`, `is_current` | Ensures architectural conformance with `dim_customer`, though sellers in this dataset do not change locations. |
| `dim_product` | **Type 1** | Overwrite | Product attributes (weight, category) are static corrections, not historical states. |
| Junk Dims | **Type 1** | Overwrite | Payment types and order statuses are static lookup tables. |

### How Temporal Joins Work (SCD Type 2)

In our fact tables (e.g., `fact_order_items`), we join to SCD2 dimensions using a temporal interval based on the exact time the business event occurred (`order_purchase_timestamp`):

```sql
LEFT JOIN dwh.dim_customer dc
    ON c.customer_unique_id = dc.customer_unique_id
    AND o.order_purchase_timestamp::DATE >= dc.valid_from
    AND o.order_purchase_timestamp::DATE <  dc.valid_to
```

This ensures that if a customer placed Order A while living in Sao Paulo, and Order B while living in Rio, the revenue is attributed to the correct city at the time of purchase.
