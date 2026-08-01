// ═══════════════════════════════════════════════════════════════
//  MOCK DATA — Used when backend API is unavailable
//  All data persists in localStorage for demo purposes
// ═══════════════════════════════════════════════════════════════

const LS_KEYS = {
  careers: "mock_careers",
  clusters: "mock_clusters",
  universities: "mock_universities",
  users: "mock_users",
  appointments: "mock_appointments",
};

// ── Clusters ──
const DEFAULT_CLUSTERS = [
  {
    id: "cl1",
    clusterName: "Табиӣ-техникӣ",
    clusterDescription: "Математика, физика, информатика, муҳандисӣ ва технологияҳои замонавӣ. Ин кластер барои шахсоне мувофиқ аст, ки ба маҳорати техникӣ ва ҳалли масъалаҳои мантиқӣ таваҷҷӯҳ доранд.",
    purpose: "Тайёр кардани мутахассисони техникӣ барои бозори кори замонавӣ.",
    icon: "Cpu",
    careersCount: 12,
  },
  {
    id: "cl2",
    clusterName: "Иқтисод ва география",
    clusterDescription: "Иқтисод, менеҷмент, молия, бухгалтерия ва ҷуғрофия. Барои шахсоне, ки ба тиҷорат, идоракунӣ ва рақамҳо алоқаманданд.",
    purpose: "Омода кардани мутахассисони соҳаи иқтисодӣ ва бизнес.",
    icon: "TrendingUp",
    careersCount: 10,
  },
  {
    id: "cl3",
    clusterName: "Филология ва санъат",
    clusterDescription: "Забоншиносӣ, адабиёт, педагогика, санъат ва дизайн. Барои шахсони эҷодкор, ки ба забон, навиштан ва муоширот завқ доранд.",
    purpose: "Рушди истеъдодҳои эҷодӣ ва муоширатӣ.",
    icon: "Palette",
    careersCount: 8,
  },
  {
    id: "cl4",
    clusterName: "Ҷомеашиносӣ ва ҳуқуқ",
    clusterDescription: "Ҳуқуқшиносӣ, сиёсатшиносӣ, психология ва ҷамъиятшиносӣ. Барои шахсоне, ки мехоҳанд ба ҷомеа хизмат расонанд.",
    purpose: "Тайёр кардани мутахассисони ҳуқуқ ва ҷомеа.",
    icon: "Scale",
    careersCount: 9,
  },
  {
    id: "cl5",
    clusterName: "Тиб ва варзиш",
    clusterDescription: "Тиб, фармация, биология, саломатии ҷамъиятӣ ва варзиш. Барои касоне, ки мехоҳанд ба саломатии мардум ёрӣ расонанд.",
    purpose: "Омода кардани мутахассисони тиббӣ ва варзишӣ.",
    icon: "Heart",
    careersCount: 7,
  },
];

