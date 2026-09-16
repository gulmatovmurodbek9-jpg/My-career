
export const SALARY_SOURCE = {
  agencyKey: "sectors.agency",
  periodKey: "sectors.period",
  nationalAverage: 3800,
  minimumWage: 1000,
};

export const SECTORS = {
  finance: { labelKey: "sectors.finance", amount: 8300 },
  it: { labelKey: "sectors.it", amount: 7000 },
  energy: { labelKey: "sectors.energy", amount: 5700 },
  mining: { labelKey: "sectors.mining", amount: 5300 },
  education: { labelKey: "sectors.education", amount: 4400 },
  construction: { labelKey: "sectors.construction", amount: 4000 },
  transport: { labelKey: "sectors.transport", amount: 3700 },
  manufacturing: { labelKey: "sectors.manufacturing", amount: 3300 },
  services: { labelKey: "sectors.services", amount: 3200 },
  publicAdmin: { labelKey: "sectors.publicAdmin", amount: 2779 },
  realEstate: { labelKey: "sectors.realEstate", amount: 2500 },
  health: { labelKey: "sectors.health", amount: 2400 },
  water: { labelKey: "sectors.water", amount: 2000 },
  agriculture: { labelKey: "sectors.agriculture", amount: 1388 },
};

const KEYWORDS = [
  [/барномасоз|информатика|компютер|технологияи итти|киберамният|шабака|барнома/i, "it"],
  [/муҳосиб|молия|бонк|суғурта|андоз|аудит|қарз|буҷа/i, "finance"],
  [/энергетик|барқ|нерӯгоҳ|гидроэнерг/i, "energy"],
  [/кӯҳӣ|маъдан|геолог|нафт|газ|кон/i, "mining"],
  [/сохтмон|меъмор|биноко|роҳсоз|архитект/i, "construction"],
  [/нақлиёт|логистик|роҳи оҳан|автомобил|ҳавонавард/i, "transport"],
  [/тиб|духтур|ҳамшира|дорусоз|стоматолог|педиатр|фарматс|санитар|биолог/i, "health"],
  [/омӯзгор|педагог|муаллим|таълим|мактаб|тарбия|методик/i, "education"],
  [/кишоварз|агроном|зооте|ҷангал|чорво|заминсоз|обёр/i, "agriculture"],
  [/об ва |обтаъмин|партов|экология|муҳити зист/i, "water"],
  [/ҳуқуқ|адлия|прокурор|суд|милитсия|гумрук|давлат|идораи/i, "publicAdmin"],
  [/меҳмонхона|туризм|сайёҳ|хизматрасон|тарабхона|савдо/i, "services"],
  [/амволи ғайриманқул|кадастр/i, "realEstate"],
  [/саноат|технолог|мошинсоз|коркард|нассоҷ|хӯрокворӣ/i, "manufacturing"],
];

const BY_CLUSTER = {
  "Табиӣ ва техникӣ": "manufacturing",
  "Тиб, биология ва варзиш": "health",
  "Иқтисод ва география": "finance",
  "Ҷомеашиносӣ ва ҳуқуқ": "publicAdmin",
  "Филология, педагогика ва санъат": "education",
};

export function sectorFor(careerName, clusterName) {
  const hit = KEYWORDS.find(([pattern]) => pattern.test(careerName ?? ""));
  const key = hit ? hit[1] : BY_CLUSTER[clusterName];
  return key ? { key, ...SECTORS[key] } : null;
}
