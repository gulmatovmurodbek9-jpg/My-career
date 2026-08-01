require('dotenv').config();
const { Client } = require('pg');
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callAI(prompt) {
    let retries = 3;
    while (retries > 0) {
        try {
            const result = await groq.chat.completions.create({
                messages: [
                    { role: 'system', content: "You are a professional Tajik educational consultant. Return valid JSON only." },
                    { role: 'user', content: prompt }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.1,
                max_tokens: 4096
            });
            const text = result.choices[0].message.content;
            const match = text.match(/\{[\s\S]*\}/);
            const jsonStr = match ? match[0] : text;
            return JSON.parse(jsonStr);
        } catch (e) {
            retries--;
            if (retries === 0) return null;
            await new Promise(r => setTimeout(r, 4000));
        }
    }
}

async function main() {
    const client = new Client({
        host: 'localhost', port: 5432,
        user: 'postgres', password: 'murodbek65',
        database: 'career_db'
    });
    
    try {
        await client.connect();
        console.log("🚀 Starting HIGH-QUALITY Enrichment...");

        // 1. Clear out bad data from previous attempts
        await client.query("UPDATE career SET description = NULL WHERE description LIKE 'Таджик 40%' OR description LIKE 'Tajik 40%'");

        const clusterSpecs = await client.query('SELECT id, "clusterId" FROM cluster');
        const clusterMap = {};
        clusterSpecs.rows.forEach(c => { clusterMap[c.clusterId] = c.id; });

        const unenriched = (await client.query(`
            SELECT id, name FROM career 
            WHERE description IS NULL OR description LIKE 'Ихтисоси амалӣ ва ояндадор%'
            ORDER BY id
        `)).rows;
        
        console.log(`Careers to enrich: ${unenriched.length}\n`);

        for (let i = 0; i < unenriched.length; i++) {
            const c = unenriched[i];
            process.stdout.write(`[${i+1}/${unenriched.length}] ${c.name}... `);

            const prompt = `Generate PROFESSIONAL educational info in Tajik (Cyrillic) for career: "${c.name}".
            JSON Format:
            {
              "mmtCluster": 1-5,
              "description": "80-100 words detailed Tajik description about what this career is and why it matters.",
              "purpose": "What is the main goal of this specialty? (1 sent Tajik)",
              "skills": {"technical": ["5 specific tech/professional skills in Tajik"], "soft": ["5 soft skills in Tajik"]},
              "roadmap": [{"step": 1, "title": "Foundation", "description": "Tj"}, {"step": 2, "title": "Spec", "description": "Tj"}, {"step": 3, "title": "Exp", "description": "Tj"}, {"step": 4, "title": "Master", "description": "Tj"}],
              "salary": {"avg": "Approx range in TJS", "demand": "High/Med/Low in Tajik"},
              "opportunities": ["3 job roles in Tajik"],
              "advice": "Professional advice for students (2 sent Tajik)"
            }`;

            const res = await callAI(prompt);
            
            if (res && res.mmtCluster && clusterMap[res.mmtCluster]) {
                const uuid = clusterMap[res.mmtCluster];
                await client.query(
                    `UPDATE career SET "mmtCluster"=$1,"clusterId"=$2,description=$3,purpose=$4,skills=$5,roadmap=$6,"careerOpportunities"=$7,advice=$8,"salaryAndMarket"=$9 WHERE id=$10`,
                    [res.mmtCluster, uuid, res.description || '', res.purpose || '',
                     JSON.stringify(res.skills || {}), JSON.stringify(res.roadmap||[]),
                     JSON.stringify(res.opportunities||[]), res.advice || '',
                     JSON.stringify({averageSalary:res.salary?.avg||'',demand:res.salary?.demand||'',growth:''}),
                     c.id]
                );
                console.log(`✅`);
            } else {
                console.log(`❌ Skipped`);
            }
            
            await new Promise(r => setTimeout(r, 3000));
        }
        
    } catch (e) {
        console.error("Fatal:", e);
    } finally {
        await client.end();
    }
}

main().catch(console.error);
