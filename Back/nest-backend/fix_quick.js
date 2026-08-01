require('dotenv').config();
const { Client } = require('pg');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAI(prompt) {
    try {
        const result = await groq.chat.completions.create({
            messages: [
                { role: 'system', content: "Return VALID JSON OBJECT. Concise Tajik (Cyrillic)." },
                { role: 'user', content: prompt }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.1,
            max_tokens: 1000
        });
        const text = result.choices[0].message.content;
        const match = text.match(/\{[\s\S]*\}/);
        return JSON.parse(match ? match[0] : text);
    } catch (e) {
        console.log(`  ⚠ AI Error: ${e.message.substring(0, 50)}`);
        return null;
    }
}

async function fixSpecific() {
    const client = new Client({
        host: 'localhost', port: 5432,
        user: 'postgres', password: 'murodbek65',
        database: 'career_db'
    });
    
    try {
        await client.connect();
        console.log("🚀 Fixing first 10 unenriched careers...");

        const clusterSpecs = await client.query('SELECT id, "clusterId" FROM cluster');
        const clusterMap = {};
        clusterSpecs.rows.forEach(c => { clusterMap[c.clusterId] = c.id; });

        // Get 10 placeholders
        const target = (await client.query(`
            SELECT id, name FROM career 
            WHERE description LIKE 'Ихтисоси амалӣ ва ояндадор%'
            ORDER BY id LIMIT 10
        `)).rows;

        for (const c of target) {
            console.log(`Enriching: ${c.name}`);
            const prompt = `Name: "${c.name}". Return JSON: {"cluster":1-5,"desc":"Tajik 40 words","purpose":"1 Tajik sent","skills":{"tech":["3"],"soft":["3"]},"salary":"Range TJS","demand":"High/Med"}`;
            const res = await callAI(prompt);
            
            if (res) {
                const uuid = clusterMap[res.cluster || 1];
                await client.query(
                    `UPDATE career SET "mmtCluster"=$1,"clusterId"=$2,description=$3,purpose=$4,skills=$5,"salaryAndMarket"=$6 WHERE id=$7`,
                    [res.cluster||1, uuid, res.desc || '', res.purpose || '', JSON.stringify({technical:res.skills?.tech||[],soft:res.skills?.soft||[]}), JSON.stringify({averageSalary:res.salary||'',demand:res.demand||'',growth:''}), c.id]
                );
                console.log(`  ✅ Done.`);
            }
            await new Promise(r => setTimeout(r, 3000));
        }
        console.log("🎉 10 careers fixed. Check the site now!");
    } finally {
        await client.end();
    }
}
fixSpecific();
