"""
Configuration for the PostgreSQL ELT Pipeline.

Design decisions:
- Credentials loaded from .env file for security (never hardcode passwords)
- Uses SQLAlchemy engine for pandas integration + raw psycopg2 for DDL
- Target database is created automatically if it doesn't exist
- Staging schema isolates raw data from the galaxy schema in the dwh schema
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# ──────────────────────────────────────────────
# Load environment variables
# ──────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ENV_PATH = PROJECT_ROOT / ".env"

# Load .env if it exists
load_dotenv(ENV_PATH)

# ──────────────────────────────────────────────
# PostgreSQL Connection Settings
# ──────────────────────────────────────────────
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = int(os.getenv("PG_PORT", "5432"))
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "admin")
PG_DATABASE = os.getenv("PG_DATABASE", "olist_dwh")

# Connection strings
PG_ADMIN_DSN = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/postgres"
PG_DWH_DSN = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}"

# ──────────────────────────────────────────────
# Source database
# ──────────────────────────────────────────────
SOURCE_DB_PATH = PROJECT_ROOT / "requirements" / "olist.sqlite"

# ──────────────────────────────────────────────
# Schema names
# ──────────────────────────────────────────────
STAGING_SCHEMA = "staging"
DWH_SCHEMA = "dwh"

# ──────────────────────────────────────────────
# Source tables
# ──────────────────────────────────────────────
SOURCE_TABLES = [
    "orders",
    "order_items",
    "order_payments",
    "order_reviews",
    "customers",
    "sellers",
    "products",
    "geolocation",
    "product_category_name_translation",
    "leads_qualified",
    "leads_closed",
]

# ──────────────────────────────────────────────
# SQL scripts in execution order
# ──────────────────────────────────────────────
SQL_DIR = Path(__file__).resolve().parent / "sql"

SQL_SCRIPTS = [
    "01_dim_date.sql",
    "02_dim_customer.sql",
    "03_dim_product.sql",
    "04_dim_seller.sql",
    "05_dim_payment_type.sql",
    "06_dim_order_status.sql",
    "06b_dim_marketing_origin.sql",
    "07_fact_order_items.sql",
    "08_fact_payments.sql",
    "09_fact_reviews.sql",
    "10_fact_leads.sql",
    "11_indexes.sql",
]

# ──────────────────────────────────────────────
# Logging
# ──────────────────────────────────────────────
LOG_DIR = PROJECT_ROOT / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
LOG_FILE = LOG_DIR / "pipeline_postgres.log"
