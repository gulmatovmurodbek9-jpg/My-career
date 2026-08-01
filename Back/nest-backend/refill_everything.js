require('dotenv').config();
const { Client } = require('pg');
const Groq = require('groq-sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;
const geminiModel = genAI ? genAI.getGenerativeModel({ model: 'gemini-2.0-flash' }) : null;
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:7b';
const AI_PROVIDER = (process.env.REFILL_PROVIDER || 'ollama').toLowerCase();
const LOCK_PATH = path.join(__dirname, '.refill_everything.lock');
const BATCH_SIZE = Number(process.env.REFILL_BATCH_SIZE || 10);
const BASE_DELAY_MS = Number(process.env.REFILL_DELAY_MS || 5000);
const MAX_RETRIES = Number(process.env.REFILL_MAX_RETRIES || 4);
const MIN_DESCRIPTION_LENGTH = Number(process.env.REFILL_MIN_DESCRIPTION_LENGTH || 120);
const MIN_PURPOSE_LENGTH = Number(process.env.REFILL_MIN_PURPOSE_LENGTH || 20);

function isProcessAlive(pid) {
    if (!pid || Number.isNaN(Number(pid))) return false;
    try {
        process.kill(Number(pid), 0);
        return true;
    } catch (_) {
        return false;
    }
}

function acquireLock() {
    if (fs.existsSync(LOCK_PATH)) {
        try {
            const raw = fs.readFileSync(LOCK_PATH, 'utf8');
            const current = JSON.parse(raw);
            if (isProcessAlive(current.pid)) {
                console.error(`\nAnother refill is already running (PID ${current.pid}, started ${current.startedAt}).`);
                console.error('Stop the previous process first, or wait until it finishes.\n');
                process.exit(1);
            }
        } catch (_) {
            // Ignore broken stale lock and replace it below.
        }

        try {
            fs.unlinkSync(LOCK_PATH);
        } catch (e) {
            console.error(`Could not clear stale lock file: ${e.message}`);
            process.exit(1);
        }
    }

    fs.writeFileSync(LOCK_PATH, JSON.stringify({
        pid: process.pid,
        startedAt: new Date().toISOString(),
    }, null, 2), { flag: 'wx' });
}

function releaseLock() {
    try {
        if (!fs.existsSync(LOCK_PATH)) return;
        const raw = fs.readFileSync(LOCK_PATH, 'utf8');
        const current = JSON.parse(raw);
        if (Number(current.pid) === process.pid) {
            fs.unlinkSync(LOCK_PATH);
        }
    } catch (_) {
        // Best-effort cleanup.
    }
}

['SIGINT', 'SIGTERM', 'exit'].forEach((eventName) => {
    process.on(eventName, () => {
        releaseLock();
        if (eventName !== 'exit') process.exit(0);
    });
});

function chunkArray(items, size) {
    const chunks = [];
    for (let i = 0; i < items.length; i += size) {
        chunks.push(items.slice(i, i + size));
    }
    return chunks;
}

function normalizeAIItem(item) {
    return {
        name: item?.name || '',
        description: item?.description || '',
        purpose: item?.purpose || '',
        skills: {
            tech: Array.isArray(item?.skills?.tech) ? item.skills.tech : [],
            soft: Array.isArray(item?.skills?.soft) ? item.skills.soft : [],
        },
        roadmap: Array.isArray(item?.roadmap) ? item.roadmap : [],
        salary: item?.salary || '',
        demand: item?.demand || '',
        opportunities: Array.isArray(item?.opportunities) ? item.opportunities : [],
        advice: item?.advice || '',
    };
}

function extractJsonPayload(text) {
    const raw = (text || '').trim();

    const arrayMatch = raw.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
        return JSON.parse(arrayMatch[0]);
    }

    const objectMatch = raw.match(/\{[\s\S]*\}/);
    if (objectMatch) {
        const parsed = JSON.parse(objectMatch[0]);
        if (Array.isArray(parsed)) return parsed;
        if (Array.isArray(parsed.items)) return parsed.items;
        if (Array.isArray(parsed.careers)) return parsed.careers;
        return parsed;
    }

    return JSON.parse(raw);
}

