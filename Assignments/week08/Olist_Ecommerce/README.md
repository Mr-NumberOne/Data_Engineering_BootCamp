# Olist E-Commerce Data Warehouse

A production-ready data warehouse for the Olist Brazilian e-commerce marketplace, built with a **Kimball Galaxy Schema** (Fact Constellation) on **PostgreSQL** using an **ELT pipeline**.

## Quick Start

```bash
# 1. Edit .env with your PostgreSQL credentials
# 2. Run the pipeline
python -m pipeline_postgres.run_pipeline

# 3. Verify analytical queries
python verify_queries.py
```

## Architecture

- **Model**: Kimball Galaxy Schema — 4 fact tables, 6 shared dimensions
- **Pipeline**: Python/psycopg2 ELT → PostgreSQL (`olist_dwh` database)
- **Schemas**: `staging` (raw data) + `dwh` (galaxy schema)
- **Source**: `requirements/olist.sqlite` (11 tables, ~100K orders)

## Documentation

See [docs/documentation.md](docs/documentation.md) for complete documentation including:
- Architecture decisions and justification
- Data model with galaxy schema diagrams and grain definitions
- Pipeline design (ELT pattern)
- Data quality handling
- Performance optimization (indexing, ANALYZE)
- Key assumptions and trade-offs
