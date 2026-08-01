const { Client } = require('pg');

const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'murodbek65',
    database: 'career_db',
});

async function clearCareers() {
    await client.connect();
    console.log('Connected to DB');

    try {
        // First remove junction tables (liked/saved relations)
        await client.query(`DELETE FROM career_liked_by_users_user`);
        await client.query(`DELETE FROM career_saved_by_users_user`);
        console.log('Cleared user-career relations');

        // Now delete all careers
        const result = await client.query(`DELETE FROM career`);
        console.log(`Deleted ${result.rowCount} careers`);

    } catch (err) {
        console.error('Error:', err.message);
        // Try alternative table names if above fail
        try {
            await client.query(`DELETE FROM "career_liked_by_users_user" CASCADE`);
        } catch (_) { }
        try {
            await client.query(`DELETE FROM "career_saved_by_users_user" CASCADE`);
        } catch (_) { }
        try {
            const r = await client.query(`TRUNCATE TABLE career CASCADE`);
            console.log('Truncated career table with CASCADE');
        } catch (e2) {
            console.error('TRUNCATE also failed:', e2.message);
        }
    }

    await client.end();
    console.log('Done!');
}

clearCareers();
