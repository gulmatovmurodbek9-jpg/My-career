import { writeFileSync } from "node:fs";

const API = process.env.API_URL ?? "http://localhost:3005/api";
const UA = "ikhtisosiman.qobus.tj (career guidance for Tajikistan; gulmatovmurodbek7@gmail.com)";
const LIMIT = Number(process.argv[2]) || Infinity;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

function queryVariants(uni) {
  const short = uni.name.replace(/\s+ба номи.*$/i, "").trim();
  const variants = [uni.name];
  if (short && short !== uni.name) variants.push(short);
  if (uni.city) variants.push(`${short || uni.name}, ${uni.city}`);
  return variants;
}

function matchesCity(hit, city) {
  if (!city) return true;
  const haystack = (hit.display_name ?? "").toLowerCase();
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
