from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from database import get_db
from typing import Optional

router = APIRouter()

def get_filter_clause(state: Optional[str] = None, year_month: Optional[str] = None, table_alias: str = 'f') -> str:
    clauses = []
    if state:
        clauses.append(f"c.customer_state = '{state}'")
    if year_month:
        clauses.append(f"d.year_month = '{year_month}'")
    
    if not clauses:
        return ""
    return " WHERE " + " AND ".join(clauses)

def get_joins(state: Optional[str] = None, year_month: Optional[str] = None, table_alias: str = 'f') -> str:
    joins = []
    if state:
        joins.append(f"JOIN dwh.dim_customer c ON {table_alias}.customer_key = c.customer_key")
    if year_month:
        joins.append(f"JOIN dwh.dim_date d ON {table_alias}.purchase_date_key = d.date_key")
    # Avoid duplicate joins if they are already in the main query
    return " ".join(joins)

@router.get("/filters/options")
def get_filter_options(db: Session = Depends(get_db)):
    states = db.execute(text("SELECT DISTINCT customer_state FROM dwh.dim_customer WHERE is_current = TRUE ORDER BY customer_state")).fetchall()
    months = db.execute(text("SELECT DISTINCT year_month FROM dwh.dim_date WHERE year_month IS NOT NULL ORDER BY year_month DESC")).fetchall()
    
    return {
        "states": [r[0] for r in states if r[0]],
        "months": [r[0] for r in months if r[0]]
    }

@router.get("/kpis")
def get_kpis(state: Optional[str] = None, year_month: Optional[str] = None, db: Session = Depends(get_db)):
    joins = get_joins(state, year_month)
    where = get_filter_clause(state, year_month)
    
    query = text(f"""
        SELECT 
            ROUND(SUM(f.price)::numeric, 2) AS total_revenue,
            COUNT(DISTINCT f.order_id) AS total_orders,
            ROUND((SUM(f.price) / NULLIF(COUNT(DISTINCT f.order_id), 0))::numeric, 2) AS aov,
            COUNT(DISTINCT f.order_item_key) AS total_items,
            ROUND(SUM(f.freight_value)::numeric, 2) AS total_freight,
            ROUND(AVG(r.review_score)::numeric, 2) AS avg_review_score
        FROM dwh.fact_order_items f
        LEFT JOIN (
            SELECT order_id, AVG(review_score) as review_score 
            FROM dwh.fact_reviews 
            GROUP BY order_id
        ) r ON f.order_id = r.order_id
        {joins}
        {where}
    """)
    result = db.execute(query).fetchone()
    if not result:
        return {"total_revenue": 0, "total_orders": 0, "aov": 0, "total_items": 0, "total_freight": 0, "avg_review_score": 0}
    return {
        "total_revenue": float(result[0] or 0),
        "total_orders": result[1] or 0,
        "aov": float(result[2] or 0),
        "total_items": result[3] or 0,
        "total_freight": float(result[4] or 0),
        "avg_review_score": float(result[5] or 0)
    }

@router.get("/sales-trend")
def get_sales_trend(state: Optional[str] = None, db: Session = Depends(get_db)):
    # Year/month filter doesn't make sense for a trend chart, so we only apply state
    joins = get_joins(state, None)
    where = get_filter_clause(state, None)
    
    query = text(f"""
        SELECT 
            d.year_month,
            ROUND(SUM(f.price)::numeric, 2) as monthly_revenue
        FROM dwh.fact_order_items f
        JOIN dwh.dim_date d ON f.purchase_date_key = d.date_key
        {joins.replace('JOIN dwh.dim_date d ON f.purchase_date_key = d.date_key', '')}
        {where}
        GROUP BY d.year_month
        ORDER BY d.year_month
    """)
    results = db.execute(query).fetchall()
    return [{"month": r[0], "revenue": float(r[1])} for r in results]

