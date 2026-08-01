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
        
        console.log("Updating database schema manually...");
        await client.query('ALTER TABLE cluster ADD COLUMN IF NOT EXISTS "clusterId" integer;');
        await client.query('ALTER TABLE cluster ADD COLUMN IF NOT EXISTS "purpose" text;');
        await client.query('ALTER TABLE career ADD COLUMN IF NOT EXISTS "mmtCluster" integer;');
        await client.query('ALTER TABLE career ADD COLUMN IF NOT EXISTS "likesCount" integer DEFAULT 0;');
        await client.query('ALTER TABLE career ADD COLUMN IF NOT EXISTS "tuitionFee" integer;');

        console.log("Truncating existing tables...");
        await client.query('TRUNCATE TABLE career CASCADE');
        await client.query('TRUNCATE TABLE cluster CASCADE');
        await client.query('TRUNCATE TABLE universities CASCADE');
        
        console.log("Inserting MMT Clusters...");
        const clusters = [
            { clusterId: 1, name: 'Табиӣ ва техникӣ', icon: 'Cpu', desc: 'Самти табиӣ ва техникӣ барои онҳое, ки ба муҳандисӣ, математика ва технология таваҷҷӯҳ доранд.', purpose: 'Омодасозии муҳандисону технологҳои пешсаф.' },
            { clusterId: 2, name: 'Иқтисод ва география', icon: 'LineChart', desc: 'Иқтисодиёт ва география барои онҳое, ки ба тиҷорат, молия ва муносибатҳои байналмилалӣ шавқ доранд.', purpose: 'Тарбияи иқтисодшиносон ва соҳибкорони муваффақ.' },
            { clusterId: 3, name: 'Филология ва санъат', icon: 'Palette', desc: 'Самти филология ва санъат барои эҷодкорон, рассомон, нависандагон ва забоншиносон.', purpose: 'Ҳифзу рушди фарҳанг, забон ва ҳунари миллӣ.' },
            { clusterId: 4, name: 'Ҷомеашиносӣ ва ҳуқуқ', icon: 'Scale', desc: 'Ҷомеашиносӣ ва ҳуқуқ барои онҳое, ки мехоҳанд қонунро ҳифз кунанд ва дар рушди ҷомеа саҳм гузоранд.', purpose: 'Таъмини адолат ва ҳуқуқи шаҳрвандон дар ҷомеа.' },
            { clusterId: 5, name: 'Тиб ва биология (Варзиш)', icon: 'Stethoscope', desc: 'Самти тиб ва варзиш барои табибони оянда ва онҳое, ки саломатиро қадр мекунанд.', purpose: 'Таъмини сатҳи баланди тандурустӣ ва тибби муосир.' }
        ];

        let clusterUuids = {};

        for (const cl of clusters) {
            const res = await client.query(
                `INSERT INTO cluster ("clusterName", "clusterIcon", description, "purpose", "clusterId") VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [cl.name, cl.icon, cl.desc, cl.purpose, cl.clusterId]
            );
            clusterUuids[cl.clusterId] = res.rows[0].id;
        }

        console.log("Reading ntc_careers.json...");
        const careersRaw = fs.readFileSync('ntc_careers.json', 'utf8');
        const specs = JSON.parse(careersRaw);

        console.log("Extracting and inserting unique universities...");
        const uniMap = new Map();
        for (const spec of specs) {
            if (spec.universities) {
                for (const uni of spec.universities) {
                    if (uni.name && !uniMap.has(uni.name.trim())) {
                        uniMap.set(uni.name.trim(), uni.city || '');
                    }
                }
            }
        }

        const uniIds = {};
        for (const [uniName, city] of uniMap.entries()) {
            const description = `Муассисаи олии таълимии касбӣ дар шаҳри ${city || 'Тоҷикистон'}. Яке аз донишгоҳҳои пешқадам.`;
            const result = await client.query(
                `INSERT INTO universities (name, city, description) VALUES ($1, $2, $3) RETURNING id`,
                [uniName, city, description]
            );
            uniIds[uniName] = result.rows[0].id;
        }

        console.log(`Inserting ${specs.length} careers...`);
        for (const spec of specs) {
            let mmtCluster = spec.cluster;
            let uuid = clusterUuids[mmtCluster];

            const description = `Ихтисоси амалӣ ва ояндадор дар кластери ${mmtCluster}-и ММТ. Ин самт мутахассисонро барои бозори меҳнат тайёр мекунад.`;
            const purpose = `Таъмини ҷомеа бо кадрҳои баландихтисос дар самти ${spec.name}.`;
            const skills = {
                technical: ['Таҳлил', 'Истифодаи технологияҳо', 'Ҳисобкунии дақиқ'],
                soft: ['Муошират', 'Кори дастаҷамъона', 'Ҳалли мушкилот']
            };
            const roadmap = [
                { step: 1, title: 'Асосҳо', tasks: ['Омӯзиши фанҳои умумӣ ва назариявӣ'] },
                { step: 2, title: 'Тахассус', tasks: ['Оғози фанҳои тахассусӣ ва касбӣ'] },
                { step: 3, title: 'Таҷрибаомӯзӣ', tasks: ['Корҳои амалӣ ва таҷрибаомӯзӣ дар истеҳсолот'] },
                { step: 4, title: 'Диплом', tasks: ['Муҳофизати кори дипломии ниҳоӣ'] }
            ];
            const tuitionFee = Math.floor(Math.random() * 15) * 1000 + 3000; // random fee between 3000 and 17000
            const salaryAndMarket = { junior: '1500 - 2500 TJS', mid: '3000 - 5000 TJS', senior: '6000+ TJS' };
            const careerOpportunities = ['Мутахассис', 'Роҳбари шӯъба', 'Коршиноси байналмилалӣ'];

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
                    "tuitionFee"
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 0, $10) RETURNING id`,
                [
                    spec.name,
                    description,
                    purpose,
                    JSON.stringify(skills),
                    JSON.stringify(roadmap),
                    JSON.stringify(salaryAndMarket),
                    JSON.stringify(careerOpportunities),
                    mmtCluster,
                    uuid,
                    tuitionFee
                ]
            );

            const careerId = resCareer.rows[0].id;

            // Insert ManyToMany relations
            if (spec.universities) {
                for (const uni of spec.universities) {
                    if (uni.name && uniIds[uni.name.trim()]) {
                        await client.query(
                            `INSERT INTO career_universities ("careerId", "universitiesId") VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                            [careerId, uniIds[uni.name.trim()]]
                        );
                    }
                }
            }
        }

        console.log("Database seeded successfully with MMT data!");
    } catch (e) {
        console.error("Error seeding:", e);
    } finally {
        await client.end();
    }
}

seed();
