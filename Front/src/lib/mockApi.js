// ═══════════════════════════════════════════════════════════════
//  MOCK API INTERCEPTOR
//  Intercepts axios requests when backend is unavailable,
//  returns realistic mock data so the entire app works offline.
// ═══════════════════════════════════════════════════════════════

import axios from "axios";
import {
  getMockCareers, saveMockCareers,
  getMockClusters, saveMockClusters,
  getMockUniversities,
  getMockUsers, saveMockUsers,
  getMockAppointments, saveMockAppointments,
} from "./mockData";
import { quizQuestions } from "../data/quizData";

const MOCK_TOKEN = "mock-jwt-token-demo-2025";
const MOCK_DELAY = 300; // ms

function delay(ms = MOCK_DELAY) {
  return new Promise((r) => setTimeout(r, ms));
}

function generateId() {
  return "id_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// ── Build quiz questions in the shape the backend returns ──
// quizData.js stores plain-string questions without options; the Quiz page
// expects `question: {tj, ru, en}` + an `options` array, so we adapt here.
const LIKERT_OPTIONS = [
  { tj: "Тамоман не", ru: "Совсем нет", en: "Not at all" },
  { tj: "Камтар", ru: "Скорее нет", en: "Rarely" },
  { tj: "Миёна", ru: "Нейтрально", en: "Neutral" },
  { tj: "Бештар ҳа", ru: "Скорее да", en: "Mostly yes" },
  { tj: "Комилан ҳа", ru: "Полностью да", en: "Absolutely yes" },
];

const CATEGORY_CLUSTER = {
  technical: "c1",
  realistic: "c1",
  "stress-resistance": "c1",
  analytical: "c2",
  investigative: "c2",
  creative: "c3",
  artistic: "c3",
  social: "c4",
  managerial: "c5",
  enterprising: "c5",
  conventional: "c5",
};

function buildMockQuestions() {
  return quizQuestions.map((q) => {
    const cluster = CATEGORY_CLUSTER[(q.category || "").toLowerCase()] || "c1";
    return {
      id: q.id,
      part: "mmt",
      type: "scenario",
      category: q.category,
      question: { tj: q.question, ru: q.question, en: q.question },
      options: LIKERT_OPTIONS.map((text, idx) => ({
        text,
        scores: { [cluster]: idx },
        keywords: [],
      })),
    };
  });
}

// ── Analyze quiz answers and produce RIASEC-like results ──
function analyzeQuizAnswers(answers) {
  const clusters = { c1: 0, c2: 0, c3: 0, c4: 0, c5: 0 };
  const riasec = { realistic: 0, investigative: 0, artistic: 0, social: 0, enterprising: 0, conventional: 0 };

  (answers || []).forEach((a) => {
    const val = Number(a.selectedValue) || 0;
    const q = quizQuestions.find((q) => q.id === a.questionId);
    if (!q) return;
    const cat = (q.category || "").toLowerCase();

    if (cat === "technical" || cat === "realistic") { clusters.c1 += val; riasec.realistic += val; }
    else if (cat === "investigative" || cat === "analytical") { clusters.c2 += val; riasec.investigative += val; }
    else if (cat === "creative" || cat === "artistic") { clusters.c3 += val; riasec.artistic += val; }
    else if (cat === "social") { clusters.c4 += val; riasec.social += val; }
    else if (cat === "enterprising" || cat === "managerial") { clusters.c5 += val; riasec.enterprising += val; }
    else if (cat === "conventional" || cat === "stress-resistance") { clusters.c1 += val; riasec.conventional += val; }
    else { clusters.c1 += val * 0.5; riasec.investigative += val * 0.5; }
  });

  // Determine top cluster
  const topClusterKey = Object.entries(clusters).sort((a, b) => b[1] - a[1])[0][0];
  const allClusters = getMockClusters();
  const clusterIndex = parseInt(topClusterKey.replace("c", "")) - 1;
  const topCluster = allClusters[clusterIndex] || allClusters[0];

  // Get careers from that cluster
  const careers = getMockCareers().filter((c) => c.clusterId === topCluster.id);
  const specializations = careers.slice(0, 5).map((c) => ({ id: c.id, name: c.name }));

  // Determine top RIASEC type
  const topType = Object.entries(riasec).sort((a, b) => b[1] - a[1])[0][0];
  const typeNames = { realistic: "Realistic", investigative: "Investigative", artistic: "Artistic", social: "Social", enterprising: "Enterprising", conventional: "Conventional" };

  return {
    scores: { riasec, mmtClusters: clusters },
    topCluster: { ...topCluster, specializations },
    topType: typeNames[topType] || "Investigative",
    personality: "Шумо шахси боистеъдод ва пуриродаед. Профили шумо нишон медиҳад, ки ба кори амалӣ ва ҳалли масъалаҳо таваҷҷӯҳи зиёд доред.",
    aiAdvice: `Дар асоси натиҷаи тести шумо, кластери "${topCluster.clusterName}" бештар ба шумо мувофиқ аст. Тавсия медиҳем, ки ихтисосҳои ин кластерро омӯзед ва бо мутахассисони ин соҳа машварат кунед. Қадами аввал — портфолио ё тавоноиро рушд диҳед.`,
  };
}

// ── Match careers based on quiz scores ──
function matchCareers(scores) {
  const careers = getMockCareers();
  const clusters = scores?.mmtClusters || {};

  return careers.map((career) => {
    const cKey = career.clusterId?.replace("cl", "c") || "c1";
    const clusterScore = clusters[cKey] || 0;
    const maxScore = Math.max(1, ...Object.values(clusters));
    const matchPercentage = Math.min(99, Math.max(30, Math.round((clusterScore / maxScore) * 85 + Math.random() * 15)));

    return {
      ...career,
      matchPercentage,
      cosineSimilarity: matchPercentage / 100 * 0.85 + 0.1,
      euclideanSimilarity: matchPercentage / 100 * 0.8 + 0.15,
      confidenceIndex: 0.2 + Math.random() * 0.3,
      dimensionBreakdown: { c1: 0.3 + Math.random() * 0.5, c2: 0.2 + Math.random() * 0.4, c3: 0.2 + Math.random() * 0.5, c4: 0.3 + Math.random() * 0.4, c5: 0.2 + Math.random() * 0.5 },
      userProfile: clusters,
      careerProfile: career.riasecProfile || {},
    };
  }).sort((a, b) => b.matchPercentage - a.matchPercentage).slice(0, 8);
}

// ── Route handler map ──
async function handleMockRequest(config) {
  const { url, method, data: body, params } = config;
  const path = url.replace(/^https?:\/\/[^/]+\/api/, "");
  const m = (method || "get").toLowerCase();

  await delay();

  // ── AUTH ──
  if (path === "/auth/login" && m === "post") {
    const users = getMockUsers();
    const user = users.find((u) => u.email === body?.email && u.password === body?.password);
    if (!user) return { status: 401, data: { message: "Email ё парол нодуруст аст" } };
    return { status: 200, data: { user: { ...user, password: undefined }, access_token: MOCK_TOKEN, token: MOCK_TOKEN } };
  }

  if (path === "/auth/register" && m === "post") {
    const users = getMockUsers();
    if (users.find((u) => u.email === body?.email)) {
      return { status: 400, data: { message: "Ин email аллакай сабт шудааст" } };
    }
    const newUser = { id: generateId(), name: body?.name || "Корбар", email: body?.email, password: body?.password, role: "user", quizResults: null, likedCareers: [], savedCareers: [], createdAt: new Date().toISOString() };
    users.push(newUser);
    saveMockUsers(users);
    return { status: 201, data: { user: { ...newUser, password: undefined }, access_token: MOCK_TOKEN, token: MOCK_TOKEN } };
  }

  if (path === "/auth/profile" && m === "get") {
    const users = getMockUsers();
    const authUser = users.find((u) => u.role !== "admin") || users[0];
    return { status: 200, data: { ...authUser, password: undefined } };
  }

  if (path === "/users/profile" && m === "get") {
    const users = getMockUsers();
    const authUser = users.find((u) => u.role !== "admin") || users[0];
    return { status: 200, data: { ...authUser, password: undefined } };
  }

  // ── QUIZ ──
  if (path === "/quiz/questions" && m === "get") {
    return { status: 200, data: buildMockQuestions() };
  }

  // No stage-2 questions offline — the quiz submits straight after stage 1.
  if (path === "/quiz/specialty-questions" && m === "get") {
    return { status: 200, data: [] };
  }

  if ((path === "/quiz/submit" || path === "/quiz/submit-authenticated") && m === "post") {
    const results = analyzeQuizAnswers(body?.answers);
    return { status: 200, data: results };
  }

  // ── CAREERS ──
  if (path === "/careers" && m === "get") {
    let careers = getMockCareers();
    const { search, clusterId, page = 1, limit = 12 } = params || {};
    if (search) careers = careers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
    if (clusterId) careers = careers.filter((c) => c.clusterId === clusterId);
    const total = careers.length;
    const start = ((page - 1) * limit);
    const paginated = careers.slice(start, start + Number(limit));
    return { status: 200, data: { data: paginated, total, page: Number(page), lastPage: Math.ceil(total / limit), meta: { total, page: Number(page), limit: Number(limit), lastPage: Math.ceil(total / limit) } } };
  }

  if (path === "/careers/match" && m === "post") {
    const matched = matchCareers(body?.scores);
    return { status: 200, data: matched };
  }

  if (path === "/careers/stats" && m === "get") {
    const careers = getMockCareers();
    const clusters = getMockClusters();
    const users = getMockUsers();
    return { status: 200, data: { totalUsers: users.length, totalCareers: careers.length, totalClusters: clusters.length, totalLikes: careers.reduce((s, c) => s + (c.likesCount || 0), 0), topLiked: [...careers].sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0)).slice(0, 7), topSaved: [...careers].sort((a, b) => (b.savedCount || 0) - (a.savedCount || 0)).slice(0, 7) } };
  }

  if (path === "/careers/ask" && m === "post") {
    const q = (body?.question || "").toLowerCase();
    let answer = "";
    if (q.includes("маош") || q.includes("зарплат") || q.includes("salary")) {
      answer = "## 💰 Маош дар Тоҷикистон\n\nМаоши мутахассисон дар Тоҷикистон вобаста ба соҳа ва таҷриба фарқ мекунад:\n\n- **Барномасоз (Junior):** 2,000 — 4,000 сомонӣ\n- **Барномасоз (Middle):** 5,000 — 10,000 сомонӣ\n- **Барномасоз (Senior):** 12,000 — 25,000 сомонӣ\n- **Дизайнер UI/UX:** 3,000 — 8,000 сомонӣ\n- **Муҳандиси шабака:** 3,500 — 7,000 сомонӣ\n\n### 📈 Тавсияҳо\n- Забонҳои Python, JavaScript ва TypeScript дар Тоҷикистон талаботи зиёд доранд\n- Фрилансерон метавонанд то 2-3 маротиба зиёдтар даромад кунанд\n- Сертификатҳои AWS, Google Cloud маошро 30-50% зиёд мекунанд";
    } else if (q.includes("донишгоҳ") || q.includes("университет")) {
      answer = "## 🏛️ Донишгоҳҳои Тоҷикистон\n\nДонишгоҳҳои асосӣ барои таҳсилоти IT ва касбӣ:\n\n- **ДДМТ (Донишгоҳи давлатии миллии Тоҷикистон)** — Душанбе\n- **ДПТ (Донишгоҳи политехникии Тоҷикистон)** — Душанбе\n- **Донишгоҳи славянии Тоҷикистон** — Душанбе\n- **Донишгоҳи технологии Тоҷикистон** — Душанбе\n\n### 💡 Тавсия\nБарои ихтисосҳои IT, ДПТ ва Донишгоҳи технологӣ беҳтарин интихоб ҳастанд.";
    } else if (q.includes("мувофиқ") || q.includes("тест") || q.includes("ихтисос")) {
      answer = "## 🎯 Ихтисоси мувофиқ\n\nБарои ёфтани ихтисоси мувофиқ, аввал **тести касбиро** гузаред! Тест натиҷаҳои шуморо таҳлил карда, ихтисосҳои мувофиқро пешниҳод мекунад.\n\n### Қадамҳо:\n1. Ба саҳифаи **Тест** равед\n2. Ба ҳамаи саволҳо ҷавоб диҳед\n3. Натиҷаҳои AI-ро дар **Панели шахсӣ** бинед\n\nСистемаи мо дар асоси профили психологии шумо ихтисосҳои мувофиқро бо фоизи мувофиқат нишон медиҳад.";
    } else {
      answer = `## 💬 Ҷавоб\n\nСаволи шумо қабул шуд: "${body?.question}"\n\n### Маълумот\nМан AI Мушовири касбии MyCareer ҳастам. Метавонам дар бораи:\n\n- **Ихтисосҳо** — тавсиф, маош, талабот\n- **Донишгоҳҳо** — дар Тоҷикистон ва хориҷа\n- **Роҳи касбӣ** — қадамҳо барои муваффақият\n- **Муқоиса** — ихтисосҳоро бо ҳам муқоиса кунед\n\nСаволи мушаххастар пурсед, то ман беҳтар кӯмак расонам!`;
    }
    return { status: 200, data: { answer, remainingToday: 4 } };
  }

  if (path === "/careers/voice-ask" && m === "post") {
    return { status: 200, data: { transcription: "Ман мехоҳам дар бораи ихтисосҳо маълумот гирам", answer: "## 🎙️ Паёми овозии шумо қабул шуд!\n\nМан метавонам дар бораи ҳар гуна ихтисос, маош, донишгоҳ ва роҳи касбӣ маълумот диҳам.\n\n### Тавсия\nСаволи мушаххас пурсед, масалан:\n- Маоши барномасоз чанд аст?\n- Кадом донишгоҳ барои IT беҳтар аст?\n- Ихтисоси дизайнер чӣ гуна аст?", remainingToday: 4 } };
  }


  if (path === "/careers/ai-advisor" && m === "post") {
    const careers = getMockCareers().slice(0, 3);
    return { status: 200, data: {
      report: {
        personalityAnalysis: "Профили психологии шумо нишон медиҳад, ки шумо шахси таҳлилгар ва амалӣ ҳастед. Шумо ба кори системавӣ ва ҳалли масъалаҳои мураккаб таваҷҷӯҳи зиёд доред.",
        careerRecommendations: careers.map((c, i) => ({ name: c.name, shortDescription: c.description, matchPercentage: 95 - i * 10 })),
        explanation: careers.map((c) => ({ career: c.name, reason: `Ин ихтисос ба профили RIASEC-и шумо мувофиқ аст, зеро малакаҳои зарурӣ бо қобилиятҳои табиии шумо мувофиқат мекунанд.` })),
        successPrediction: careers.map((c, i) => ({ career: c.name, probability: 90 - i * 8, reasoning: "Дар асоси таҳлили AI ва мувофиқати профил." })),
        careerRoadmap: { targetCareer: careers[0]?.name, steps: [{ step: 1, title: "Асосҳоро омӯзед", description: "Курсҳои асосӣ ва китобҳо", duration: "3 моҳ" }, { step: 2, title: "Малака ва амалия", description: "Лоиҳаҳои реалӣ ва амалия", duration: "6 моҳ" }, { step: 3, title: "Кор ва рушд", description: "Кори аввалин ва рушди минбаъда", duration: "12 моҳ" }] },
      },
      riasecScores: body?.scores?.riasec || { realistic: 5, investigative: 7, artistic: 4, social: 6, enterprising: 5, conventional: 6 },
      dominantTypes: [{ type: "Investigative", score: 7 }, { type: "Social", score: 6 }, { type: "Conventional", score: 6 }],
    } };
  }

  if (path === "/careers/compare" && m === "post") {
    const requestedCareers = body?.careers || [];
    return { status: 200, data: {
      bestCareerName: requestedCareers[0],
      reason: "Ин ихтисос аз ҷиҳати мувофиқат бо профили шумо ва талаботи бозор беҳтарин аст.",
      summary: "Таҳлили муқоисавӣ нишон дод, ки ҳар ду ихтисос имконоти хуб доранд.",
      careerComparison: requestedCareers.map((name, i) => ({
        career: name, matchPercentage: 90 - i * 12,
        summary: `${name} — ихтисоси ояндадор бо имконоти зиёд.`,
        pros: ["Талаботи баланд", "Маоши хуб", "Имконоти рушд"],
        cons: ["Рақобати зиёд", "Ниёз ба омӯзиши доимӣ"],
        skillsRequired: ["Таҳлилгарӣ", "Коммуникатсия", "Техникӣ"],
        marketDemand: i === 0 ? "high" : "medium",
        learningDifficulty: "medium",
        salaryRange: "$500-2000",
      })),
    } };
  }

  // Career like
  const likeMatch = path.match(/^\/careers\/([^/]+)\/like$/);
  if (likeMatch && m === "post") {
    const careerId = likeMatch[1];
    const careers = getMockCareers();
    const career = careers.find((c) => c.id === careerId);
    if (!career) return { status: 404, data: { message: "Ихтисос ёфт нашуд" } };
    const users = getMockUsers();
    const user = users.find((u) => u.role !== "admin") || users[0];
    const alreadyLiked = (user.likedCareers || []).some((c) => c.id === careerId);
    if (alreadyLiked) {
      user.likedCareers = user.likedCareers.filter((c) => c.id !== careerId);
      career.likesCount = Math.max(0, (career.likesCount || 1) - 1);
    } else {
      user.likedCareers = [...(user.likedCareers || []), { id: career.id, name: career.name, description: career.description, cluster: career.cluster }];
      career.likesCount = (career.likesCount || 0) + 1;
    }
    saveMockUsers(users);
    saveMockCareers(careers);
    return { status: 200, data: { liked: !alreadyLiked, likesCount: career.likesCount } };
  }

  // Universities offering a career, with tuition. Offline the mock careers only
  // carry university names, so one рӯзона offering per name is synthesised.
  const careerOfferingsMatch = path.match(/^\/careers\/([^/]+)\/offerings$/);
  if (careerOfferingsMatch && m === "get") {
    const career = getMockCareers().find((c) => c.id === careerOfferingsMatch[1]);
    if (!career) return { status: 200, data: [] };

    const universities = getMockUniversities();
    const offerings = (career.universities || []).map((entry, index) => {
      const name = typeof entry === "string" ? entry : entry?.name;
      const known = universities.find((u) => u.name === name || name?.includes(u.name));
      return {
        id: `${career.id}-offering-${index}`,
        studyForm: "рӯзона",
        paymentType: career.tuitionFee ? "пулакӣ" : "ройгон",
        tuitionFee: career.tuitionFee ?? null,
        language: "тоҷикӣ",
        seats: 25,
        basedOn: 11,
        university: {
          id: known?.id ?? `mock-uni-${index}`,
          name: name ?? "Донишгоҳ",
          city: known?.city ?? "Душанбе",
          region: null,
          institutionType: "Донишгоҳ",
          isState: true,
        },
      };
    });
    return { status: 200, data: offerings };
  }

  // Career detail by ID
  const careerDetailMatch = path.match(/^\/careers\/([^/]+)$/);
  if (careerDetailMatch && m === "get") {
    const career = getMockCareers().find((c) => c.id === careerDetailMatch[1]);
    if (!career) return { status: 404, data: { message: "Ихтисос ёфт нашуд" } };
    return { status: 200, data: career };
  }

  // ── CLUSTERS ──
  if (path === "/clusters" && m === "get") {
    return { status: 200, data: getMockClusters() };
  }

  const clusterDetailMatch = path.match(/^\/clusters\/([^/]+)$/);
  if (clusterDetailMatch && m === "get") {
    const cluster = getMockClusters().find((c) => c.id === clusterDetailMatch[1]);
    return { status: 200, data: cluster || null };
  }

  if (path.startsWith("/clusters") && m === "post") {
    const clusters = getMockClusters();
    const newCluster = { id: generateId(), ...body, careersCount: 0 };
    clusters.push(newCluster);
    saveMockClusters(clusters);
    return { status: 201, data: newCluster };
  }

  // ── UNIVERSITIES ──
  if (path === "/universities" && m === "get") {
    return { status: 200, data: getMockUniversities() };
  }

  // Must be matched before the /:id route below.
  if (path === "/universities/cities" && m === "get") {
    const counts = new Map();
    for (const uni of getMockUniversities()) {
      if (!uni.city) continue;
      counts.set(uni.city, (counts.get(uni.city) || 0) + 1);
    }
    return {
      status: 200,
      data: [...counts.entries()]
        .map(([city, count]) => ({ city, region: null, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  const uniDetailMatch = path.match(/^\/universities\/([^/]+)$/);
  if (uniDetailMatch && m === "get") {
    const uni = getMockUniversities().find((u) => u.id === uniDetailMatch[1]);
    return { status: 200, data: uni || null };
  }

  const uniSpecMatch = path.match(/^\/universities\/([^/]+)\/specialties$/);
  if (uniSpecMatch && m === "get") {
    const careers = getMockCareers().slice(0, 5);
    return { status: 200, data: careers.map((c) => ({ id: c.id, name: c.name, cluster: c.cluster })) };
  }

  // ── USERS ──
  if (path === "/users/liked-careers" && m === "get") {
    const users = getMockUsers();
    const user = users.find((u) => u.role !== "admin") || users[0];
    return { status: 200, data: user?.likedCareers || [] };
  }

  if (path === "/users/saved-careers" && m === "get") {
    const users = getMockUsers();
    const user = users.find((u) => u.role !== "admin") || users[0];
    return { status: 200, data: user?.savedCareers || [] };
  }

  const saveCareerMatch = path.match(/^\/users\/save-career\/([^/]+)$/);
  if (saveCareerMatch && m === "post") {
    const careerId = saveCareerMatch[1];
    const careers = getMockCareers();
    const career = careers.find((c) => c.id === careerId);
    if (!career) return { status: 404, data: { message: "Ихтисос ёфт нашуд" } };
    const users = getMockUsers();
    const user = users.find((u) => u.role !== "admin") || users[0];
    const alreadySaved = (user.savedCareers || []).some((c) => c.id === careerId);
    if (alreadySaved) {
      user.savedCareers = user.savedCareers.filter((c) => c.id !== careerId);
    } else {
      user.savedCareers = [...(user.savedCareers || []), { id: career.id, name: career.name, description: career.description, cluster: career.cluster }];
    }
    saveMockUsers(users);
    return { status: 200, data: { saved: !alreadySaved } };
  }

  if (path === "/users/chat-history" && m === "get") {
    return { status: 200, data: [] };
  }

  if (path === "/users/ai-usage" && m === "get") {
    return { status: 200, data: { remainingToday: 5, isAdmin: false } };
  }

  if (path === "/users/specialists" && m === "get") {
    return { status: 200, data: [
      { id: "spec1", name: "Фаррух Ализода", email: "farrukh@mycareer.tj", specialization: "Мушовири касбӣ", bio: "Мутахассиси роҳнамоии касбӣ бо 5 сол таҷриба. Ба донишҷӯён кӯмак мерасонад, ки роҳи касбиашонро ёбанд.", ratingAverage: 4.7, meetingLocation: "Душанбе, кӯчаи Рудакӣ 45" },
      { id: "spec2", name: "Мадина Каримова", email: "madina@mycareer.tj", specialization: "Психологи касбӣ", bio: "Психологи баландихтисос барои мушовираи касбӣ ва шахсӣ.", ratingAverage: 4.9, meetingLocation: "Душанбе, кӯчаи Сомонӣ 12" },
    ] };
  }

  // ── ADMIN: Users list ──
  if (path === "/users" && m === "get") {
    return { status: 200, data: getMockUsers().map((u) => ({ ...u, password: undefined })) };
  }

  // ── ADMIN: Careers CRUD ──
  if (path.startsWith("/careers") && m === "post" && !path.includes("match") && !path.includes("ask") && !path.includes("voice-ask") && !path.includes("compare") && !path.includes("ai-advisor") && !path.includes("like")) {
    const careers = getMockCareers();
    const newCareer = { id: generateId(), ...body, likesCount: 0, savedCount: 0 };
    careers.push(newCareer);
    saveMockCareers(careers);
    return { status: 201, data: newCareer };
  }

  const careerEditMatch = path.match(/^\/careers\/([^/]+)$/);
  if (careerEditMatch && m === "put") {
    const careers = getMockCareers();
    const idx = careers.findIndex((c) => c.id === careerEditMatch[1]);
    if (idx === -1) return { status: 404, data: { message: "Ёфт нашуд" } };
    careers[idx] = { ...careers[idx], ...body };
    saveMockCareers(careers);
    return { status: 200, data: careers[idx] };
  }

  if (careerDetailMatch && m === "delete") {
    const careers = getMockCareers();
    const filtered = careers.filter((c) => c.id !== careerDetailMatch[1]);
    saveMockCareers(filtered);
    return { status: 200, data: { success: true } };
  }

  // ── APPOINTMENTS ──
  if (path === "/appointments" && m === "post") {
    const appointments = getMockAppointments();
    const newAppt = { id: generateId(), ...body, status: "PENDING", createdAt: new Date().toISOString() };
    appointments.push(newAppt);
    saveMockAppointments(appointments);
    return { status: 201, data: newAppt };
  }

  if (path === "/appointments/my" && m === "get") {
    return { status: 200, data: getMockAppointments() };
  }

  const availabilityMatch = path.match(/^\/appointments\/availability\/([^/]+)$/);
  if (availabilityMatch && m === "get") {
    const slots = [];
    for (let h = 9; h <= 17; h++) {
      slots.push({ time: `${String(h).padStart(2, "0")}:00`, available: Math.random() > 0.3 });
      slots.push({ time: `${String(h).padStart(2, "0")}:30`, available: Math.random() > 0.4 });
    }
    return { status: 200, data: { slots } };
  }

  // ── ADMIN: Users delete ──
  const userDeleteMatch = path.match(/^\/users\/([^/]+)$/);
  if (userDeleteMatch && m === "delete") {
    const users = getMockUsers().filter((u) => u.id !== userDeleteMatch[1]);
    saveMockUsers(users);
    return { status: 200, data: { success: true } };
  }

  // ── ADMIN: Users role change ──
  const userRoleMatch = path.match(/^\/users\/([^/]+)\/role$/);
  if (userRoleMatch && m === "patch") {
    const users = getMockUsers();
    const idx = users.findIndex((u) => u.id === userRoleMatch[1]);
    if (idx !== -1) { users[idx].role = body?.role || "user"; saveMockUsers(users); }
    return { status: 200, data: { success: true } };
  }

  // ── ADMIN: Specialists ──
  if (path === "/users/admin/specialists" && m === "get") {
    return { status: 200, data: [
      { id: "spec1", name: "Фаррух Ализода", email: "farrukh@mycareer.tj", role: "specialist", specialization: "Мушовири касбӣ", bio: "Мутахассиси роҳнамоии касбӣ бо 5 сол таҷриба.", ratingAverage: 4.7, meetingLocation: "Душанбе, кӯчаи Рудакӣ 45" },
      { id: "spec2", name: "Мадина Каримова", email: "madina@mycareer.tj", role: "specialist", specialization: "Психологи касбӣ", bio: "Психологи баландихтисос барои мушовираи касбӣ.", ratingAverage: 4.9, meetingLocation: "Душанбе, кӯчаи Сомонӣ 12" },
    ] };
  }

  if (path === "/users/admin/specialists" && m === "post") {
    return { status: 201, data: { id: generateId(), ...body, role: "specialist", ratingAverage: 0 } };
  }

  const specEditMatch = path.match(/^\/users\/admin\/specialists\/([^/]+)$/);
  if (specEditMatch && m === "patch") {
    return { status: 200, data: { id: specEditMatch[1], ...body } };
  }

  // ── ADMIN: Cluster edit/delete ──
  const clusterEditMatch = path.match(/^\/clusters\/([^/]+)$/);
  if (clusterEditMatch && m === "put") {
    const clusters = getMockClusters();
    const idx = clusters.findIndex((c) => c.id === clusterEditMatch[1]);
    if (idx !== -1) { clusters[idx] = { ...clusters[idx], ...body }; saveMockClusters(clusters); }
    return { status: 200, data: clusters[idx] || body };
  }

  if (clusterDetailMatch && m === "delete") {
    const clusters = getMockClusters().filter((c) => c.id !== clusterDetailMatch[1]);
    saveMockClusters(clusters);
    return { status: 200, data: { success: true } };
  }

  // ── ADMIN: Delete all careers ──
  if (path === "/careers" && m === "delete") {
    saveMockCareers([]);
    return { status: 200, data: { success: true } };
  }

  // ── ADMIN: Specialist schedule ──
  if (path === "/appointments/specialist/my" && m === "get") {
    return { status: 200, data: getMockAppointments() };
  }

  const apptStatusMatch = path.match(/^\/appointments\/([^/]+)\/status$/);
  if (apptStatusMatch && m === "patch") {
    const appts = getMockAppointments();
    const idx = appts.findIndex((a) => a.id === apptStatusMatch[1]);
    if (idx !== -1) { appts[idx].status = body?.status || "CONFIRMED"; saveMockAppointments(appts); }
    return { status: 200, data: { success: true } };
  }

  const apptRatingMatch = path.match(/^\/appointments\/([^/]+)\/rating$/);
  if (apptRatingMatch && m === "post") {
    const appts = getMockAppointments();
    const idx = appts.findIndex((a) => a.id === apptRatingMatch[1]);
    if (idx !== -1) { appts[idx].rating = body?.rating; saveMockAppointments(appts); }
    return { status: 200, data: { success: true } };
  }

  // Default: not found
  return null;
}

// ═══════════════════════════════════════════════════════════════
//  INSTALL INTERCEPTOR
//  Call this once at app startup.
//  It adds an axios response interceptor that catches network
//  errors (backend down) and returns mock data instead.
// ═══════════════════════════════════════════════════════════════
let installed = false;

export function installMockInterceptor() {
  if (installed) return;
  installed = true;

  axios.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config;

      // Дархости бекоршуда backend-и хомӯш нест.
      //
      // Вақте компонент дархости кӯҳнаро бо AbortController бекор мекунад,
      // axios хатои бе `response` медиҳад — маҳз мисли хатои шабака. Бе ин
      // санҷиш mock онро ҳамчун "backend афтод" мефаҳмид ва ба ҷои хато
      // ҷавоби БОМУВАФФАҚИЯТИ сохта бармегардонд. Он ҷавоб дертар аз ҷавоби
      // воқеӣ мерасид ва маълумоти дурустро мепӯшонд: саҳифаи ихтисосҳо
      // ба ҷои 172 ихтисос "0 ихтисос ёфт шуд" нишон медод.
      if (axios.isCancel(error) || error.code === "ERR_CANCELED") {
        return Promise.reject(error);
      }

      // Only intercept network errors (backend down) or 5xx errors
      const isNetworkError = !error.response || error.code === "ERR_NETWORK" || error.code === "ECONNREFUSED";
      const isServerError = error.response?.status >= 500;

      if ((isNetworkError || isServerError) && config && !config._mockRetried) {
        config._mockRetried = true;
        try {
          const mockResult = await handleMockRequest(config);
          if (mockResult) {
            console.log(`[MockAPI] ${config.method?.toUpperCase()} ${config.url} → mock response`);
            return { ...mockResult, config, headers: {}, request: {} };
          }
        } catch (e) {
          console.warn("[MockAPI] Error handling mock request:", e);
        }
      }

      return Promise.reject(error);
    }
  );

  console.log("[MockAPI] Interceptor installed — backend-free demo mode active");
}

