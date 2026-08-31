/**
 * Донишгоҳҳои базаро бо муассисаҳои таълимии OpenStreetMap мувофиқ мекунад.
 *
 * Чаро на ҷустуҷӯи яктаяк: Nominatim барои ҳар ном алоҳида дархост мехоҳад,
 * як дархост дар як сония, ва танҳо 14% ёфт. Overpass якбора ҳамаи
 * муассисаҳои таълимии кишварро медиҳад, ва мувофиқкунӣ дар маҳал мешавад —
 * тезтар ва назарраси бештар.
 *
 * Photon санҷида шуд ва рад карда шуд: он ба ҳар дархост ҷавоб медиҳад, вале
 * бе нишони эътимод. «Донишгоҳи давлатии Данғара» → «тиббии Тоҷикистон»,
 * «Коллеҷи Турсунзода» → «Кӯлоб». Ҷои боэътимоди нодуруст аз набудани ҷой
 * хеле бадтар аст.
 *
 * Натиҷа ба JSON меравад, на ба база: ҳар мувофиқат бояд аз ҷониби одам
 * тафтиш шавад.
 *
 * Иҷро:
 *   node src/seed/match-osm-universities.mjs <osm.json>
 */
import { readFileSync, writeFileSync } from "node:fs";

const API = process.env.API_URL ?? "http://localhost:3005/api";
const OSM_FILE = process.argv[2];

if (!OSM_FILE) {
  console.error("Истифода: node match-osm-universities.mjs <osm.json>");
  process.exit(1);
}

/**
 * Имлоро ба як шакл меорад.
 *
 * OSM аксаран бо ҳарфҳои русӣ навишта шудааст («Донишгохи техникии
 * Точикистон»), база бошад бо тоҷикии дуруст («Донишгоҳи техникии
 * Тоҷикистон»). Бе ин мутобиқсозӣ ҳатто номҳои айнан якхела мувофиқ намешаванд.
 */
const FOLD = { ҳ: "х", ҷ: "ч", ӣ: "и", қ: "к", ӯ: "у", ғ: "г", ё: "е", й: "и" };

function normalize(text) {
  return (text ?? "")
    .toLowerCase()
    .replace(/[ҳҷӣқӯғёй]/g, (c) => FOLD[c] ?? c)
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

/** Калимаҳое, ки қариб дар ҳар ном ҳастанд ва мувофиқатро маънидор намекунанд. */
const NOISE = new Set([
  "донишгохи", "донишгох", "донишкадаи", "донишкада", "коллечи", "коллеч",
  "техникуми", "омузишгохи", "литсеи", "лицей", "филиали", "бинои", "корпуси",
  "давлатии", "давлати", "милли", "миллии", "точикистон", "точикистони",
  "ба", "номи", "шахри", "нохияи", "им", "ва", "дар",
  "университет", "институт", "колледж", "государственный", "таджикистана",
  "university", "institute", "college", "state", "national", "tajik", "tajikistan", "of",
]);

const tokens = (text) =>
  normalize(text).split(" ").filter((w) => w.length >= 3 && !NOISE.has(w));

/**
 * Баҳои мувофиқат: ҳиссаи калимаҳои маънодори муштарак.
 *
 * Ҳарду тараф ҳисоб мешаванд, то номи хеле кӯтоҳи OSM («ТГМУ») ба ҳар чиз
 * мувофиқ наояд.
 */
function score(dbName, osmName) {
  const a = new Set(tokens(dbName));
  const b = new Set(tokens(osmName));
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const word of a) if (b.has(word)) shared += 1;
  return (2 * shared) / (a.size + b.size);
}


/** Координатаи шаҳрҳо аз university-cities.ts — манбаи ягона. */
const CITY_COORDS = Object.fromEntries(
  [...readFileSync(new URL("./university-cities.ts", import.meta.url), "utf8")
    .matchAll(/'([^']+)':\s*\{[^}]*latitude:\s*([\d.]+)[^}]*longitude:\s*([\d.]+)/g)]
    .map((m) => [m[1], { lat: Number(m[2]), lng: Number(m[3]) }]),
);

