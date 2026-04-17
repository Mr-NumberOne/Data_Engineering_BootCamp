# Installation Guide

## Using the `.deb` Package (Recommended)

1. **Locate the `.deb` package**
   It should be in your project directory, named `book-scraper-api_1.0-1_all.deb`.

2. **Install using `dpkg` or `apt`**
   ```bash
   sudo apt install ./book-scraper-api_1.0-1_all.deb
   ```
   *Note: Using `apt install` will automatically resolve and install system dependencies like `python3`, `python3-venv`, and `ufw`.*

3. **What happens during installation?**
   - The files will be copied to `/opt/book-scraper-api/`.
   - A virtual environment will be created automatically in `/opt/book-scraper-api/venv`.
   - Python dependencies (`fastapi`, `uvicorn`, `requests`, `beautifulsoup4`) will be installed internally.
   - The systemd unit file is placed in `/lib/systemd/system/`.
   - Firewall port `8888` is automatically opened using `ufw`.
   - The service is enabled and started automatically.

## Verifying the Installation

You can check if the service is running correctly:
```bash
sudo systemctl status book-scraper-api.service
```

## Manual Setup (Development without `.deb`)

1. **Install python tools**:
   ```bash
   sudo apt update
   sudo apt install python3 python3-venv
   ```

2. **Clone/Copy the project**:
   Copy the `src` directory to your location.

3. **Virtual Environment**:
   ```bash
   cd src
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

4. **Run Application**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8888
   ```
