import { parseNtcData } from './parse-ntc';
import { resolveCity, SETTLEMENTS } from './university-cities';

function main(): void {
    const data = parseNtcData();

    const rows = data.universities
        .map((university) => ({ name: university.name, city: resolveCity(university.name) }))
        .sort((a, b) => (a.city ?? '').localeCompare(b.city ?? '') || a.name.localeCompare(b.name));

    let current = '';
    for (const row of rows) {
        const city = row.city ?? '??? НОМАЪЛУМ';
        if (city !== current) {
            const region = row.city ? SETTLEMENTS[row.city]?.region : '';
            console.log(`\n── ${city}${region ? ` (${region})` : ''} ──`);
            current = city;
        }
        console.log(`   ${row.name}`);
    }

    const missing = rows.filter((r) => !r.city).length;
    console.log(`\n${rows.length} муассиса, ${rows.length - missing} шаҳр гирифт, ${missing} номаълум`);
}

main();