function isDailyTokenLimit(error) {
    const message = error?.message || String(error || '');
    return message.includes('tokens per day') || message.includes('TPD');
}

function isGeminiQuotaUnavailable(error) {
    const message = error?.message || String(error || '');
    return message.includes('limit: 0') || message.includes('Quota exceeded');
}

function extractRetryDelayMs(error, fallbackMs = 30000) {
    const message = error?.message || String(error || '');
    const minuteSecondMatch = message.match(/try again in (\d+)m([\d.]+)s/i);
    if (minuteSecondMatch) {
        const mins = Number(minuteSecondMatch[1] || 0);
        const secs = Number(minuteSecondMatch[2] || 0);
        return Math.ceil((mins * 60 + secs) * 1000);
    }

    const secondMatch = message.match(/retry in ([\d.]+)s/i);
    if (secondMatch) {
        return Math.ceil(Number(secondMatch[1]) * 1000);
    }

    return fallbackMs;
}

async function generateWithGroq(prompt) {
    const result = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.1-8b-instant',
        temperature: 0.1,
        max_tokens: 4000,
    });

    return result.choices[0].message.content || '';
}

async function generateWithGemini(prompt) {
    if (!geminiModel) {
        throw new Error('Gemini is not configured.');
    }

    const result = await geminiModel.generateContent(prompt);
    return result.response.text() || '';
}

async function generateWithOllama(prompt) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: OLLAMA_MODEL,
            prompt,
            stream: false,
            options: {
                temperature: 0.1,
            },
        }),
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama error ${response.status}: ${text}`);
    }

    const data = await response.json();
    return data.response || '';
}

async function callAIBatch(careers) {
    let retries = MAX_RETRIES;
    const names = careers.map((career, index) => `${index + 1}. ${career.name}`).join('\n');
    const prompt = `Generate professional Tajik info for these careers.

Rules:
- Return exactly ${careers.length} objects in the same order.
- Return ONLY valid JSON.
- Top-level JSON must be: { "items": [ ... ] }
- Each object must include: name, description, purpose, skills, roadmap, salary, demand.
- description: 50-80 Tajik words, specific to the career, not generic.
- purpose: 1 short Tajik sentence, specific to the career.
- skills.tech: exactly 5 Tajik items.
- skills.soft: exactly 5 Tajik items.
- roadmap: exactly 4 short Tajik steps.
- demand: one of High, Med, Low.
- No markdown, no explanations, JSON only.

Careers:
${names}

