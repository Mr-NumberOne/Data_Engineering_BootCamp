import requests
from bs4 import BeautifulSoup
import sqlite3
import time
import os

DB_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(DB_DIR, "books.sqlite")

def get_db_connection():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            price TEXT NOT NULL,
            availability TEXT NOT NULL,
            scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

def scrape_books():
    init_db()
    conn = get_db_connection()
    url = "http://books.toscrape.com/"
    print(f"Scraping {url}...")
    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        books = soup.find_all('article', class_='product_pod')
        
        # Clear old data and insert new (simple reset for testing purpose)
        conn.execute('DELETE FROM books')
        
        for book in books:
            title = book.h3.a['title']
            price = book.find('p', class_='price_color').text
            availability = book.find('p', class_='instock availability').text.strip()
            
            conn.execute('INSERT INTO books (title, price, availability) VALUES (?, ?, ?)',
                         (title, price, availability))
        conn.commit()
        print("Scraping completed and saved to database.")
    except Exception as e:
        print(f"Failed to scrape: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    scrape_books()
