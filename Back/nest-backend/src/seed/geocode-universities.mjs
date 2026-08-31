/**
 * Координата ва суроғаи донишгоҳҳоро аз OpenStreetMap меҷӯяд.
 *
 * Чаро лозим аст: ҷадвали ММТ на суроға дорад, на координата. Файли
 * university-cities.ts танҳо маркази шаҳрҳоро медонад, аз ин рӯ 32 донишгоҳи
 * Душанбе як нуқтаро мегиранд ва дар харита рӯи ҳам меафтанд, ва 47 муассиса
 * умуман координата надоранд.
 *
 * Натиҷа ба ҷои база ба файли JSON навишта мешавад: ҳар як мувофиқат бояд
 * пеш аз истифода аз ҷониби одам тафтиш шавад. Ҷустуҷӯи худкор метавонад
 * донишгоҳро бо мактаби ҳамном омехта кунад, ва координатаи нодуруст аз
 * набудани координата бадтар аст.
 *
 * Қоидаҳои Nominatim риоя мешаванд: як дархост дар як сония ва User-Agent-и
 * воқеӣ бо роҳи тамос.
 *
 * Иҷро:  node src/seed/geocode-universities.mjs [шумораи донишгоҳҳо]
 */
import { writeFileSync } from "node:fs";

const API = process.env.API_URL ?? "http://localhost:3005/api";
const UA = "ikhtisosiman.qobus.tj (career guidance for Tajikistan; gulmatovmurodbek7@gmail.com)";
const LIMIT = Number(process.argv[2]) || Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Танҳо ҷойҳое, ки OSM ҳамчун ҷои таълим шинохтааст. */
const EDUCATIONAL = new Set(["college", "university", "school", "educational_institution"]);

async function search(query) {
  const url =
    "https://nominatim.openstreetmap.org/search" +
    `?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=tj&addressdetails=1`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const [hit] = await res.json();
  return hit ?? null;
}

const universities = await fetch(`${API}/universities?limit=500`)
  .then((r) => r.json())
  .then((d) => (Array.isArray(d) ? d : d.data ?? []));

console.log(`донишгоҳҳо: ${universities.length}, коркард мешавад: ${Math.min(LIMIT, universities.length)}\n`);

const results = [];
let found = 0;

/**
 * Вариантҳои ҷустуҷӯ, аз дақиқтарин то васеътарин.
 *
 * Иловаи «ба номи ...» аксаран монеъ мешавад: дар OSM муассиса бо номи кӯтоҳ
 * сабт шудааст ё шакли дигари номи шахс истифода мешавад. Бурида партофтани он
 * якчанд донишгоҳи калонро ёфт — аз ҷумла аграрӣ ва Хоруғ.
 */
function queryVariants(uni) {
  const short = uni.name.replace(/\s+ба номи.*$/i, "").trim();
  const variants = [uni.name];
  if (short && short !== uni.name) variants.push(short);
  if (uni.city) variants.push(`${short || uni.name}, ${uni.city}`);
  return variants;
}

/**
 * Ҷавоб бояд дар ҳамон шаҳре бошад, ки база мегӯяд.
 *
 * Бе ин санҷиш дархости кӯтоҳшуда хатарнок мешавад: «Коллеҷи омӯзгории ба номи
 * М. Турсунзодаи шаҳри Конибодом» баъди буридани «ба номи…» ба «Коллеҷи
 * омӯзгорӣ» табдил меёбад, ва OSM аввалин ҳамномро — коллеҷи Кӯлоб, 269 км
 * дуртар — бармегардонад. Ду мувофиқати нодуруст маҳз чунин пайдо шуданд.
 */
function matchesCity(hit, city) {
  if (!city) return true;
  const haystack = (hit.display_name ?? "").toLowerCase();
  // Номи шаҳр метавонад бо пасванд ояд («Хуҷанд» ↔ «Шаҳри Хуҷанд»), аз ин рӯ
  // танҳо решаи он муқоиса мешавад.
  const stem = city.toLowerCase().slice(0, Math.max(4, city.length - 2));
  return haystack.includes(stem);
}

for (const uni of universities.slice(0, LIMIT)) {
  let hit = null;
  for (const query of queryVariants(uni)) {
    const candidate = await search(query);
    await sleep(1100);
    if (candidate && matchesCity(candidate, uni.city)) {
      hit = candidate;
      break;
    }
  }

  const type = hit?.type ?? hit?.class ?? "";
  const looksEducational = EDUCATIONAL.has(type) || EDUCATIONAL.has(hit?.class);

  results.push({
    id: uni.id,
    name: uni.name,
    city: uni.city,
    oldLat: uni.latitude,
    oldLng: uni.longitude,
    osm: hit
      ? {
          lat: Number(hit.lat),
          lng: Number(hit.lon),
          address: hit.display_name,
          type,
          educational: looksEducational,
        }
      : null,
  });

  if (hit) found++;
  const mark = hit ? (looksEducational ? "✔" : "~") : "✘";
  console.log(`${mark} ${uni.name.slice(0, 58)}`);
  if (hit) console.log(`    ${hit.display_name.slice(0, 90)}`);
}

writeFileSync("geocode-results.json", JSON.stringify(results, null, 2));

console.log(`\nёфт шуд: ${found}/${results.length}`);
console.log(`✔ = ҷои таълим,  ~ = ёфт шуд, вале навъаш дигар (тафтиш лозим),  ✘ = наёфт`);
console.log("→ geocode-results.json навишта шуд");