// ── Careers ──
const DEFAULT_CAREERS = [
  {
    id: "car1", name: "Барномасози веб (Full-Stack)", description: "Сохтан ва идоракунии сайтҳо ва барномаҳои веб бо истифодаи технологияҳои замонавӣ.",
    purpose: "Барномасоз системаҳои веб-ро месозад, ки миллионҳо одам онро истифода мебаранд.",
    clusterId: "cl1", cluster: { id: "cl1", clusterName: "Табиӣ-техникӣ" },
    skills: { technical: ["JavaScript", "React", "Node.js", "SQL", "Git"], soft: ["Кор дар гурӯҳ", "Ҳалли масъала", "Коммуникатсия"] },
    technologies: ["React", "Next.js", "TypeScript", "PostgreSQL", "Docker"],
    salary: { junior: "$400-600", mid: "$800-1500", senior: "$2000-4000" },
    roadmap: [{ step: 1, title: "HTML/CSS/JS", duration: "3 моҳ" }, { step: 2, title: "React & Node.js", duration: "6 моҳ" }, { step: 3, title: "Лоиҳаи аввал", duration: "3 моҳ" }],
    certifications: ["AWS Certified Developer", "Meta Front-End Certificate"],
    universities: ["ДМТ (Донишгоҳи миллии Тоҷикистон)", "ДТТ (Донишгоҳи техникии Тоҷикистон)"],
    likesCount: 47, savedCount: 23, degreeType: "Бакалавр", durationYears: 4, careerCount: 3,
    projectExamples: ["Сайти тиҷоратӣ", "CRM система", "Мобил аппликатсия"],
    opportunities: ["Барномасоз дар ширкат", "Фрилансер", "Стартап сохтан"],
    relatedSpecializations: ["Барномасози мобил", "DevOps муҳандис", "Дизайнери UX/UI"],
    advice: "Ҳар рӯз код нависед ва лоиҳаҳои реалӣ созед. Портфолиои қавӣ аз диплом муҳимтар аст.",
    riasecProfile: { realistic: 6, investigative: 8, artistic: 5, social: 4, enterprising: 5, conventional: 7 },
  },
  {
    id: "car2", name: "Дизайнери UX/UI", description: "Тарроҳии интерфейсҳои зебо ва қулай барои барномаҳо ва сайтҳо.",
    purpose: "Дизайнер таҷрибаи корбариро беҳтар мекунад то маҳсулот осон ва хушоянд бошад.",
    clusterId: "cl3", cluster: { id: "cl3", clusterName: "Филология ва санъат" },
    skills: { technical: ["Figma", "Adobe XD", "Prototyping", "CSS"], soft: ["Эҷодкорӣ", "Диққат ба тафсилот", "Эмпатия"] },
    technologies: ["Figma", "Sketch", "Adobe Creative Suite", "Framer"],
    salary: { junior: "$300-500", mid: "$700-1200", senior: "$1500-3000" },
    roadmap: [{ step: 1, title: "Асосҳои дизайн", duration: "2 моҳ" }, { step: 2, title: "Figma & Prototyping", duration: "4 моҳ" }, { step: 3, title: "Портфолио", duration: "3 моҳ" }],
    certifications: ["Google UX Design Certificate", "Interaction Design Foundation"],
    universities: ["ДМТ", "ДДСТ"],
    likesCount: 35, savedCount: 18, degreeType: "Бакалавр", durationYears: 4, careerCount: 2,
    projectExamples: ["Аппи мобилӣ", "Сайти корпоративӣ", "Дашборд"],
    opportunities: ["Дизайнер дар ширкат", "Фрилансер", "Product Designer"],
    relatedSpecializations: ["График дизайнер", "Барномасози фронтенд", "Motion Designer"],
    advice: "Ҳамеша фикри корбарро аввал гузоред. Портфолио бисозед ва дизайни худро мунтазам беҳтар кунед.",
    riasecProfile: { realistic: 4, investigative: 5, artistic: 9, social: 6, enterprising: 4, conventional: 3 },
  },
  {
    id: "car3", name: "Муҳосиб", description: "Идоракунии ҳисобҳои молиявӣ ва андозсупорӣ барои ташкилотҳо.",
    purpose: "Муҳосиб ба ташкилот кӯмак мекунад, ки молиявиашон дуруст ва қонунӣ идора шавад.",
    clusterId: "cl2", cluster: { id: "cl2", clusterName: "Иқтисод ва география" },
    skills: { technical: ["1С Бухгалтерия", "Excel", "Андозбандӣ", "Аудит"], soft: ["Диққат", "Масъулиятнокӣ", "Таҳлилгарӣ"] },
    technologies: ["1С", "SAP", "Microsoft Excel", "QuickBooks"],
    salary: { junior: "$200-400", mid: "$500-900", senior: "$1000-2000" },
    roadmap: [{ step: 1, title: "Асосҳои бухгалтерия", duration: "3 моҳ" }, { step: 2, title: "1С ва Excel", duration: "4 моҳ" }, { step: 3, title: "Амалия", duration: "6 моҳ" }],
    certifications: ["ACCA", "CPA"],
    universities: ["ДДСТ (Донишгоҳи давлатии савдо)", "ДМТ"],
    likesCount: 22, savedCount: 15, degreeType: "Бакалавр", durationYears: 4, careerCount: 4,
    projectExamples: ["Ҳисоботи молиявӣ", "Аудити ширкат"],
    opportunities: ["Муҳосиб дар ширкат", "Аудитор", "Маслиҳатгари молиявӣ"],
    relatedSpecializations: ["Аудитор", "Молиячӣ", "Иқтисоддон"],
    advice: "Дар соҳаи бухгалтерия диққат ва дақиқият хеле муҳим аст.",
    riasecProfile: { realistic: 5, investigative: 6, artistic: 2, social: 4, enterprising: 5, conventional: 9 },
  },
  {
    id: "car4", name: "Табиб (Духтури умумӣ)", description: "Ташхис ва табобати беморон дар муассисаҳои тиббӣ.",
    purpose: "Табиб саломатии мардумро муҳофизат мекунад ва ба беморон шифо мебахшад.",
    clusterId: "cl5", cluster: { id: "cl5", clusterName: "Тиб ва варзиш" },
    skills: { technical: ["Анатомия", "Фармакология", "Диагностика", "Ҷарроҳӣ"], soft: ["Сабр", "Ҳамдардӣ", "Коммуникатсия"] },
    technologies: ["Ультразвук", "МРТ", "ЭКГ", "Лаборатория"],
    salary: { junior: "$300-500", mid: "$600-1200", senior: "$1500-3000" },
    roadmap: [{ step: 1, title: "Илмҳои асосӣ", duration: "2 сол" }, { step: 2, title: "Клиникӣ", duration: "3 сол" }, { step: 3, title: "Резидентура", duration: "2 сол" }],
    certifications: ["Дипломи тиббӣ", "Резидентура"],
    universities: ["ДДТТ (Донишгоҳи давлатии тиббии Тоҷикистон)"],
    likesCount: 55, savedCount: 30, degreeType: "Магистр", durationYears: 7, careerCount: 5,
    projectExamples: ["Таҳқиқоти клиникӣ", "Лоиҳаи саломатии ҷамъиятӣ"],
    opportunities: ["Духтур дар беморхона", "Клиникаи хусусӣ", "Таҳқиқотгар"],
    relatedSpecializations: ["Стоматолог", "Фармацевт", "Ҷарроҳ"],
    advice: "Тиб роҳи дароз аст, аммо натиҷааш зиндагии одамонро наҷот медиҳад.",
    riasecProfile: { realistic: 7, investigative: 9, artistic: 3, social: 8, enterprising: 4, conventional: 6 },
  },
  {
    id: "car5", name: "Ҳуқуқшинос", description: "Ҳимояи ҳуқуқҳои шаҳрвандон ва мушовираи ҳуқуқӣ.",
    purpose: "Ҳуқуқшинос барои адолат мубориза мебарад ва ба одамон дар масъалаҳои қонунӣ кӯмак мерасонад.",
    clusterId: "cl4", cluster: { id: "cl4", clusterName: "Ҷомеашиносӣ ва ҳуқуқ" },
    skills: { technical: ["Қонунгузорӣ", "Таҳлили ҳуҷҷатҳо", "Суд", "Созишнома"], soft: ["Нутқи пуртаъсир", "Таҳлилгарӣ", "Стрессбардошӣ"] },
    technologies: ["Системаи қонунгузорӣ", "Базаи маълумоти ҳуқуқӣ"],
    salary: { junior: "$300-500", mid: "$700-1200", senior: "$1500-3500" },
    roadmap: [{ step: 1, title: "Асосҳои ҳуқуқ", duration: "2 сол" }, { step: 2, title: "Ихтисосгирӣ", duration: "2 сол" }, { step: 3, title: "Амалия", duration: "1 сол" }],
    certifications: ["Дипломи ҳуқуқшиносӣ", "Иҷозатнома"],
    universities: ["ДМТ", "ДДҲБСТ"],
    likesCount: 30, savedCount: 20, degreeType: "Магистр", durationYears: 5, careerCount: 3,
    projectExamples: ["Мушовираи ҳуқуқӣ", "Парвандаи судӣ"],
    opportunities: ["Адвокат", "Ҳуқуқшиноси корпоративӣ", "Нотариус"],
    relatedSpecializations: ["Сиёсатшинос", "Дипломат", "Менеҷер"],
    advice: "Қонунро хуб донед ва ҳамеша омода бошед, ки барои адолат мубориза баред.",
    riasecProfile: { realistic: 3, investigative: 7, artistic: 4, social: 7, enterprising: 8, conventional: 6 },
  },
  {
    id: "car6", name: "Маркетолог", description: "Таҳлили бозор, стратегияи маркетинг ва таблиғот барои бренд.",
    purpose: "Маркетолог ба ширкат кӯмак мекунад маҳсулоташро ба мизоҷон бирасонад.",
    clusterId: "cl2", cluster: { id: "cl2", clusterName: "Иқтисод ва география" },
    skills: { technical: ["Google Analytics", "SEO", "SMM", "Content Marketing"], soft: ["Эҷодкорӣ", "Стратегия", "Коммуникатсия"] },
    technologies: ["Google Ads", "Meta Ads", "HubSpot", "Canva"],
    salary: { junior: "$250-450", mid: "$600-1000", senior: "$1200-2500" },
    roadmap: [{ step: 1, title: "Асосҳои маркетинг", duration: "2 моҳ" }, { step: 2, title: "Digital Marketing", duration: "4 моҳ" }, { step: 3, title: "Амалия", duration: "3 моҳ" }],
    certifications: ["Google Digital Marketing", "HubSpot Inbound"],
    universities: ["ДМТ", "ДДСТ"],
    likesCount: 28, savedCount: 14, degreeType: "Бакалавр", durationYears: 4, careerCount: 3,
    projectExamples: ["Кампании рекламавӣ", "Стратегияи бренд"],
    opportunities: ["Маркетолог дар ширкат", "SMM менеҷер", "Маслиҳатгар"],
    relatedSpecializations: ["PR менеҷер", "Контент менеҷер", "Брендинг"],
    advice: "Бозори Тоҷикистон имконоти зиёд дорад. Маркетинги рақамиро хуб омӯзед.",
    riasecProfile: { realistic: 3, investigative: 5, artistic: 7, social: 7, enterprising: 9, conventional: 4 },
  },
  {
    id: "car7", name: "Муаллим (Педагог)", description: "Таълим ва тарбияи насли наврас дар муассисаҳои таълимӣ.",
    purpose: "Муаллим оянда месозад тавассути тарбия ва таълим додани кӯдакон.",
    clusterId: "cl3", cluster: { id: "cl3", clusterName: "Филология ва санъат" },
    skills: { technical: ["Методикаи таълим", "Психологияи кӯдак", "Барномаи дарсӣ"], soft: ["Сабр", "Коммуникатсия", "Раҳбарият"] },
    technologies: ["PowerPoint", "Google Classroom", "Zoom"],
    salary: { junior: "$150-300", mid: "$400-700", senior: "$800-1500" },
    roadmap: [{ step: 1, title: "Педагогика", duration: "2 сол" }, { step: 2, title: "Амалия", duration: "1 сол" }, { step: 3, title: "Ихтисосгирӣ", duration: "1 сол" }],
    certifications: ["Дипломи педагогӣ"],
    universities: ["ДМТ", "ДДПТ (Педагогии Тоҷикистон)"],
    likesCount: 19, savedCount: 11, degreeType: "Бакалавр", durationYears: 4, careerCount: 2,
    projectExamples: ["Барномаи таълимӣ", "Лоиҳаи иҷтимоӣ"],
    opportunities: ["Муаллими мактаб", "Устоди донишгоҳ", "Тренер"],
    relatedSpecializations: ["Психолог", "Тарҷумон", "Рӯзноманигор"],
    advice: "Таълим касби шарифтарин аст. Ба ҳар донишҷӯ бовар дошта бошед.",
    riasecProfile: { realistic: 4, investigative: 5, artistic: 6, social: 9, enterprising: 5, conventional: 5 },
  },
  {
    id: "car8", name: "Муҳандиси шабакаҳои компютерӣ", description: "Тарроҳӣ, насб ва идоракунии шабакаҳои компютерӣ ва амнияти кибернетикӣ.",
    purpose: "Муҳандис шабакаҳои боэътимод месозад, ки ташкилотҳо тавассути онҳо кор мекунанд.",
    clusterId: "cl1", cluster: { id: "cl1", clusterName: "Табиӣ-техникӣ" },
    skills: { technical: ["Cisco", "Linux", "Firewall", "TCP/IP", "Cloud"], soft: ["Ҳалли масъала", "Диққат", "Кор дар гурӯҳ"] },
    technologies: ["Cisco", "AWS", "Azure", "Wireshark"],
    salary: { junior: "$350-550", mid: "$700-1300", senior: "$1500-3000" },
    roadmap: [{ step: 1, title: "Асосҳои шабака", duration: "3 моҳ" }, { step: 2, title: "Cisco/Linux", duration: "6 моҳ" }, { step: 3, title: "Амнияти кибернетикӣ", duration: "4 моҳ" }],
    certifications: ["CCNA", "CompTIA Network+", "AWS Solutions Architect"],
    universities: ["ДТТ", "ДМТ"],
    likesCount: 31, savedCount: 17, degreeType: "Бакалавр", durationYears: 4, careerCount: 3,
    projectExamples: ["Шабакаи корпоративӣ", "Системаи амният"],
    opportunities: ["Муҳандиси шабака", "DevOps Engineer", "Кибер-амният"],
    relatedSpecializations: ["Барномасоз", "Кибер-амният", "Cloud Engineer"],
    advice: "Сертификатҳои Cisco ва AWS арзиши хеле баланд доранд дар бозори кор.",
    riasecProfile: { realistic: 8, investigative: 7, artistic: 2, social: 3, enterprising: 4, conventional: 8 },
  },
];

