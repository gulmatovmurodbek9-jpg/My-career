import 'clusters.dart';
import 'i18n.dart';

// Маълумоти ёрирасон барои саҳифаи ихтисос — ҳамон қоидаҳои сайт
// (Front/src/lib: salarySectors.js, resourceLinks.js, resourceFilters.js).

String clusterTitle(int? number, String fallback) {
  for (final c in clusters) {
    if (c.number == number) return c.title;
  }
  return fallback;
}

// Рӯзона, русӣ ва ғайра аз сервер бо тоҷикӣ меоянд.
String offerLabel(String value) {
  switch (value.trim().toLowerCase()) {
    case 'рӯзона':
      return t('рӯзона');
    case 'шабона':
      return t('шабона');
    case 'ғоибона':
      return t('ғоибона');
    case 'фосилавӣ':
      return t('фосилавӣ');
    case 'тоҷикӣ':
      return t('тоҷикӣ');
    case 'русӣ':
      return t('русӣ');
    case 'англисӣ':
      return t('англисӣ');
    case 'ӯзбекӣ':
      return t('ӯзбекӣ');
    case 'бакалавр':
      return t('Бакалавр');
    case 'миёнаи касбӣ':
      return t('Миёнаи касбӣ');
  }
  return value;
}

// --- Маош: миёнаи соҳа аз Агентии омор (июни 2026) ---

const nationalAverageSalary = 3800;
const minimumWage = 1000;

class SectorInfo {
  const SectorInfo(this.label, this.amount);
  final String label;
  final int amount;
}

SectorInfo _sector(String key) {
  switch (key) {
    case 'finance':
      return SectorInfo(t('Молия ва суғурта'), 8300);
    case 'it':
      return SectorInfo(t('Иттилоот ва алоқа'), 7000);
    case 'energy':
      return SectorInfo(t('Энергетика'), 5700);
    case 'mining':
      return SectorInfo(t('Саноати кӯҳӣ'), 5300);
    case 'education':
      return SectorInfo(t('Маориф'), 4400);
    case 'construction':
      return SectorInfo(t('Сохтмон'), 4000);
    case 'transport':
      return SectorInfo(t('Нақлиёт ва анборпарварӣ'), 3700);
    case 'manufacturing':
      return SectorInfo(t('Саноати коркард'), 3300);
    case 'services':
      return SectorInfo(t('Хизматрасонӣ'), 3200);
    case 'publicAdmin':
      return SectorInfo(t('Идораи давлатӣ'), 2779);
    case 'realEstate':
      return SectorInfo(t('Амволи ғайриманқул'), 2500);
    case 'health':
      return SectorInfo(t('Тандурустӣ'), 2400);
    case 'water':
      return SectorInfo(t('Обтаъминкунӣ ва партовҳо'), 2000);
    default:
      return SectorInfo(t('Кишоварзӣ ва ҷангалпарварӣ'), 1388);
  }
}

const _sectorWords = <(String, String)>[
  ('барномасоз|информатика|компютер|технологияи итти|киберамният|шабака|барнома', 'it'),
  ('муҳосиб|молия|бонк|суғурта|андоз|аудит|қарз|буҷа', 'finance'),
  ('энергетик|барқ|нерӯгоҳ|гидроэнерг', 'energy'),
  ('кӯҳӣ|маъдан|геолог|нафт|газ|кон', 'mining'),
  ('сохтмон|меъмор|биноко|роҳсоз|архитект', 'construction'),
  ('нақлиёт|логистик|роҳи оҳан|автомобил|ҳавонавард', 'transport'),
  ('тиб|духтур|ҳамшира|дорусоз|стоматолог|педиатр|фарматс|санитар|биолог', 'health'),
  ('омӯзгор|педагог|муаллим|таълим|мактаб|тарбия|методик', 'education'),
  ('кишоварз|агроном|зооте|ҷангал|чорво|заминсоз|обёр', 'agriculture'),
  ('об ва |обтаъмин|партов|экология|муҳити зист', 'water'),
  ('ҳуқуқ|адлия|прокурор|суд|милитсия|гумрук|давлат|идораи', 'publicAdmin'),
  ('меҳмонхона|туризм|сайёҳ|хизматрасон|тарабхона|савдо', 'services'),
  ('амволи ғайриманқул|кадастр', 'realEstate'),
  ('саноат|технолог|мошинсоз|коркард|нассоҷ|хӯрокворӣ', 'manufacturing'),
];

