import requests
from bs4 import BeautifulSoup
import sqlite3
import os

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DB_DIR, "jobs.sqlite")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            company TEXT NOT NULL,
            location TEXT NOT NULL,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def scrape_jobs():
    init_db()
    conn = get_db_connection()
    url = "https://www.python.org/jobs/"
    print(f"Scraping {url}...")
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # In python.org/jobs/, the listings are within the .list-recent-jobs class
        jobs_list = soup.find('ol', class_='list-recent-jobs')
        
        # We clear the existing rows to simulate fresh state
        conn.execute('DELETE FROM jobs')
        
        if jobs_list:
            jobs = jobs_list.find_all('li')
            for job in jobs:
                # Extract Title
                title_tag = job.find('h2', class_='listing-company')
                if not title_tag:
                    continue
                title_elem = title_tag.find('a')
                title = title_elem.text.strip() if title_elem else "Unknown Title"
                
                # The company is usually text right next to the title in the h2
                # But let's just grab the location
                location_elem = job.find('span', class_='listing-location')
                location = location_elem.text.strip() if location_elem else "Unknown Location"
                
                # For company name, python.org job board mixes it. 
                # Let's extract company from the main listing-company header contents
                # Usually it looks like "Company Name\n\tTitle" - we'll just extract raw text and split if needed
                full_text = title_tag.text.strip()
                company_str = full_text.split('\n')[0].strip() if '\n' in full_text else "Unknown Company"
                if company_str == title:
                    company_str = "See Title"
                
                conn.execute('INSERT INTO jobs (title, company, location) VALUES (?, ?, ?)',
                             (title, company_str, location))
        conn.commit()
        print("Scraping completed and saved to database.")
    except Exception as e:
        print(f"Failed to scrape: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    scrape_jobs()
