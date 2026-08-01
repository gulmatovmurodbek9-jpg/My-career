const { Client } = require('pg');
const fs = require('fs');

async function backupAI() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'murodbek65',
        database: 'career_db'
    });

    try {
        await client.connect();
        console.log("Connected to database for AI Backup...");

        const result = await client.query(`
            SELECT 
                name, 
                description, 
                purpose, 
                skills, 
                roadmap, 
                "careerOpportunities", 
                "salaryAndMarket", 
                "projectsExamples", 
                certification, 
                advice, 
                "learningResources"
            FROM career 
            WHERE description IS NOT NULL
        `);

        if (result.rows.length === 0) {
            console.log("No AI data found! Skipping backup.");
            return;
        }

        const backupMap = {};
        for (const row of result.rows) {
            backupMap[row.name.trim()] = row; // Map by exact career name
        }

        fs.writeFileSync('ai_backup.json', JSON.stringify(backupMap, null, 2));
        console.log(`✅ Successfully backed up ${result.rows.length} AI enriched careers to ai_backup.json`);

    } catch(e) {
        console.error("Backup failed:", e);
    } finally {
        await client.end();
    }
}

backupAI();
