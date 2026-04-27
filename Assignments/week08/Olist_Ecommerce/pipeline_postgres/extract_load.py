"""
Extract & Load Module — loads all SQLite source tables into PostgreSQL staging schema.

Design decisions:
- Uses pandas read_sql + to_sql with SQLAlchemy for clean DataFrame-based loading
- Creates the target database if it doesn't exist (idempotent setup)
- All source tables land in a 'staging' schema
- Uses chunked writes (5000 rows) to avoid memory spikes on large tables
- psycopg2 is used for DDL (CREATE DATABASE, CREATE SCHEMA) because
  SQLAlchemy sessions can't run CREATE DATABASE inside transactions
"""
import sqlite3
import logging
import pandas as pd
import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
from sqlalchemy import create_engine, text
from pipeline_postgres.config import (
    SOURCE_DB_PATH, SOURCE_TABLES,
    PG_ADMIN_DSN, PG_DWH_DSN, PG_DATABASE,
    PG_HOST, PG_PORT, PG_USER, PG_PASSWORD,
    STAGING_SCHEMA, DWH_SCHEMA,
)

logger = logging.getLogger(__name__)

# Columns that should be parsed as datetime
DATE_COLUMNS = {
    "orders": [
        "order_purchase_timestamp", "order_approved_at",
        "order_delivered_carrier_date", "order_delivered_customer_date",
        "order_estimated_delivery_date",
    ],
    "order_items": ["shipping_limit_date"],
    "order_reviews": ["review_creation_date", "review_answer_timestamp"],
    "leads_qualified": ["first_contact_date"],
    "leads_closed": ["won_date"],
}


def create_database_if_not_exists() -> None:
    """
    Create the target PostgreSQL database if it doesn't exist.
    
    Uses psycopg2 directly because CREATE DATABASE cannot run 
    inside a transaction (SQLAlchemy wraps everything in transactions).
    """
    logger.info(f"Checking if database '{PG_DATABASE}' exists...")

    conn = psycopg2.connect(
        host=PG_HOST, port=PG_PORT,
        user=PG_USER, password=PG_PASSWORD,
        dbname="postgres"
    )
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
    cur = conn.cursor()

    cur.execute(
        "SELECT 1 FROM pg_database WHERE datname = %s", (PG_DATABASE,)
    )
    exists = cur.fetchone()

    if not exists:
        cur.execute(f'CREATE DATABASE "{PG_DATABASE}"')
        logger.info(f"  Database '{PG_DATABASE}' created")
    else:
        logger.info(f"  Database '{PG_DATABASE}' already exists")

    cur.close()
    conn.close()


def create_schemas(engine) -> None:
    """Create staging and dwh schemas if they don't exist."""
    with engine.connect() as conn:
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {STAGING_SCHEMA}"))
        conn.execute(text(f"CREATE SCHEMA IF NOT EXISTS {DWH_SCHEMA}"))
        conn.commit()
    logger.info(f"  Schemas ready: {STAGING_SCHEMA}, {DWH_SCHEMA}")


def extract_and_load_staging(engine) -> None:
    """
    Load all source tables from SQLite into PostgreSQL staging schema.
    
    Uses pandas as the bridge: read from SQLite -> write to PostgreSQL.
    Each table is dropped and recreated (full refresh).
    """
    logger.info(f"Loading source data from: {SOURCE_DB_PATH}")

    if not SOURCE_DB_PATH.exists():
        raise FileNotFoundError(f"Source database not found: {SOURCE_DB_PATH}")

    sqlite_conn = sqlite3.connect(str(SOURCE_DB_PATH))

    try:
        for table in SOURCE_TABLES:
            logger.info(f"  Staging: {table}")

            # Read from SQLite
            df = pd.read_sql_query(f'SELECT * FROM "{table}"', sqlite_conn)

            # Parse date columns
            if table in DATE_COLUMNS:
                for col in DATE_COLUMNS[table]:
                    if col in df.columns:
                        df[col] = pd.to_datetime(df[col], errors="coerce")

            # Write to PostgreSQL staging schema
            # if_exists='replace' drops and recreates the table (idempotent)
            df.to_sql(
                name=table,
                con=engine,
                schema=STAGING_SCHEMA,
                if_exists="replace",
                index=False,
                chunksize=5000,  # Chunked writes for memory efficiency
                method="multi",  # Batch INSERT for performance
            )

            logger.info(f"    -> {len(df):,} rows loaded")

    finally:
        sqlite_conn.close()

    logger.info("All tables staged successfully.")