// ── Universities ──
const DEFAULT_UNIVERSITIES = [
  {
    id: "uni1", name: "Донишгоҳи миллии Тоҷикистон (ДМТ)", description: "Донишгоҳи бузургтарин ва маъруфтарини Тоҷикистон.",
    city: "Душанбе", type: "Давлатӣ", coordinates: [38.5598, 68.7740],
    logo: null, specialtiesCount: 45, website: "https://dmt.tj",
  },
  {
    id: "uni2", name: "Донишгоҳи техникии Тоҷикистон (ДТТ)", description: "Марказ барои тайёр кардани мутахассисони техникӣ ва муҳандисӣ.",
    city: "Душанбе", type: "Давлатӣ", coordinates: [38.5565, 68.7870],
    logo: null, specialtiesCount: 32, website: "https://dtt.tj",
  },
  {
    id: "uni3", name: "Донишгоҳи давлатии тиббии Тоҷикистон (ДДТТ)", description: "Донишгоҳи пешбари тиббӣ барои тайёр кардани духтурон.",
    city: "Душанбе", type: "Давлатӣ", coordinates: [38.5501, 68.7960],
    logo: null, specialtiesCount: 18, website: "https://tajmedun.tj",
  },
  {
    id: "uni4", name: "Донишгоҳи давлатии савдои Тоҷикистон (ДДСТ)", description: "Ихтисосгирӣ дар соҳаи иқтисод, молия ва савдо.",
    city: "Душанбе", type: "Давлатӣ", coordinates: [38.5632, 68.7680],
    logo: null, specialtiesCount: 22, website: "https://ddst.tj",
  },
  {
    id: "uni5", name: "Донишгоҳи давлатии Хуҷанд (ДДХ)", description: "Донишгоҳи асосӣ дар вилояти Суғд.",
    city: "Хуҷанд", type: "Давлатӣ", coordinates: [40.2826, 69.6220],
    logo: null, specialtiesCount: 28, website: "https://hgu.tj",
  },
];