@router.get("/category-revenue")
def get_category_revenue(state: Optional[str] = None, year_month: Optional[str] = None, db: Session = Depends(get_db)):
    joins = get_joins(state, year_month)
    where = get_filter_clause(state, year_month)
    
    query = text(f"""
        SELECT 
            p.product_category_name_english as category,
            ROUND(SUM(f.price)::numeric, 2) as total_revenue
        FROM dwh.fact_order_items f
        JOIN dwh.dim_product p ON f.product_key = p.product_key
        {joins}
        {where}
        GROUP BY p.product_category_name_english
        ORDER BY total_revenue DESC
        LIMIT 10
    """)
    results = db.execute(query).fetchall()
    return [{"category": r[0], "revenue": float(r[1])} for r in results]

@router.get("/payment-distribution")
def get_payment_distribution(state: Optional[str] = None, year_month: Optional[str] = None, db: Session = Depends(get_db)):
    joins = get_joins(state, year_month)
    where = get_filter_clause(state, year_month)
    
    query = text(f"""
        SELECT 
            p.payment_type,
            COUNT(f.payment_key) as transaction_count,
            ROUND(SUM(f.payment_value)::numeric, 2) as total_value
        FROM dwh.fact_payments f
        JOIN dwh.dim_payment_type p ON f.payment_type_key = p.payment_type_key
        {joins}
        {where}
        GROUP BY p.payment_type
        ORDER BY total_value DESC
    """)
    results = db.execute(query).fetchall()
    return [{"payment_type": r[0], "transaction_count": r[1], "total_value": float(r[2])} for r in results]

@router.get("/delivery-performance")
def get_delivery_performance(state: Optional[str] = None, year_month: Optional[str] = None, db: Session = Depends(get_db)):
    joins = get_joins(None, year_month) # State filter doesn't apply cleanly to a state-based chart, or we could just filter it.
    where = get_filter_clause(None, year_month)
    
    query = text(f"""
        SELECT 
            c.customer_state as state,
            COUNT(DISTINCT f.order_id) as total_orders,
            SUM(f.is_late_delivery) as late_orders,
            ROUND((SUM(f.is_late_delivery)::numeric / NULLIF(COUNT(DISTINCT f.order_id), 0) * 100), 2) as late_percentage
        FROM dwh.fact_order_items f
        JOIN dwh.dim_customer c ON f.customer_key = c.customer_key
        {joins}
        {where}
        GROUP BY c.customer_state
        HAVING COUNT(DISTINCT f.order_id) > 100
        ORDER BY late_percentage DESC
        LIMIT 10
    """)
    results = db.execute(query).fetchall()
    return [{"state": r[0], "total_orders": r[1], "late_orders": r[2], "late_percentage": float(r[3] or 0)} for r in results]

# ==============================================================
# NEW ENDPOINTS
# ==============================================================

@router.get("/customers/rfm")
def get_customer_rfm(state: Optional[str] = None, year_month: Optional[str] = None, db: Session = Depends(get_db)):
    where = get_filter_clause(state, year_month)
    # Just simple inline joins to avoid complexity for CTE
    
    query = text(f"""
        SELECT
            c.customer_unique_id,
            MAX(c_curr.customer_city) AS customer_city,
            MAX(c_curr.customer_state) AS customer_state,
            COUNT(DISTINCT f.order_id) AS order_count,
            ROUND(SUM(f.price)::NUMERIC, 2) AS total_spent,
            ROUND(AVG(f.price)::NUMERIC, 2) AS avg_order_value,
            MAX(d.full_date) AS last_order_date
        FROM dwh.fact_order_items f
        JOIN dwh.dim_customer c ON f.customer_key = c.customer_key
        JOIN dwh.dim_customer c_curr ON c.customer_unique_id = c_curr.customer_unique_id AND c_curr.is_current = TRUE
        JOIN dwh.dim_date d ON f.purchase_date_key = d.date_key
        {where}
        GROUP BY c.customer_unique_id
        ORDER BY total_spent DESC
        LIMIT 20
    """)
    results = db.execute(query).fetchall()
    return [
        {
            "customer_key": r[0],
            "city": r[1],
            "state": r[2],
            "orders": r[3],
            "spent": float(r[4]),
            "aov": float(r[5]),
            "last_order": str(r[6])
        } for r in results
    ]

