const https = require('https');
const fs = require('fs');

const BASE_URL = 'https://stat.ntc.tj/Y26/RPlan?page=';

async function fetchPage(page, retries = 3) {
    for (let i = 0; i <= retries; i++) {
        try {
            return await new Promise((resolve, reject) => {
                const req = https.get(BASE_URL + page, { rejectUnauthorized: false, timeout: 30000 }, (res) => {
                    let data = '';
                    res.on('data', chunk => data += chunk);
                    res.on('end', () => resolve(data));
                });
                req.on('error', err => reject(err));
                req.on('timeout', () => {
                    req.destroy();
                    reject(new Error('Timeout'));
                });
            });
        } catch (err) {
            if (i === retries) throw err;
            console.log(`⚠️ Retrying page ${page} (${i + 1}/${retries})...`);
            await new Promise(r => setTimeout(r, 2000 * (i + 1))); // Exponential backoff
        }
    }
}

function parseHtml(pageHtml) {
    let rowsFound = 0;
    let pageData = [];
    let rows = pageHtml.split('<tr>');
    for (let i = 1; i < rows.length; i++) {
        let rowHtml = rows[i].split('</tr>')[0];
        let tds = rowHtml.split(/<td[^>]*>/);
        if (tds.length < 3) continue;
        
        let rowData = [];
        for (let j = 1; j < tds.length; j++) {
            let cellData = tds[j].split('</td>')[0].replace(/<[^>]+>/g, '').trim();
            rowData.push(cellData);
        }
        if (rowData.length > 0) {
            pageData.push(rowData);
            rowsFound++;
        }
    }
    return pageData;
}

async function scrape() {
    console.log('🚀 Starting Fast Batched Scraper...');
    let allData = [];
    const BATCH_SIZE = 5;
    const MAX_PAGES = 350;

    for (let p = 1; p <= MAX_PAGES; p += BATCH_SIZE) {
        let batchPromises = [];
        let end = Math.min(p + BATCH_SIZE - 1, MAX_PAGES);
        console.log(`📡 Fetching batch: pages ${p} to ${end}...`);

        for (let i = p; i <= end; i++) {
            batchPromises.push(fetchPage(i).catch(err => {
                console.error(`❌ Page ${i} failed:`, err.message);
                return null;
            }));
        }

        const results = await Promise.all(batchPromises);
        let batchRows = 0;
        
        for (let resHtml of results) {
            if (resHtml) {
                const parsed = parseHtml(resHtml);
                allData.push(...parsed);
                batchRows += parsed.length;
            }
        }

        console.log(`✅ Batch complete. Found ${batchRows} rows. Total so far: ${allData.length}`);
        
        if (batchRows === 0 && p > 100) {
            console.log("🛑 No rows found in this batch. Ending scrape early.");
            break;
        }
    }

    fs.writeFileSync('ntc_raw_data.json', JSON.stringify(allData, null, 2));
    console.log(`🏁 FINISHED! Scraped ${allData.length} records. Saved to ntc_raw_data.json`);
}

scrape();
