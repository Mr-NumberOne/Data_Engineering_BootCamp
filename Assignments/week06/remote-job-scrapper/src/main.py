from fastapi import FastAPI, BackgroundTasks
from contextlib import asynccontextmanager
import scraper

app = FastAPI(title="Remote Job Scraper API", version="1.0")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure DB is initialized and trigger initial scraping on startup
    scraper.init_db()
    scraper.scrape_jobs()
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Remote Job Scraper API", "docs": "/docs"}

@app.get("/jobs")
def get_jobs():
    conn = scraper.get_db_connection()
    jobs = conn.execute('SELECT * FROM jobs').fetchall()
    conn.close()
    return [dict(ix) for ix in jobs]

@app.post("/scrape")
def trigger_scrape(background_tasks: BackgroundTasks):
    background_tasks.add_task(scraper.scrape_jobs)
    return {"message": "Job Scraping started in background"}