const _sectorByCluster = {1: 'manufacturing', 2: 'finance', 3: 'education', 4: 'publicAdmin', 5: 'health'};

// nameTj — номи тоҷикии ихтисос: калимаҳои калидӣ бо тоҷикӣ навишта шудаанд.
SectorInfo? sectorFor(String nameTj, int? clusterNumber) {
  for (final (pattern, key) in _sectorWords) {
    if (RegExp(pattern, caseSensitive: false, unicode: true).hasMatch(nameTj)) return _sector(key);
  }
  final key = _sectorByCluster[clusterNumber];
  return key == null ? null : _sector(key);
}

// --- Сертификатҳо: аз куҷо мегиранд ---

class CertInfo {
  const CertInfo(this.name, this.where, this.url);
  final String name;
  final String where;
  final String url;
}

// Танҳо созмонҳои расмии маълум. Барои дигарон созмони мушаххас намебофем.
const _certIssuers = <(String, String, String)>[
  (r'ielts', 'IELTS: British Council, IDP · TOEFL: ETS', 'https://ielts.org/'),
  (r'toefl', 'ETS', 'https://www.ets.org/toefl.html'),
  (r'celta', 'Cambridge English', 'https://www.cambridgeenglish.org/teaching-english/teaching-qualifications/celta/'),
  (r'1[сc]', '1С', 'https://1c.ru/'),
  (r'microsoft|azure|power bi', 'Microsoft', 'https://learn.microsoft.com/credentials/'),
  (r'itil', 'PeopleCert', 'https://www.peoplecert.org/'),
  (r'google certified educator', 'Google for Education', 'https://edu.google.com/'),
  (r'google ads', 'Google Skillshop', 'https://skillshop.withgoogle.com/'),
  (r'google professional cloud', 'Google Cloud', 'https://cloud.google.com/learn/certification'),
  (r'google', 'Google · Coursera', 'https://grow.google/certificates/'),
  (r'acca', 'ACCA', 'https://www.accaglobal.com/'),
  (r'\bcfa\b', 'CFA Institute', 'https://www.cfainstitute.org/'),
  (r'cisco', 'Cisco', 'https://www.cisco.com/site/us/en/learn/training-certifications/'),
  (r'solidworks', 'Dassault Systèmes', 'https://www.solidworks.com/certifications'),
  (r'autodesk|autocad', 'Autodesk', 'https://www.autodesk.com/certification/'),
  (r'\bpmp\b', 'PMI', 'https://www.pmi.org/certifications/project-management-pmp'),
  (r'adobe', 'Adobe', 'https://certifiedprofessional.adobe.com/'),
  (r'huawei', 'Huawei', 'https://e.huawei.com/en/talent/'),
  (r'comptia', 'CompTIA', 'https://www.comptia.org/certifications'),
  (r'mikrotik', 'MikroTik', 'https://mikrotik.com/training/'),
  (r'\baws\b', 'Amazon Web Services', 'https://aws.amazon.com/certification/'),
  (r'siemens', 'Siemens SITRAIN', 'https://www.siemens.com/sitrain'),
  (r'\bmeta\b', 'Meta Blueprint', 'https://www.facebook.com/business/learn/certification'),
  (r'\bceh\b', 'EC-Council', 'https://www.eccouncil.org/'),
  (r'nebosh', 'NEBOSH', 'https://www.nebosh.org.uk/'),
  (r'oracle', 'Oracle', 'https://education.oracle.com/'),
  (r'ieee', 'IEEE', 'https://www.ieee.org/'),
  (r'\biso\b', 'ISO', 'https://www.iso.org/'),
];

// TensorFlow-ро Google соли 2024 баст; CISSP ва OSCP таҷрибаи солҳо мехоҳанд (мисли сайт).
final _deadCerts = RegExp(r'tensorflow developer certificate|\bcissp\b|\boscp\b', caseSensitive: false);

// Дар пойгоҳ баъзе номҳо аз вергул канда шудаанд: «… (IELTS» ва « TOEFL)».
List<String> usefulCertificates(List<String> list) {
  final out = <String>[];
  for (final raw in list) {
    final name = raw.replaceAll(RegExp(r'^[\s(]+|[\s)]+$'), '').trim();
    if (name.isEmpty || _deadCerts.hasMatch(name) || name == 'TOEFL') continue;
    final fixed = name.startsWith('Сертификати забонҳои хориҷӣ') ? 'IELTS / TOEFL' : name;
    if (!out.contains(fixed)) out.add(fixed);
  }
  return out;
}

