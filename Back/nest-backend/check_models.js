require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

async function check() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("Error: GEMINI_API_KEY is not set in .env");
        return;
    }

    // Try to list models via a direct fetch since the SDK might hide details
    const https = require('https');
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    https.get(url, (res) => {
        let data = '';
        res.on('data', d => data += d);
        res.on('end', () => {
            try {
                const json = JSON.parse(data);
                if (json.models) {
                    console.log("Available Models:");
                    console.log(json.models.map(m => m.name));
                } else {
                    console.log("Response:", json);
                }
            } catch (e) {
                console.log("Raw Response:", data);
            }
        });
    });
}

check();