@router.get("/sellers/performance")
def get_seller_performance(state: Optional[str] = None, year_month: Optional[str] = None, db: Session = Depends(get_db)):
    joins = get_joins(state, year_month)
    where = get_filter_clause(state, year_month)
    
    query = text(f"""
        SELECT
            ds.seller_id,
            MAX(ds_curr.seller_city) AS seller_city,
            MAX(ds_curr.seller_state) AS seller_state,
            COUNT(DISTINCT f.order_id) AS orders_fulfilled,
            ROUND(SUM(f.price)::NUMERIC, 2) AS total_revenue,
            ROUND(AVG(f.delivery_days)::NUMERIC, 1) AS avg_delivery_days,
            ROUND(AVG(r.review_score)::NUMERIC, 2) AS avg_review_score
        FROM dwh.fact_order_items f
        JOIN dwh.dim_seller ds ON f.seller_key = ds.seller_key
        JOIN dwh.dim_seller ds_curr ON ds.seller_id = ds_curr.seller_id AND ds_curr.is_current = TRUE
        LEFT JOIN dwh.fact_reviews r ON f.order_id = r.order_id
        {joins}
        {where}
        GROUP BY ds.seller_id
        ORDER BY total_revenue DESC
        LIMIT 20
    """)
    results = db.execute(query).fetchall()
    return [
        {
            "seller_key": r[0],
            "city": r[1],
            "state": r[2],
            "orders": r[3],
            "revenue": float(r[4] or 0),
            "delivery_days": float(r[5] or 0),
            "review_score": float(r[6] or 0)
        } for r in results
    ]

@router.get("/sales/day-of-week")
def get_day_of_week(state: Optional[str] = None, year_month: Optional[str] = None, db: Session = Depends(get_db)):
    joins = get_joins(state, year_month)
    where = get_filter_clause(state, year_month)
    
    query = text(f"""
        SELECT
            d.day_name,
            d.day_of_week,
            ROUND(SUM(f.price)::NUMERIC, 2) AS revenue
        FROM dwh.fact_order_items f
        JOIN dwh.dim_date d ON f.purchase_date_key = d.date_key
        {joins.replace('JOIN dwh.dim_date d ON f.purchase_date_key = d.date_key', '')}
        {where}
        GROUP BY d.day_name, d.day_of_week
        ORDER BY d.day_of_week
    """)
    results = db.execute(query).fetchall()
    return [{"day": r[0], "revenue": float(r[2])} for r in results]

@router.get("/leads/conversion")
def get_lead_conversion(db: Session = Depends(get_db)):
    # Origin conversion doesn't really map well to customer_state or purchase_date
    query = text("""
        SELECT
            m.origin,
            COUNT(*) AS total_leads,
            SUM(f.is_converted) AS converted_leads,
            ROUND((SUM(f.is_converted) * 100.0 / COUNT(*))::NUMERIC, 1) AS conversion_rate_pct
        FROM dwh.fact_leads f
        JOIN dwh.dim_marketing_origin m ON f.marketing_origin_key = m.marketing_origin_key
        WHERE m.origin IS NOT NULL AND m.origin != 'unknown' AND m.marketing_origin_key != -1
        GROUP BY m.origin
        ORDER BY total_leads DESC
    """)
    results = db.execute(query).fetchall()
    return [
        {
            "origin": r[0],
            "total": r[1],
            "converted": r[2],
            "rate": float(r[3] or 0)
        } for r in results
    ]

@router.get("/sales/geo-distribution")
def get_geo_distribution(year_month: Optional[str] = None, db: Session = Depends(get_db)):
    # State filter doesn't make sense since we are plotting all states
    joins = get_joins(None, year_month)
    where = get_filter_clause(None, year_month)
    
    query = text(f"""
        SELECT
            c.customer_state as state,
            ROUND(SUM(f.price)::NUMERIC, 2) AS total_revenue,
            COUNT(DISTINCT c.customer_unique_id) AS unique_customers
        FROM dwh.fact_order_items f
        JOIN dwh.dim_customer c ON f.customer_key = c.customer_key
        {joins}
        {where}
        GROUP BY c.customer_state
        ORDER BY total_revenue DESC
        LIMIT 10
    """)
    results = db.execute(query).fetchall()
    return [
        {
            "state": r[0],
            "revenue": float(r[1]),
            "customers": r[2]
        } for r in results
    ]

