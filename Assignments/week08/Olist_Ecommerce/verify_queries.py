"""
Run sample analytical queries against the PostgreSQL DWH to verify they work.
"""
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
import pandas as pd

# Load credentials
load_dotenv()
PG_HOST = os.getenv("PG_HOST", "localhost")
PG_PORT = os.getenv("PG_PORT", "5432")
PG_USER = os.getenv("PG_USER", "postgres")
PG_PASSWORD = os.getenv("PG_PASSWORD", "root")
PG_DATABASE = os.getenv("PG_DATABASE", "olist_dwh")

dsn = f"postgresql://{PG_USER}:{PG_PASSWORD}@{PG_HOST}:{PG_PORT}/{PG_DATABASE}"
engine = create_engine(dsn)

queries = {
    "Q1: Sales Trending (Monthly Revenue)": """
        SELECT d.year_month, d.month_name,
               COUNT(DISTINCT f.order_id) AS orders,
               ROUND(SUM(f.price)::NUMERIC, 2) AS revenue
        FROM dwh.fact_order_items f
        INNER JOIN dwh.dim_date d ON f.purchase_date_key = d.date_key
        GROUP BY d.year_month, d.year, d.month, d.month_name
        ORDER BY d.year, d.month
        LIMIT 5
    """,
    "Q2: Top 5 Customers by Revenue": """
        SELECT f.customer_key, dc.customer_city, dc.customer_state,
               COUNT(DISTINCT f.order_id) AS orders,
               ROUND(SUM(f.price)::NUMERIC, 2) AS total_spent
        FROM dwh.fact_order_items f
        INNER JOIN dwh.dim_customer dc ON f.customer_key = dc.customer_key
        GROUP BY f.customer_key, dc.customer_city, dc.customer_state
        ORDER BY total_spent DESC
        LIMIT 5
    """,
    "Q3: Delivery Performance by State (Top 5 Late)": """
        SELECT dc.customer_state,
               ROUND(AVG(f.delivery_days)::NUMERIC, 1) AS avg_days,
               ROUND((SUM(f.is_late_delivery) * 100.0 / COUNT(*))::NUMERIC, 1) AS late_pct
        FROM dwh.fact_order_items f
        INNER JOIN dwh.dim_customer dc ON f.customer_key = dc.customer_key
        WHERE f.delivery_days IS NOT NULL AND f.is_late_delivery IS NOT NULL
        GROUP BY dc.customer_state
        ORDER BY late_pct DESC
        LIMIT 5
    """,
    "Q4: Top 5 Product Categories by Revenue": """
        SELECT dp.product_category_name_english AS category,
               ROUND(SUM(f.price)::NUMERIC, 2) AS revenue
        FROM dwh.fact_order_items f
        INNER JOIN dwh.dim_product dp ON f.product_key = dp.product_key
        GROUP BY dp.product_category_name_english
        ORDER BY revenue DESC
        LIMIT 5
    """,
    "Q5: Payment Method Distribution": """
        SELECT pt.payment_type,
               COUNT(*) AS transactions,
               ROUND(SUM(fp.payment_value)::NUMERIC, 2) AS total_value
        FROM dwh.fact_payments fp
        INNER JOIN dwh.dim_payment_type pt ON fp.payment_type_key = pt.payment_type_key
        GROUP BY pt.payment_type
        ORDER BY total_value DESC
    """,
    "Q8: Lead Conversion by Origin": """
        SELECT mo.origin,
               COUNT(*) AS total_leads,
               SUM(f.is_converted) AS converted,
               ROUND((SUM(f.is_converted) * 100.0 / COUNT(*))::NUMERIC, 1) AS conversion_pct
        FROM dwh.fact_leads f
        INNER JOIN dwh.dim_marketing_origin mo ON f.marketing_origin_key = mo.marketing_origin_key
        GROUP BY mo.origin
        ORDER BY conversion_pct DESC
        LIMIT 5
    """,
}

with engine.connect() as conn:
    for title, sql in queries.items():
        print(f"\n{'='*60}")
        print(f"  {title}")
        print(f"{'='*60}")
        result = pd.read_sql(text(sql), conn)
        print(result.to_string(index=False))

engine.dispose()
print(f"\n{'='*60}")
print("  All queries executed successfully!")
print(f"{'='*60}")
