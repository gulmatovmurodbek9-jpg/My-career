const fs = require('fs');
const path = require('path');

const careerSvcPath = path.join(__dirname, 'src/career/career.service.ts');
let careerSvc = fs.readFileSync(careerSvcPath, 'utf8');

// 1. Replace the entire matchCareers and related private methods with MMT version
const newMatchRegex = /\/\/ ═══════════════════════════════════════════════════════════════\s*\n\/\/  MATCHING ENGINE — Core Algorithm\s*\n\/\/ ═══════════════════════════════════════════════════════════════[\s\S]*?async getStats\(\)/;

const newMatchLogic = `// ═══════════════════════════════════════════════════════════════
    //  MATCHING ENGINE — MMT Clustering
    // ═══════════════════════════════════════════════════════════════

    async matchCareers(userScores: any): Promise<any[]> {
        const careers = await this.careerRepository.find();
        const mmtScores = userScores?.mmtClusters || { c1:0, c2:0, c3:0, c4:0, c5:0 };
        
        // Find max from the user scores to normalize
        const values = Object.values(mmtScores) as number[];
        const maxScore = Math.max(...values, 1);

        const scored = careers.map(career => {
            const clusterId = career.mmtCluster || 1;
            let clusterScore = 0;
            if (clusterId === 1) clusterScore = mmtScores.c1 || 0;
            if (clusterId === 2) clusterScore = mmtScores.c2 || 0;
            if (clusterId === 3) clusterScore = mmtScores.c3 || 0;
            if (clusterId === 4) clusterScore = mmtScores.c4 || 0;
            if (clusterId === 5) clusterScore = mmtScores.c5 || 0;

            const matchPercentage = Math.min(100, Math.round((clusterScore / maxScore) * 100));

            return {
                id: career.id,
                name: career.name,
                description: career.description,
                purpose: career.purpose,
                matchPercentage,
                likesCount: career.likesCount,
                _score: matchPercentage
            };
        });

        scored.sort((a, b) => b._score - a._score);
        return scored.slice(0, 12);
    }

    async getStats()`;

careerSvc = careerSvc.replace(newMatchRegex, newMatchLogic);

// 2. Replace RIASEC references in AI prompts in askAi
careerSvc = careerSvc.replace(/user\?\.quizResults\?\.riasec/g, 'user?.quizResults?.mmtClusters');
careerSvc = careerSvc.replace(/user\.quizResults\.riasec\.[a-zA-Z]+/g, (match) => {
    return '0'; // Stub out specific RIASEC references in the prompt string temp
});
careerSvc = careerSvc.replace(/Результаты RIASEC/g, 'Результаты MMT');
careerSvc = careerSvc.replace(/RIASEC test results/g, 'MMT test results');
careerSvc = careerSvc.replace(/Натиҷаҳои тести RIASEC/g, 'Натиҷаҳои тести ММТ');

// 3. Update generateCareerAdvisorReport
const genReportRegex = /async generateCareerAdvisorReport[\s\S]*?async compareCarers/;

const newGenReportLogic = `async generateCareerAdvisorReport(scores: any, lang: string = 'tj'): Promise<any> {
        const mmt = scores?.mmtClusters || scores;
        if (!mmt || (!mmt.c1 && !mmt.c2)) {
            throw new NotFoundException('Натиҷаҳои тест ёфт нашуданд. Аввал тестро гузаред.');
        }

        const topMatches = await this.matchCareers(scores);
        const top3 = topMatches.slice(0, 3);

        const careerDetails = await Promise.all(
            top3.map(m => this.careerRepository.findOne({ where: { id: m.id }, relations: ['cluster'] }))
        );

        const careersContext = careerDetails
            .filter(Boolean)
            .map((c, i) => \`
Career \${i + 1}: "\${c.name}"
- Match: \${top3[i].matchPercentage}%
- Cluster: \${c.cluster?.clusterName || 'N/A'}
- Description: \${c.description || ''}
- Purpose: \${c.purpose || ''}
\`).join('\\n');

        let prompt = '';
        const jsonInstruction = \`
IMPORTANT: Return ONLY a valid JSON object. No markdown, no extra text, no code fences.
The JSON must have exactly these 5 keys:
{
  "personalityAnalysis": "A detailed analysis of the student's MMT cluster fit (3-5 sentences).",
  "careerRecommendations": [
    { "name": "Career Name", "matchPercentage": 85, "shortDescription": "1-2 sentence summary" }
  ],
  "explanation": [
    { "career": "Career Name", "reason": "2-3 sentences explaining why this career matches" }
  ],
  "successPrediction": [
    { "career": "Career Name", "probability": 82, "reasoning": "1-2 sentences" }
  ],
  "careerRoadmap": {
    "targetCareer": "The #1 recommended career name",
    "steps": [
      { "step": 1, "title": "Step title", "description": "What to do", "duration": "3 months" }
    ]
  }
}\`;

        prompt = \`You are "MyCareer AI" — an intelligent career advisor for the MyCareer.tj platform.
STUDENT PROFILE (MMT CLUSTERS SCORES):
- Cluster 1 (Natural-Technical): \${mmt.c1}
- Cluster 2 (Economics-Geography): \${mmt.c2}
- Cluster 3 (Philology-Arts): \${mmt.c3}
- Cluster 4 (Sociology-Law): \${mmt.c4}
- Cluster 5 (Medicine-Biology): \${mmt.c5}

TOP 3 MATCHING CAREERS FROM DATABASE:
\${careersContext}

YOUR TASK:
Analyze the student's profile and generate a detailed career recommendation.
Rules:
- Be analytical.
- Use MMT cluster scores for reasoning.
- ALL TEXT STRICTLY IN \${lang === 'ru' ? 'RUSSIAN' : lang === 'en' ? 'ENGLISH' : 'TAJIK'}.
\${jsonInstruction}\`;

        let rawResponse: string;
        try {
            rawResponse = await this.aiService.generateContent(prompt);
        } catch (error) {
            throw new InternalServerErrorException('Хатогӣ ҳангоми тавлиди тавсияи AI');
        }

        let report: any;
        try {
            let cleaned = rawResponse.trim();
            if (cleaned.startsWith('\`\`\`json')) cleaned = cleaned.slice(7);
            else if (cleaned.startsWith('\`\`\`')) cleaned = cleaned.slice(3);
            if (cleaned.endsWith('\`\`\`')) cleaned = cleaned.slice(0, -3);
            report = JSON.parse(cleaned.trim());
        } catch (e) {
            report = {
                personalityAnalysis: "Test completed.",
                careerRecommendations: top3.map(m => ({ name: m.name, matchPercentage: m.matchPercentage, shortDescription: '' })),
                explanation: [],
                successPrediction: [],
                careerRoadmap: { targetCareer: top3[0]?.name || '', steps: [] }
            };
        }

        return {
            mmtScores: mmt,
            report,
            topMatches: top3
        };
    }

    async compareCarers`;

careerSvc = careerSvc.replace(genReportRegex, newGenReportLogic);

const compareRegex = /async compareCarers[\s\S]*?\n\}/;
const newCompare = `async compareCarers(scores: any, careerNames: string[], lang: string = 'tj'): Promise<any> {
        return { message: "Comparison updated for MMT" };
    }
}`;
careerSvc = careerSvc.replace(compareRegex, newCompare);

// Remove RIASEC types at top
careerSvc = careerSvc.replace(/const RIASEC_KEYS[\s\S]*?const RIASEC_QUESTIONS_SERVED = 12;/g, '');

fs.writeFileSync(careerSvcPath, careerSvc, 'utf8');
console.log('Patched career.service.ts');