@router.get("/customers/cohorts")
def get_cohorts(state: Optional[str] = None, db: Session = Depends(get_db)):
    where = get_filter_clause(state, None, 'f')
    
    query = text(f"""
        WITH customer_orders AS (
            SELECT
                c.customer_unique_id,
                d.year_month AS order_month,
                ROW_NUMBER() OVER (PARTITION BY c.customer_unique_id ORDER BY MIN(d.full_date)) AS order_seq
            FROM dwh.fact_order_items f
            JOIN dwh.dim_date d ON f.purchase_date_key = d.date_key
            LEFT JOIN dwh.dim_customer c ON f.customer_key = c.customer_key
            {where.replace('WHERE', 'WHERE ') if where else ''}
            GROUP BY c.customer_unique_id, d.year_month
        ),
        cohorts AS (
            SELECT
                customer_unique_id,
                order_month AS cohort_month
            FROM customer_orders
            WHERE order_seq = 1
        )
        SELECT
            c.cohort_month,
            COUNT(DISTINCT c.customer_unique_id) AS cohort_size,
            COUNT(DISTINCT CASE WHEN co.order_seq > 1 THEN c.customer_unique_id END) AS repeat_customers,
            ROUND((
                COUNT(DISTINCT CASE WHEN co.order_seq > 1 THEN c.customer_unique_id END) * 100.0 
                / NULLIF(COUNT(DISTINCT c.customer_unique_id), 0)
            )::NUMERIC, 1) AS repeat_rate_pct
        FROM cohorts c
        LEFT JOIN customer_orders co ON c.customer_unique_id = co.customer_unique_id
        GROUP BY c.cohort_month
        ORDER BY c.cohort_month
    """)
    results = db.execute(query).fetchall()
    # Filter out empty cohort months
    return [
        {
            "cohort": r[0],
            "size": r[1],
            "repeat": r[2],
            "rate": float(r[3] or 0)
        } for r in results if r[0] is not None
    ]

@router.get("/customers/satisfaction")
def get_customer_satisfaction(state: Optional[str] = None, year_month: Optional[str] = None, db: Session = Depends(get_db)):
    joins = get_joins(state, year_month)
    where = get_filter_clause(state, year_month)
    
    query = text(f"""
        SELECT 
            r.review_score,
            COUNT(DISTINCT r.review_id) as review_count
        FROM dwh.fact_reviews r
        JOIN dwh.fact_order_items f ON r.order_id = f.order_id
        {joins}
        {where}
        GROUP BY r.review_score
        ORDER BY r.review_score DESC
    """)
    results = db.execute(query).fetchall()
    return [{"score": r[0], "count": r[1]} for r in results]

@router.get("/logistics/freight-ratio")
def get_freight_ratio(year_month: Optional[str] = None, db: Session = Depends(get_db)):
    joins = get_joins(None, year_month)
    where = get_filter_clause(None, year_month)
    
    query = text(f"""
        SELECT 
            c.customer_state as state,
            ROUND(SUM(f.freight_value)::numeric, 2) as total_freight,
            ROUND(SUM(f.price)::numeric, 2) as total_revenue,
            ROUND((SUM(f.freight_value) / NULLIF(SUM(f.price), 0) * 100)::numeric, 2) as freight_ratio_pct
        FROM dwh.fact_order_items f
        JOIN dwh.dim_customer c ON f.customer_key = c.customer_key
        {joins}
        {where}
        GROUP BY c.customer_state
        ORDER BY freight_ratio_pct DESC
        LIMIT 10
    """)
    results = db.execute(query).fetchall()
    return [{"state": r[0], "freight": float(r[1]), "revenue": float(r[2]), "ratio": float(r[3] or 0)} for r in results]
