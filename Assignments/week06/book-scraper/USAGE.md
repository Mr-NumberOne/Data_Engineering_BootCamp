# Usage Guide

Once your Book Scraper Service is running (either via the installed `.deb` package or manually), you can interact with it over HTTP on port `8888`.

## 1. Web Base Path
Open your web browser and navigate to:
```
http://<YOUR_SERVER_IP>:8888/
```
You should see a welcome message.

## 2. API Documentation (Swagger UI)
FastAPI provides automatic interactive API documentation.
Visit:
```
http://<YOUR_SERVER_IP>:8888/docs
```
Here you can see all available endpoints and test them directly from your browser.

## 3. Endpoints

### `GET /books`
Retrieves all the parsed book data that the scraper has stored in the local SQLite database.

**Example Request:**
```bash
curl http://localhost:8888/books
```

**Example Response:**
```json
[
  {
    "id": 1,
    "title": "A Light in the Attic",
    "price": "£51.77",
    "availability": "In stock",
    "scraped_at": "2023-10-25 10:00:00"
  }
]
```

### `POST /scrape`
Asynchronously triggers a new web scraping job in the background. It will reach out to `books.toscrape.com`, parse the new layout, and update the database transparently while the user receives an immediate response.

**Example Request:**
```bash
curl -X POST http://localhost:8888/scrape
```

**Example Response:**
```json
{
  "message": "Scraping started in background"
}
```

## Logs and Debugging
If you are running the systemd service, you can check live logs and see if scraping hit any exceptions:
```bash
sudo journalctl -u book-scraper-api.service -f
```
