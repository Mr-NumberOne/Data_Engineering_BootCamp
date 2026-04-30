# Olist E-Commerce Data Warehouse

A production-ready data warehouse for the Olist e-commerce marketplace, built with a **Kimball Galaxy Schema** (Fact Constellation) on **PostgreSQL** using an **ELT pipeline**.

## Quick Start

```bash
# 1. Edit .env with your PostgreSQL credentials
# 2. Run the pipeline
python -m pipeline_postgres.run_pipeline

# 3. Verify analytical queries
python verify_queries.py
```

## Project Architecture

The project follows a modern **ELT (Extract, Load, Transform)** pattern, moving data from a source SQLite database into a structured PostgreSQL Data Warehouse.

### 1. High-Level Architecture

```
  ┌──────────────┐      ┌─────────────────────────┐      ┌──────────────┐
  │ SOURCE LAYER │      │       ELT PIPELINE      │      │  DWH LAYER   │
  │              │      │                         │      │              │
  │ olist.sqlite ├────▶│ Python (pandas) -> Load ├─────▶│  PostgreSQL  │
  │ (11 tables)  │      │ SQL Transforms -> Fact  │      │ (Galaxy)     │
  └──────────────┘      └─────────────────────────┘      └──────┬───────┘
                                                                │
                                                                ▼
                                                        ┌──────────────┐
                                                        │  REPORTING   │
                                                        │ (Dashboards) │
                                                        └──────────────┘
```

### 2. Data Model: Kimball Galaxy Schema

We implemented a **Galaxy Schema** (Fact Constellation) which features multiple fact tables sharing conformed dimensions. This allows for cross-process analysis while maintaining strict grain control.

- **4 Fact Tables**: `fact_order_items`, `fact_payments`, `fact_reviews`, `fact_leads`
- **7 Conformed Dimensions**: `dim_date`, `dim_customer` (SCD2), `dim_product`, `dim_seller` (SCD2), `dim_payment_type`, `dim_order_status`, `dim_marketing_origin`

### 3. Pipeline Design

The pipeline is built using **Python** and **PostgreSQL-native SQL**:

- **Staging Schema**: Raw data is loaded directly into a `staging` schema using pandas chunked writes.
- **DWH Schema**: SQL scripts transform staging data into the final dimensional model.
- **Data Integrity**: Enforced via Surrogate Keys, Primary Keys, and Foreign Keys.
- **Performance**: Optimized with B-tree indexes and `ANALYZE` for the query planner.

## Documentation

See [docs/documentation.md](docs/documentation.md) for complete documentation including:

- Architecture decisions and justification
- Data model with galaxy schema diagrams and grain definitions
- Pipeline design (ELT pattern)
- Data quality handling
- Performance optimization (indexing, ANALYZE)
- Key assumptions and trade-offs

**Note**: AI was used for speeding up the process of coding and documentation writing, not for the design of the data warehouse.

---

**Copyright**: Ahmed Maher Al-Maqtari © 2026. All rights reserved.