String _searchUrl(String query) => 'https://www.google.com/search?q=${Uri.encodeQueryComponent(query)}';

CertInfo certInfo(String name) {
  for (final (pattern, issuer, url) in _certIssuers) {
    if (RegExp(pattern, caseSensitive: false, unicode: true).hasMatch(name)) return CertInfo(name, issuer, url);
  }
  final lower = name.toLowerCase();
  final String where;
  if (lower.startsWith('иҷозатнома')) {
    where = t('Мақомоти давлатии ҳамин соҳа дар Тоҷикистон медиҳад');
  } else if (lower.startsWith('аттестатсия') || lower.startsWith('категория') || lower.startsWith('гурӯҳи бехатарии')) {
    where = t('Мақомоти соҳа ё корфармо бо имтиҳон медиҳад');
  } else if (lower.startsWith('курс')) {
    where = t('Дар марказҳои таълимӣ ва такмили ихтисос');
  } else if (lower.startsWith('разряд')) {
    where = t('Корфармо ё маркази касбомӯзӣ бо санҷиш медиҳад');
  } else if (lower.startsWith('дараҷаи илмӣ') || lower.startsWith('дараҷаи илмии')) {
    where = t('Баъди аспирантура ва ҳимояи рисола');
  } else {
    where = t('Дар марказҳои такмили ихтисос ё муассисаҳои соҳа');
  }
  return CertInfo(name, where, _searchUrl(name));
}

// --- Манбаъҳои омӯзишӣ ---

const _platforms = <(String, String)>[
  (r'freecodecamp', 'https://www.freecodecamp.org/'),
  (r'\bcs50\b', 'https://cs50.harvard.edu/'),
  (r'odin project', 'https://www.theodinproject.com/'),
  (r'\bstepik\b', 'https://stepik.org/'),
  (r'\bcoursera\b', 'https://www.coursera.org/'),
  (r'\bedx\b', 'https://www.edx.org/'),
  (r'\budemy\b', 'https://www.udemy.com/'),
  (r'khan academy', 'https://www.khanacademy.org/'),
  (r'sololearn', 'https://www.sololearn.com/'),
  (r'mdn web docs|\bmdn\b', 'https://developer.mozilla.org/'),
  (r'stack overflow', 'https://stackoverflow.com/'),
  (r'\bgithub\b', 'https://github.com/'),
  (r'\bdev\.to\b', 'https://dev.to/'),
  (r'\bhabr\b', 'https://habr.com/'),
  (r'\bkaggle\b', 'https://www.kaggle.com/'),
  (r'investopedia', 'https://www.investopedia.com/'),
  (r'\bw3schools\b', 'https://www.w3schools.com/'),
  (r'\bfigma\b', 'https://www.figma.com/'),
  (r'\bcanva\b', 'https://www.canva.com/'),
  (r'\bduolingo\b', 'https://www.duolingo.com/'),
  (r'\bpubmed\b', 'https://pubmed.ncbi.nlm.nih.gov/'),
  (r'\bbmj\b', 'https://www.bmj.com/'),
  (r'бонки миллии тоҷикистон|nbt\.tj', 'https://nbt.tj/'),
  (r'вазорати маориф', 'https://maorif.tj/'),
  (r'\bandroid developers\b', 'https://developer.android.com/'),
  (r'\bnptel\b', 'https://nptel.ac.in/'),
];

String resourceUrl(String name) {
  for (final (pattern, url) in _platforms) {
    if (RegExp(pattern, caseSensitive: false, unicode: true).hasMatch(name)) return url;
  }
  if (RegExp(r'1[сc]', caseSensitive: false, unicode: true).hasMatch(name)) return 'https://1c.ru/';
  return _searchUrl(name);
}

// «Китоб» танҳо вақте китоб аст, ки муаллиф ё номи маълум дорад; боқӣ — «мавзӯъ барои хондан».
bool isRealBook(String item) {
  final known = RegExp(
    r"pmbok guide|фейнмановские лекции|introduction to statistical learning|web application hacker'?s handbook|кодексҳои ҷумҳурии тоҷикистон",
    caseSensitive: false,
    unicode: true,
  ).hasMatch(item);
  if (known) return true;
  final parts = item.split(RegExp(r'\s[—-]\s'));
  if (parts.length < 2) return false;
  return !RegExp(r'^(учебник|дастур|практическое пособие|пособие)', caseSensitive: false, unicode: true).hasMatch(parts[1].trim());
}