// ── Demo users ──
const DEFAULT_USERS = [
  {
    id: "user1", name: "Фирдавс Раҳимов", email: "demo@mycareer.tj", password: "demo123",
    role: "user", quizResults: null, likedCareers: [], savedCareers: [], createdAt: "2025-01-15",
  },
  {
    id: "admin1", name: "Админ", email: "admin@mycareer.tj", password: "admin123",
    role: "admin", quizResults: null, likedCareers: [], savedCareers: [], createdAt: "2025-01-01",
  },
];

// ── Helper: get or init from localStorage ──
function getStore(key, defaults) {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch (_) { /* ignore */ }
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults;
}

function setStore(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// ── Public API ──
export function getMockClusters() { return getStore(LS_KEYS.clusters, DEFAULT_CLUSTERS); }
export function getMockCareers() { return getStore(LS_KEYS.careers, DEFAULT_CAREERS); }
export function getMockUniversities() { return getStore(LS_KEYS.universities, DEFAULT_UNIVERSITIES); }
export function getMockUsers() { return getStore(LS_KEYS.users, DEFAULT_USERS); }
export function getMockAppointments() { return getStore(LS_KEYS.appointments, []); }

export function saveMockClusters(data) { setStore(LS_KEYS.clusters, data); }
export function saveMockCareers(data) { setStore(LS_KEYS.careers, data); }
export function saveMockUniversities(data) { setStore(LS_KEYS.universities, data); }
export function saveMockUsers(data) { setStore(LS_KEYS.users, data); }
export function saveMockAppointments(data) { setStore(LS_KEYS.appointments, data); }

export { DEFAULT_CLUSTERS, DEFAULT_CAREERS, DEFAULT_UNIVERSITIES, DEFAULT_USERS };
