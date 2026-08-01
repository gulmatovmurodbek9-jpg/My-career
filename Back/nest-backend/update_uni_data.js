const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'murodbek65',
    database: 'career_db',
});

const updates = [
    { name: 'Донишгоҳи давлатии тиҷорати Тоҷикистон', lat: 38.5367, lng: 68.7508 },
    { name: 'Донишгоҳи давлатии Хуҷанд', lat: 40.2828, lng: 69.6222 },
    { name: 'Донишгоҳи миллии Тоҷикистон', lat: 38.5878, lng: 68.7733 },
    { name: 'Донишгоҳи техникии Тоҷикистон', lat: 38.5606, lng: 68.7511 },
    { name: 'Донишгоҳи славянии Русияву Тоҷикистон', lat: 38.5778, lng: 68.7950 },
    { name: 'Донишгоҳи давлатии Кӯлоб', lat: 37.9150, lng: 69.7820 },
    { name: 'Донишгоҳи давлатии Хоруғ', lat: 37.4917, lng: 71.5539 },
    { name: 'Донишгоҳи давлатии Бохтар', lat: 37.8444, lng: 68.8578 },
];

async function main() {
    try {
        await client.connect();
        console.log('Connected to DB');

        // Update coordinates
        for (const up of updates) {
            const query = `UPDATE universities SET latitude = $1, longitude = $2 WHERE name ILIKE $3`;
            const res = await client.query(query, [up.lat, up.lng, `%${up.name}%`]);
            console.log(`Updated ${up.name}: ${res.rowCount} rows`);
        }

        // Set remaining to a default in Dushanbe if null
        await client.query(`UPDATE universities SET latitude = 38.56, longitude = 68.78 WHERE latitude IS NULL`);

        // Set career default durations if null/default
        await client.query(`UPDATE career SET "durationYears" = 4 WHERE "durationYears" IS NULL OR "durationYears" = 0`);
        await client.query(`UPDATE career SET "degreeType" = 'Бакалавр' WHERE "degreeType" IS NULL`);

        console.log('Update complete!');
        await client.end();
    } catch (err) {
        console.error('Error during update:', err);
        process.exit(1);
    }
}

main();
