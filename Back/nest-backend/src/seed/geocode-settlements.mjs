import { readFileSync, writeFileSync } from "node:fs";

const API = process.env.API_URL ?? "http://localhost:3005/api";
const UA = "IkhtisosiMan/1.0 (career guidance, Tajikistan)";

const REGION_BOX = {
  'Суғд': { minLat: 39.2, maxLat: 41.1, minLng: 67.3, maxLng: 71.5 },
  'Хатлон': { minLat: 36.6, maxLat: 38.7, minLng: 67.6, maxLng: 70.8 },
  'ВМКБ': { minLat: 36.6, maxLat: 39.5, minLng: 70.8, maxLng: 75.2 },
  'Ноҳияҳои тобеи ҷумҳурӣ': { minLat: 38.1, maxLat: 39.7, minLng: 68.2, maxLng: 72.2 },
  'Душанбе': { minLat: 38.4, maxLat: 38.7, minLng: 68.6, maxLng: 69.0 },
};

const COUNTRY = { minLat: 36.6, maxLat: 41.1, minLng: 67.3, maxLng: 75.2 };

const within = (lat, lng, box) =>
  lat >= box.minLat && lat <= box.maxLat && lng >= box.minLng && lng <= box.maxLng;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function variants(name) {
  return [
    `${name}, Тоҷикистон`,
    `ноҳияи ${name}, Тоҷикистон`,
    `${name} District, Tajikistan`,
    `${name}, Tajikistan`,
  ];
}

async function lookup(name, region) {
  const box = REGION_BOX[region] ?? COUNTRY;
  for (const query of variants(name)) {
    const url =
      "https://nominatim.openstreetmap.org/search?format=json&limit=5&countrycodes=tj&q=" +
      encodeURIComponent(query);

    let rows = [];
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      rows = await res.json();
    } catch {
      await sleep(1200);
      continue;
    }
    await sleep(1200);

    const hit = rows.find((row) => {
      const lat = Number(row.lat);
      const lng = Number(row.lon);
      if (!within(lat, lng, box)) return false;
      return ["place", "boundary"].includes(row.class);
    });

    if (hit) {
      return {
        lat: Number(Number(hit.lat).toFixed(4)),
        lng: Number(Number(hit.lon).toFixed(4)),
        matched: hit.display_name,
        type: `${hit.class}/${hit.type}`,
        query,
      };
    }
  }
  return null;
}

const REGIONS = Object.fromEntries(
  [...readFileSync(new URL("./university-cities.ts", import.meta.url), "utf8")
    .matchAll(/'([^']+)':\s*\{\s*region:\s*'([^']+)'/g)]
    .map((m) => [m[1], m[2]]),
);

const universities = await fetch(`${API}/universities?limit=500`)
  .then((r) => r.json())
  .then((d) => (Array.isArray(d) ? d : d.data ?? []));

const missing = [
  ...new Set(
    universities
      .filter((uni) => uni.latitude == null && uni.city)
      .map((uni) => uni.city),
  ),
];

console.log(`шаҳрҳои бе координата: ${missing.length}\n`);

const results = [];
for (const city of missing) {
  const found = await lookup(city, REGIONS[city]);
  const count = universities.filter((u) => u.city === city).length;
  results.push({ city, region: REGIONS[city] ?? null, universities: count, ...(found ?? { lat: null, lng: null }) });
  console.log(
    found
      ? `✔ ${city.padEnd(24)} ${found.lat}, ${found.lng}  (${found.type})`
      : `✘ ${city.padEnd(24)} ёфт нашуд`,
  );
}

writeFileSync("settlement-coords.json", JSON.stringify(results, null, 2));
const ok = results.filter((r) => r.lat !== null).length;
console.log(`\nёфт шуд: ${ok} / ${results.length}`);
console.log("→ settlement-coords.json навишта шуд");
