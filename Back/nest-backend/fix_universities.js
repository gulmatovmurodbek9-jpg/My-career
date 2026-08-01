const { Client } = require('pg');
const fs = require('fs');

async function fixUniversities() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'murodbek65',
        database: 'career_db'
    });

    try {
        await client.connect();
        console.log("✅ DB Connected");

        // Load raw data
        const rawData = JSON.parse(fs.readFileSync('ntc_raw_data.json', 'utf8'));
        console.log(`Loaded ${rawData.length} rows from raw data.`);

        // Step 1: Extract unique universities and insert them
        const uniqueUnis = new Set();
        for (const row of rawData) {
            if (row.length < 5) continue;
            const uniName = row[2];
            if (uniName && uniName.trim()) {
                uniqueUnis.add(uniName.trim().replace(/&quot;/g, '"'));
            }
        }

        console.log(`Found ${uniqueUnis.size} unique universities. Inserting...`);
        const uniNameToId = {};

        for (const uniName of uniqueUnis) {
            // Check if exists
            let res = await client.query('SELECT id FROM universities WHERE name = $1', [uniName]);
            if (res.rows.length === 0) {
                const description = `Муассисаи олии таълимии касбии Тоҷикистон.`;
                res = await client.query(
                    'INSERT INTO universities (name, description) VALUES ($1, $2) RETURNING id',
                    [uniName, description]
                );
            }
            uniNameToId[uniName] = res.rows[0].id;
        }

        // Step 2: Link Universities with Careers
        const careersRes = await client.query("SELECT id, name FROM career");
        const careerNameToId = {};
        for (const row of careersRes.rows) {
            careerNameToId[row.name.trim()] = row.id;
        }

        let linksAdded = 0;
        console.log("Linking careers with universities...");

        for (const row of rawData) {
            if (row.length < 5) continue;
            
            const uniNameRaw = row[2];
            const careerNameRaw = row[4];

            if (!uniNameRaw || !careerNameRaw) continue;

            const uniName = uniNameRaw.trim().replace(/&quot;/g, '"');
            const careerName = careerNameRaw.trim();

            const uniId = uniNameToId[uniName];
            const careerId = careerNameToId[careerName];

            // Some specialty names might differ slightly, but we only have what we have
            if (uniId && careerId) {
                // Ensure the relation exists in career_universities
                const checkRes = await client.query(
                    'SELECT 1 FROM career_universities WHERE "careerId" = $1 AND "universitiesId" = $2',
                    [careerId, uniId]
                );
                
                if (checkRes.rows.length === 0) {
                    await client.query(
                        'INSERT INTO career_universities ("careerId", "universitiesId") VALUES ($1, $2)',
                        [careerId, uniId]
                    );
                    linksAdded++;
                }
            }
        }

        console.log(`✅ Successfully added ${linksAdded} links between careers and universities!`);

    } catch (e) {
        console.error("Error fixing universities:", e);
    } finally {
        await client.end();
    }
}

fixUniversities();
