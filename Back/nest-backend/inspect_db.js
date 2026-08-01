const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'murodbek65',
    database: 'career_db',
});

async function main() {
    try {
        await client.connect();
        console.log('Connected to DB');

        const res = await client.query('SELECT id, "clusterName", "riasecPrimary" FROM cluster');
        console.log('Clusters in DB:');
        res.rows.forEach(r => console.log(`${r.id}: ${r.clusterName} (${r.riasecPrimary})`));

        await client.end();
    } catch (err) {
        console.error('Error connecting to DB:', err);
        process.exit(1);
    }
}

main();
