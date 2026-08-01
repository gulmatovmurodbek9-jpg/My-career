const fs = require('fs');

const data = JSON.parse(fs.readFileSync('ntc_raw_data.json', 'utf8'));

const uniqueSpecialties = new Map();

for (const row of data) {
    if (row.length < 5) continue;
    
    let clusterStr = row[1];
    let code = row[3];
    let name = row[4];
    
    if (!name || name.trim() === '') continue;
    
    // Extract cluster number 1-5
    let clusterMatch = clusterStr.match(/^(\d)-/);
    let clusterId = clusterMatch ? parseInt(clusterMatch[1]) : null;
    
    if (clusterId && code) {
        if (!uniqueSpecialties.has(code)) {
            uniqueSpecialties.set(code, {
                code: code,
                name: name,
                cluster: clusterId
            });
        }
    }
}

const specsArray = Array.from(uniqueSpecialties.values());
console.log(`Found ${specsArray.length} unique specialties.`);

fs.writeFileSync('ntc_careers.json', JSON.stringify(specsArray, null, 2));
