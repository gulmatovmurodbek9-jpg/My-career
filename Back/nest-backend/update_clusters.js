const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'murodbek65',
    database: 'career_db',
});

const updates = [
    { name: 'Табиӣ ва техникӣ', riasec: 'Realistic, Investigative' },
    { name: 'Иқтисод ва география', riasec: 'Enterprising, Conventional' },
    { name: 'Филология ва санъат', riasec: 'Artistic, Social' },
    { name: 'Ҷомеашиносӣ ва ҳуқуқ', riasec: 'Social, Enterprising' },
    { name: 'Тиб ва варзиш', riasec: 'Investigative, Social' },
];

async function main() {
    try {
        await client.connect();
        console.log('Connected to DB');

        for (const item of updates) {
            const query = 'UPDATE cluster SET "riasecPrimary" = $1 WHERE "clusterName" LIKE $2';
            const res = await client.query(query, [item.riasec, `%${item.name}%`]);
            console.log(`Updated ${item.name}: ${res.rowCount} rows`);
        }

        await client.end();
        console.log('Update complete');
    } catch (err) {
        console.error('Error updating DB:', err);
        process.exit(1);
    }
}

main();
