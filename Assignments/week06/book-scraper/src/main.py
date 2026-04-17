from fastapi import FastAPI, BackgroundTasks, HTTPException
from contextlib import asynccontextmanager
import sqlite3
import scraper
import os

app = FastAPI(title="Book Scraper API", version="1.0")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure DB is initialized and trigger initial scraping on startup
    scraper.init_db()
    scraper.scrape_books()
    yield

app = FastAPI(lifespan=lifespan)

@app.get("/")
def read_root():
    return {"message": "Welcome to the Book Scraper API", "docs": "/docs"}

@app.get("/books")
def get_books():
    conn = scraper.get_db_connection()
    books = conn.execute('SELECT * FROM books').fetchall()
    conn.close()
    return [dict(ix) for ix in books]

@app.post("/scrape")
def trigger_scrape(background_tasks: BackgroundTasks):
    background_tasks.add_task(scraper.scrape_books)
    return {"message": "Scraping started in background"}