const universities = await fetch(`${API}/universities?limit=500`)
  .then((r) => r.json())
  .then((d) => (Array.isArray(d) ? d : d.data ?? []));

const osm = JSON.parse(readFileSync(OSM_FILE, "utf8")).elements.filter((e) => e.tags);

const candidates = osm.map((element) => {
  const t = element.tags;
  return {
    names: [t.name, t["name:tg"], t["name:ru"], t["name:en"]].filter(Boolean),
    lat: element.lat ?? element.center?.lat,
    lng: element.lon ?? element.center?.lon,
    street: t["addr:street"],
    house: t["addr:housenumber"],
    city: t["addr:city"],
    website: t.website,
  };
});

const results = [];

for (const uni of universities) {
  let best = null;

  for (const candidate of candidates) {
    if (!candidate.lat || !candidate.lng) continue;
    // Беҳтарин баҳо аз ҳамаи забонҳои номи OSM.
    const rank = Math.max(...candidate.names.map((name) => score(uni.name, name)));
    if (!best || rank > best.rank) best = { candidate, rank };
  }

  // Шаҳр бояд мувофиқ бошад, агар OSM онро дошта бошад.
  const cityOk =
    !best?.candidate.city ||
    !uni.city ||
    normalize(best.candidate.city).includes(normalize(uni.city).slice(0, 4)) ||
    normalize(uni.city).includes(normalize(best.candidate.city).slice(0, 4));

  /**
   * Санҷиши масофа — ҳимояи асосӣ.
   *
   * Санҷиши ном танҳо кифоя нест: «Донишкадаи политехникии Донишгоҳи техникии
   * Тоҷикистон дар шаҳри Хуҷанд» бо номи донишгоҳи модарӣ дар Душанбе 0.75 баҳо
   * мегирад, ва OSM барои он `addr:city` надорад, аз ин рӯ санҷиши шаҳр
   * намегузарад. Натиҷа — филиали Хуҷанд дар харитаи Душанбе.
   *
   * Координата дурӯғ намегӯяд: агар нуқтаи OSM аз шаҳри худи муассиса дуртар
   * аз 30 км бошад, ин муассисаи дигар аст.
   */
  const anchor = CITY_COORDS[uni.city];
  let distanceKm = null;
  if (best && anchor) {
    const dLat = (best.candidate.lat - anchor.lat) * 111;
    const dLng = (best.candidate.lng - anchor.lng) * 111 * Math.cos((anchor.lat * Math.PI) / 180);
    distanceKm = Math.round(Math.hypot(dLat, dLng));
  }
  const tooFar = distanceKm !== null && distanceKm > 30;

  const confidence =
    !best || best.rank < 0.34
      ? "нест"
      : tooFar || !cityOk
        ? "шубҳанок"
        : best.rank >= 0.6
          ? "баланд"
          : "миёна";

  results.push({
    id: uni.id,
    name: uni.name,
    city: uni.city,
    confidence,
    rank: best ? Number(best.rank.toFixed(2)) : 0,
    osm:
      confidence === "нест"
        ? null
        : {
            name: best.candidate.names[0],
            lat: best.candidate.lat,
            lng: best.candidate.lng,
            address: [best.candidate.street, best.candidate.house, best.candidate.city]
              .filter(Boolean)
              .join(", ") || null,
            website: best.candidate.website ?? null,
          },
  });
}

writeFileSync("osm-matches.json", JSON.stringify(results, null, 2));

const by = (level) => results.filter((r) => r.confidence === level).length;
console.log(`донишгоҳҳо: ${results.length}`);
console.log(`  баланд   : ${by("баланд")}`);
console.log(`  миёна    : ${by("миёна")}   ← тафтиши одам лозим`);
console.log(`  шубҳанок : ${by("шубҳанок")}   ← шаҳр мувофиқ нест`);
console.log(`  нест     : ${by("нест")}`);
console.log(`\nбо суроғаи кӯча: ${results.filter((r) => r.osm?.address).length}`);
console.log("→ osm-matches.json навишта шуд");
