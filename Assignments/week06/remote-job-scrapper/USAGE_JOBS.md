# Remote Job Scraper API - Usage Guide

Once your Remote Job Scraper Service is running, you can interact with it over HTTP on port `8889` (ensuring it does not conflict with our book scraper on `8888`).

## 1. Web Base Path
Open your web browser and navigate to:
```
http://<YOUR_SERVER_IP>:8889/
```

## 2. API Documentation (Swagger UI)
FastAPI provides automatic interactive API documentation.
Visit:
```
http://<YOUR_SERVER_IP>:8889/docs
```

## 3. Endpoints

### `GET /jobs`
Retrieves all the parsed remote jobs that the scraper has stored in the local SQLite database.

**Example Request:**
```bash
curl http://localhost:8889/jobs
```

**Example Response:**
```json
[
  {
    "id": 1,
    "title": "Senior Back-End Engineer",
    "company": "Canonical",
    "location": "Remote",
    "scraped_at": "2023-10-25 10:00:00"
  }
]
```

### `POST /scrape`
Asynchronously triggers a new web scraping job in the background to fetch new remote job listings from python.org.

**Example Request:**
```bash
curl -X POST http://localhost:8889/scrape
```

**Example Response:**
```json
{
  "message": "Job Scraping started in background"
}
```
