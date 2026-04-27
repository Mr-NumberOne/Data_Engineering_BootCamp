"""
PostgreSQL ELT Pipeline -- Orchestrator

Runs the full Extract+Load -> Transform (SQL) pipeline targeting PostgreSQL:
- Auto-creates the database and schemas if they don't exist
- Loads all source data into a staging schema via pandas/SQLAlchemy
- Transforms using SQL scripts executed against PostgreSQL
- Validates row counts, revenue reconciliation, and referential integrity
- Idempotent: safe to re-run (DROP + CREATE pattern)
"""
import sys
import time
import logging
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine, text
from pipeline_postgres.config import (
    LOG_FILE, PG_DWH_DSN, SQL_DIR, SQL_SCRIPTS,
    STAGING_SCHEMA, DWH_SCHEMA,
)
from pipeline_postgres.extract_load import (
    create_database_if_not_exists,
    create_schemas,
    extract_and_load_staging,
)


def setup_logging() -> None:
    """Configure dual logging: console (INFO) + file (DEBUG)."""
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    console = logging.StreamHandler(sys.stdout)
    console.setLevel(logging.INFO)
    console.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)-7s | %(message)s",
        datefmt="%H:%M:%S"
    ))
    root_logger.addHandler(console)

    file_handler = logging.FileHandler(str(LOG_FILE), mode="w", encoding="utf-8")
    file_handler.setLevel(logging.DEBUG)
    file_handler.setFormatter(logging.Formatter(
        "%(asctime)s | %(levelname)-7s | %(name)s | %(message)s"
    ))
    root_logger.addHandler(file_handler)


def run_sql_scripts(engine) -> None:
    """
    Execute all SQL transformation scripts in order against PostgreSQL.
    
    Each script:
    - Drops and recreates its target table (idempotent)
    - Reads from staging.* and/or dwh.* dimension tables
    - Produces one table in the dwh schema
    """
    logger = logging.getLogger(__name__)

    for script_name in SQL_SCRIPTS:
        script_path = SQL_DIR / script_name
        if not script_path.exists():
            raise FileNotFoundError(f"SQL script not found: {script_path}")

        logger.info(f"  Executing: {script_name}")
        sql_content = script_path.read_text(encoding="utf-8")

        try:
            with engine.connect() as conn:
                # Split by semicolons and execute each statement
                statements = [s.strip() for s in sql_content.split(";") if s.strip()]
                for stmt in statements:
                    # Skip comments-only statements
                    non_comment = [
                        line for line in stmt.split("\n")
                        if line.strip() and not line.strip().startswith("--")
                    ]
                    if non_comment:
                        conn.execute(text(stmt))
                conn.commit()

            # Report the table that was created
            table_name = script_name.split("_", 1)[1].replace(".sql", "")
            if table_name != "indexes":
                try:
                    with engine.connect() as conn:
                        result = conn.execute(
                            text(f"SELECT COUNT(*) FROM {DWH_SCHEMA}.{table_name}")
                        ).fetchone()
                        logger.info(f"    -> {table_name}: {result[0]:,} rows")
                except Exception:
                    pass

        except Exception as e:
            logger.error(f"Failed on script {script_name}: {e}")
            raise