JSON format:
{
  "items": [
    {
      "name": "Career name exactly as given",
      "description": "Professional Tajik description",
      "purpose": "Main goal",
      "skills": { "tech": ["..."], "soft": ["..."] },
      "roadmap": ["Step 1", "Step 2", "Step 3", "Step 4"],
      "salary": "3000-5000 TJS",
      "demand": "High"
    }
  ]
}`;

    while (retries > 0) {
        try {
            let text;

            if (AI_PROVIDER === 'ollama') {
                text = await generateWithOllama(prompt);
            } else {
                try {
                    text = await generateWithGroq(prompt);
                } catch (groqError) {
                    if (isDailyTokenLimit(groqError)) {
                        const waitMs = extractRetryDelayMs(groqError, 12 * 60 * 1000);
                        console.log(`  [INFO] Groq daily limit reached. Waiting ${Math.ceil(waitMs / 1000)}s before retry...`);
                        await new Promise((resolve) => setTimeout(resolve, waitMs));
                        continue;
                    }

                    if (!geminiModel) {
                        throw groqError;
                    }

                    console.log('  [INFO] Groq unavailable. Falling back to Gemini for this batch...');

                    try {
                        text = await generateWithGemini(prompt);
                    } catch (geminiError) {
                        if (isGeminiQuotaUnavailable(geminiError)) {
                            throw new Error('Both AI providers are out of quota right now. Wait a bit and run the script again.');
                        }
                        throw geminiError;
                    }
                }
            }

            const parsed = extractJsonPayload(text);

            if (!Array.isArray(parsed) || parsed.length !== careers.length) {
                throw new Error(`Expected ${careers.length} items, got ${Array.isArray(parsed) ? parsed.length : 'non-array'}`);
            }

            return parsed.map(normalizeAIItem);
        } catch (e) {
            retries--;
            const waitTime = (MAX_RETRIES - retries + 1) * BASE_DELAY_MS;
            const batchTitle = careers[0]?.name || 'batch';

            if (retries <= 0) {
                console.log(`  [FAIL] Batch failed near "${batchTitle}": ${e.message}`);
                return null;
            }

            console.log(`  [WAIT] Batch retry near "${batchTitle}" in ${waitTime / 1000}s... (${retries} retries left)`);
            await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
    }

    return null;
}

async function main() {
    acquireLock();

    const client = new Client({
        host: 'localhost',
        port: 5432,
        user: 'postgres',
        password: 'murodbek65',
        database: 'career_db',
    });

    try {
        await client.connect();
        console.log(`DB Connected. Starting SMART REFILL via ${AI_PROVIDER.toUpperCase()} (${BATCH_SIZE} careers per batch, ${BASE_DELAY_MS / 1000}s delay)...`);

        const weakCareers = (await client.query(`
            SELECT id, name
            FROM career
            WHERE description IS NULL
               OR length(trim(coalesce(description, ''))) < $1
               OR purpose IS NULL
               OR length(trim(coalesce(purpose, ''))) < $2
            ORDER BY id
        `, [MIN_DESCRIPTION_LENGTH, MIN_PURPOSE_LENGTH])).rows;

        const batches = chunkArray(weakCareers, BATCH_SIZE);
        console.log(`Careers to improve: ${weakCareers.length}. Batches: ${batches.length}.`);

        let processed = 0;

        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const rangeStart = processed + 1;
            const rangeEnd = processed + batch.length;
            process.stdout.write(`[Batch ${i + 1}/${batches.length}] careers ${rangeStart}-${rangeEnd}... `);

            const results = await callAIBatch(batch);
            let successCount = 0;

            if (results) {
                for (let j = 0; j < batch.length; j++) {
                    const career = batch[j];
                    const res = results[j];

                    if (!res) {
                        continue;
                    }
                    const roadmapArr = Array.isArray(res.roadmap)
                        ? res.roadmap.map((step, idx) => ({ step: idx + 1, title: step, description: '' }))
                        : [];

                    await client.query(
                        `UPDATE career
                         SET description=$1,
                             purpose=$2,
                             skills=$3,
                             roadmap=$4,
                             "careerOpportunities"=$5,
                             advice=$6,
                             "salaryAndMarket"=$7
                         WHERE id=$8`,
                        [
                            res.description || '',
                            res.purpose || '',
                            JSON.stringify({ technical: res.skills?.tech || [], soft: res.skills?.soft || [] }),
                            JSON.stringify(roadmapArr),
                            JSON.stringify(res.opportunities || []),
                            res.advice || '',
                            JSON.stringify({ averageSalary: res.salary || '', demand: res.demand || '', growth: '' }),
                            career.id,
                        ],
                    );
                    successCount++;
                }
            }

            processed += batch.length;
            console.log(`OK ${successCount}/${batch.length} saved`);

            if (i < batches.length - 1) {
                await new Promise((resolve) => setTimeout(resolve, BASE_DELAY_MS));
            }
        }

        console.log('\nRefill finished.');
    } catch (e) {
        console.error('Fatal Error:', e);
    } finally {
        await client.end();
        releaseLock();
    }
}

main().catch(console.error);
