import requests
from bs4 import BeautifulSoup
import json
import urllib3
import concurrent.futures
import time

urllib3.disable_warnings()

BASE_URL = "https://stat.ntc.tj/Y26/RPlan?page="
TOTAL_PAGES = 300

specialties = {}

def scrape_page(page):
    try:
        response = requests.get(BASE_URL + str(page), verify=False, timeout=10)
        soup = BeautifulSoup(response.text, 'html.parser')
        table = soup.find('table')
        if not table:
            return []
        
        rows = table.find_all('tr')
        page_specs = []
        for row in rows[1:]: # Skip header
            cols = row.find_all('td')
            if len(cols) >= 3:
                # Column 0: Code, Column 1: Specialty name (usually). We need to verify.
                # Actually, the structure might be: Муассиса, Кластер, Рамз, Ихтисос...
                # Let's extract text of all columns and find common patterns.
                row_data = [c.text.strip() for c in cols]
                page_specs.append(row_data)
        return page_specs
    except Exception as e:
        print(f"Error on page {page}: {e}")
        return []

print("Starting scraper...")
all_data = []

# Scrape first page to see the format before doing everything
test_data = scrape_page(1)
if test_data and len(test_data) > 0:
    print(f"Sample row length: {len(test_data[0])}")
    print(f"Sample row: {test_data[0]}")
    
    # Run concurrently for first 200 pages
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = {executor.submit(scrape_page, p): p for p in range(1, 201)}
        for future in concurrent.futures.as_completed(futures):
            p = futures[future]
            try:
                res = future.result()
                all_data.extend(res)
                if p % 20 == 0:
                    print(f"Processed 20 pages... Total rows so far: {len(all_data)}")
            except Exception as exc:
                print('%r generated an exception: %s' % (p, exc))

    # We need to map it carefully now.
    # NTC Data typically: [Code, Specialty, University, Language, Plan, ...]
    # Let's just save the raw data in JSON and analyze it.
    with open('ntc_raw_data.json', 'w', encoding='utf-8') as f:
        json.dump(all_data, f, ensure_ascii=False, indent=2)
    print(f"Done. Scraped {len(all_data)} rows.")
else:
    print("Could not parse table.")