def validate_warehouse(engine) -> None:
    """
    Post-load validation: row counts, revenue reconciliation,
    and referential integrity checks.
    """
    logger = logging.getLogger(__name__)
    logger.info("Running validation checks...")

    expected_tables = [
        "dim_date", "dim_customer", "dim_product", "dim_seller",
        "dim_payment_type", "dim_order_status",
        "fact_order_items", "fact_payments", "fact_reviews", "fact_leads",
    ]

    with engine.connect() as conn:
        # Check all tables exist and have data
        for table in expected_tables:
            result = conn.execute(
                text(f"SELECT COUNT(*) FROM {DWH_SCHEMA}.{table}")
            ).fetchone()
            count = result[0]
            if count == 0:
                logger.error(f"[FAIL] {table} is empty!")
            else:
                logger.info(f"  [OK] {table}: {count:,} rows")

        # Revenue reconciliation
        source_revenue = conn.execute(
            text(f"SELECT ROUND(SUM(price)::NUMERIC, 2) FROM {STAGING_SCHEMA}.order_items")
        ).fetchone()[0]
        target_revenue = conn.execute(
            text(f"SELECT ROUND(SUM(price)::NUMERIC, 2) FROM {DWH_SCHEMA}.fact_order_items")
        ).fetchone()[0]

        if abs(float(source_revenue) - float(target_revenue)) < 0.01:
            logger.info(f"  [OK] Revenue reconciliation passed: R${target_revenue:,.2f}")
        else:
            logger.warning(
                f"  [WARN] Revenue mismatch! Source: R${source_revenue:,.2f}, "
                f"Target: R${target_revenue:,.2f}"
            )

        # Referential integrity
        orphans = conn.execute(text(f"""
            SELECT COUNT(*) FROM {DWH_SCHEMA}.fact_order_items f
            LEFT JOIN {DWH_SCHEMA}.dim_customer d ON f.customer_key = d.customer_key
            WHERE d.customer_key IS NULL
        """)).fetchone()[0]

        if orphans == 0:
            logger.info("  [OK] Referential integrity (customer): passed")
        else:
            logger.warning(f"  [WARN] {orphans} orphan customer keys in fact_order_items")

    logger.info("Validation complete.")


def main() -> None:
    """Run the complete PostgreSQL ELT pipeline."""
    setup_logging()
    logger = logging.getLogger(__name__)

    logger.info("====================================================")
    logger.info("   OLIST DATA WAREHOUSE - POSTGRESQL ELT PIPELINE    ")
    logger.info("====================================================")

    total_start = time.time()

    try:
        # ── DATABASE SETUP ───────────────────────────
        logger.info("")
        logger.info(">> PHASE 0: DATABASE SETUP")
        create_database_if_not_exists()
        engine = create_engine(PG_DWH_DSN, echo=False)
        create_schemas(engine)

        # ── EXTRACT + LOAD (staging) ─────────────────
        logger.info("")
        logger.info(">> PHASE 1: EXTRACT & LOAD TO STAGING")
        t0 = time.time()
        extract_and_load_staging(engine)
        el_time = time.time() - t0
        logger.info(f"  Extract+Load completed in {el_time:.2f}s")

        # ── TRANSFORM (SQL scripts) ──────────────────
        logger.info("")
        logger.info(">> PHASE 2: TRANSFORM (SQL)")
        t0 = time.time()
        run_sql_scripts(engine)
        transform_time = time.time() - t0
        logger.info(f"  Transform completed in {transform_time:.2f}s")

        # ── VALIDATE ─────────────────────────────────
        logger.info("")
        logger.info(">> PHASE 3: VALIDATE")
        t0 = time.time()
        validate_warehouse(engine)
        validate_time = time.time() - t0

        # ── SUMMARY ──────────────────────────────────
        total_time = time.time() - total_start
        logger.info("")
        logger.info("====================================================")
        logger.info("              PIPELINE SUMMARY                       ")
        logger.info("----------------------------------------------------")
        logger.info(f"  Extract+Load: {el_time:>6.2f}s")
        logger.info(f"  Transform:    {transform_time:>6.2f}s")
        logger.info(f"  Validate:     {validate_time:>6.2f}s")
        logger.info(f"  Total:        {total_time:>6.2f}s")
        logger.info("====================================================")
        logger.info("[SUCCESS] Pipeline completed successfully!")
        logger.info(f"  Target: PostgreSQL database '{PG_DWH_DSN.split('@')[1]}'")

    except Exception as e:
        logger.error(f"[FAILED] Pipeline failed: {e}", exc_info=True)
        sys.exit(1)
    finally:
        if 'engine' in locals():
            engine.dispose()


if __name__ == "__main__":
    main()
