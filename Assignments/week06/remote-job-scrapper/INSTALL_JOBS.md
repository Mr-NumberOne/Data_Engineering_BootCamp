# Remote Job Scraper API - Installation Guide

## Using the `.deb` Package (Recommended)

1. **Locate the `.deb` package**
   It should be in your project directory, named `remote-job-scraper-api_1.0-1_all.deb`.

2. **Install using `dpkg` or `apt`**
   ```bash
   sudo apt install ./remote-job-scraper-api_1.0-1_all.deb
   ```

3. **What happens during installation?**
   - The files will be copied to `/opt/remote-job-scraper-api/`.
   - A virtual environment will be created automatically in `/opt/remote-job-scraper-api/venv`.
   - Python dependencies (`fastapi`, `uvicorn`, `requests`, `beautifulsoup4`) will be installed internally.
   - The systemd unit file is placed in `/lib/systemd/system/`.
   - Firewall port `8889` is automatically opened using `ufw`.
   - The service is enabled and started automatically.

## Verifying the Installation

You can check if the service is running correctly:
```bash
sudo systemctl status remote-job-scraper-api.service
```
