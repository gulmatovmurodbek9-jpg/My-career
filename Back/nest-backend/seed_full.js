const { Client } = require('pg');
const fs = require('fs');

async function seed() {
    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'murodbek65',
        database: 'career_db'
    });

    try {
        await client.connect();
        console.log("Connected to database for FULL REBUILD...");

        // Load data
        console.log("Loading files...");
        const rawData = JSON.parse(fs.readFileSync('ntc_raw_data.json', 'utf8'));
        const backupData = fs.existsSync('ai_backup.json') ? JSON.parse(fs.readFileSync('ai_backup.json', 'utf8')) : {};
        console.log(`Loaded ${rawData.length} raw rows and ${Object.keys(backupData).length} backup careers.`);

        // Schema updates
        console.log("Ensuring schema...");
        await client.query('ALTER TABLE cluster ADD COLUMN IF NOT EXISTS "clusterId" integer;');
        await client.query('ALTER TABLE cluster ADD COLUMN IF NOT EXISTS "purpose" text;');
        await client.query('ALTER TABLE career ADD COLUMN IF NOT EXISTS "mmtCluster" integer;');
        await client.query('ALTER TABLE career ADD COLUMN IF NOT EXISTS "likesCount" integer DEFAULT 0;');
        await client.query('ALTER TABLE career ADD COLUMN IF NOT EXISTS "tuitionFee" integer;');

        // Truncate
        console.log("Truncating tables...");
        await client.query('TRUNCATE TABLE career_universities CASCADE');
        await client.query('TRUNCATE TABLE career CASCADE');
        await client.query('TRUNCATE TABLE universities CASCADE');
        await client.query('TRUNCATE TABLE cluster CASCADE');

        // Insert Clusters
        console.log("Inserting Clusters...");
        const clusters = [
            { clusterId: 1, name: 'Табиӣ ва техникӣ', icon: 'Cpu', desc: 'Самти табиӣ ва техникӣ барои онҳое, ки ба муҳандисӣ, математика ва технология таваҷҷӯҳ доранд.', purpose: 'Омодасозии муҳандисону технологҳои пешсаф.' },
            { clusterId: 2, name: 'Иқтисод ва география', icon: 'LineChart', desc: 'Иқтисодиёт ва география барои онҳое, ки ба тиҷорат, молия ва муносибатҳои байналмилалӣ шавқ доранд.', purpose: 'Тарбияи иқтисодшиносон ва соҳибкорони муваффақ.' },
            { clusterId: 3, name: 'Филология ва санъат', icon: 'Palette', desc: 'Самти филология ва санъат барои эҷодкорон, рассомон, нависандагон ва забоншиносон.', purpose: 'Ҳифзу рушди фарҳанг, забон ва ҳунари миллӣ.' },
            { clusterId: 4, name: 'Ҷомеашиносӣ ва ҳуқуқ', icon: 'Scale', desc: 'Ҷомеашиносӣ ва ҳуқуқ барои онҳое, ки мехоҳанд қонунро ҳифз кунанд ва дар рушди ҷомеа саҳм гузоранд.', purpose: 'Таъмини адолат ва ҳуқуқи шаҳрвандон дар ҷомеа.' },
            { clusterId: 5, name: 'Тиб ва биология (Варзиш)', icon: 'Stethoscope', desc: 'Самти тиб ва варзиш барои табибони оянда ва онҳое, ки саломатиро қадр мекунанд.', purpose: 'Таъмини сатҳи баланди тандурустӣ ва тибби муосир.' }
        ];

        const clusterUuids = {};
        for (const cl of clusters) {
            const res = await client.query(
                `INSERT INTO cluster ("clusterName", "clusterIcon", description, "purpose", "clusterId") VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [cl.name, cl.icon, cl.desc, cl.purpose, cl.clusterId]
            );
            clusterUuids[cl.clusterId] = res.rows[0].id;
        }

        // Process Raw Data
        console.log("Processing raw data for unique entities...");
        const uniSet = new Set();
        const specialtyMap = new Map(); // name -> {cluster, code, fee, unis: Set}

        for (const row of rawData) {
            if (row.length < 5) continue;
            
            const clusterStr = row[1];
            const uniName = row[2].trim().replace(/&quot;/g, '"');
            const code = row[3];
            const name = row[4].trim();
            const fee = parseInt(row[7]) || 0;

            const clusterMatch = clusterStr.match(/^(\d)/);
            const clusterId = clusterMatch ? parseInt(clusterMatch[1]) : null;

            if (!clusterId || !name) continue;

            uniSet.add(uniName);

            if (!specialtyMap.has(name)) {
                specialtyMap.set(name, {
                    cluster: clusterId,
                    code: code,
                    fee: fee,
                    unis: new Set()
                });
            }
            
            const spec = specialtyMap.get(name);
            spec.unis.add(uniName);
            if (fee > 0 && (spec.fee === 0 || fee < spec.fee)) {
                spec.fee = fee; // Keep the minimum fee
            }
        }

        // Insert Universities
        console.log(`Inserting ${uniSet.size} universities...`);
        const uniNameToId = {};
        for (const uniName of uniSet) {
            const res = await client.query(
                'INSERT INTO universities (name, description) VALUES ($1, $2) RETURNING id',
                [uniName, `Муассисаи олии таълимии касбӣ дар Тоҷикистон. САМТИ ММТ.`]
            );
            uniNameToId[uniName] = res.rows[0].id;
        }

        // Insert Careers
        console.log(`Inserting ${specialtyMap.size} careers...`);
        let careersInserted = 0;
        for (const [name, data] of specialtyMap.entries()) {
            const backup = backupData[name] || {};
            
            const description = backup.description || `Ихтисоси амалӣ ва ояндадор дар кластери ${data.cluster}-и ММТ. Ин самт мутахассисонро барои бозори меҳнат тайёр мекунад.`;
            const purpose = backup.purpose || `Таъмини ҷомеа бо кадрҳои баландихтисос дар самти ${name}.`;
            const skills = backup.skills || {
                technical: ['Таҳлил', 'Истифодаи технологияҳо', 'Ҳисобкунии дақиқ'],
                soft: ['Муошират', 'Кори дастаҷамъона', 'Ҳалли мушкилот']
            };
            const roadmap = backup.roadmap || [
                { step: 1, title: 'Асосҳо', tasks: ['Омӯзиши фанҳои умумӣ ва назариявӣ'] },
                { step: 2, title: 'Тахассус', tasks: ['Оғози фанҳои тахассусӣ ва касбӣ'] },
                { step: 3, title: 'Таҷрибаомӯзӣ', tasks: ['Корҳои амалӣ ва таҷрибаомӯзӣ дар истеҳсолот'] },
                { step: 4, title: 'Диплом', tasks: ['Муҳофизати кори дипломии ниҳоӣ'] }
            ];
            const salaryAndMarket = backup.salaryAndMarket || { junior: '1500 - 2500 TJS', mid: '3000 - 5000 TJS', senior: '6000+ TJS' };
            const careerOpportunities = backup.careerOpportunities || ['Мутахассис', 'Роҳбари шӯъба', 'Коршиноси байналмилалӣ'];

            // Robust backup data restoration
            function getBackupArray(val) {
                if (!val) return null;
                if (Array.isArray(val)) return val;
                try {
                    const parsed = JSON.parse(val);
                    return Array.isArray(parsed) ? parsed : null;
                } catch(e) { return null; }
            }

            const certs = getBackupArray(backup.certification);
            const projects = getBackupArray(backup.projectsExamples);
            let resources = backup.learningResources;
            if (resources && typeof resources === 'string') {
                try { resources = JSON.parse(resources); } catch(e) {}
            }

            const resCareer = await client.query(
                `INSERT INTO career (
                    name, 
                    description, 
                    purpose, 
                    skills, 
                    roadmap, 
                    "salaryAndMarket", 
                    "careerOpportunities", 
                    "mmtCluster", 
                    "clusterId", 
                    "likesCount",
                    "tuitionFee",
                    advice,
                    certification,
                    "projectsExamples",
                    "learningResources"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10, $11, $12, $13, $14) RETURNING id`,
                [
                    name,
                    description,
                    purpose,
                    typeof skills === 'string' ? skills : JSON.stringify(skills),
                    typeof roadmap === 'string' ? roadmap : JSON.stringify(roadmap),
                    typeof salaryAndMarket === 'string' ? salaryAndMarket : JSON.stringify(salaryAndMarket),
                    typeof careerOpportunities === 'string' ? careerOpportunities : JSON.stringify(careerOpportunities),
                    data.cluster,
                    clusterUuids[data.cluster],
                    data.fee,
                    backup.advice || null,
                    certs ? certs.join(',') : null,
                    projects ? projects.join(',') : null,
                    resources ? JSON.stringify(resources) : null
                ]
            );

            const careerId = resCareer.rows[0].id;

            // Link Unis
            for (const uniName of data.unis) {
                const uniId = uniNameToId[uniName];
                if (uniId) {
                    await client.query(
                        'INSERT INTO career_universities ("careerId", "universitiesId") VALUES ($1, $2) ON CONFLICT DO NOTHING',
                        [careerId, uniId]
                    );
                }
            }
            careersInserted++;
            if (careersInserted % 100 === 0) console.log(`Inserted ${careersInserted} careers...`);
        }

        console.log(`✅ SUCCESS! Inserted ${uniSet.size} universities and ${specialtyMap.size} careers.`);
        console.log(`${Object.keys(backupData).length} careers were restored from backup.`);

    } catch (e) {
        console.error("❌ SEED FAILED:", e);
    } finally {
        await client.end();
    }
}

seed();
