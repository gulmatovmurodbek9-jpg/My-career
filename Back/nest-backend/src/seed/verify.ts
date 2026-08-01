/**
 * Offline sanity check of the parsed NTC data and the content layer — runs
 * without a database.
 *
 *   npm run seed:verify
 */
import { parseNtcData } from './parse-ntc';
import { resolveCity, resolveInstitutionType, isStateOwned, SETTLEMENTS } from './university-cities';
import { CAREER_CONTENT } from './content';
import { FAMILIES, matchFamilyKey, resolveFamily } from './content/families';

function main(): void {
    const data = parseNtcData();

    console.log('=== PARSE ===');
    console.log('raw rows      :', data.stats.rawRows);
    console.log('usable rows   :', data.stats.usableRows);
    console.log('repaired      :', data.stats.repairedValues);
    console.log('clusters      :', data.clusters.length);
    console.log('universities  :', data.universities.length);
    console.log('careers       :', data.careers.length);
    console.log('offerings     :', data.offerings.length);

    const corrupt = [
        ...data.careers.filter((c) => c.name.includes('�')).map((c) => `career ${c.code} ${c.name}`),
        ...data.universities.filter((u) => u.name.includes('�')).map((u) => `university ${u.name}`),
    ];
    console.log('corrupt values:', corrupt.length);
    corrupt.forEach((c) => console.log('   !', c));

    console.log('\n=== CITIES ===');
    const unresolved: string[] = [];
    const byCity = new Map<string, number>();
    for (const university of data.universities) {
        const city = resolveCity(university.name);
        if (!city) {
            unresolved.push(university.name);
            continue;
        }
        byCity.set(city, (byCity.get(city) ?? 0) + 1);
    }
    console.log('resolved      :', data.universities.length - unresolved.length, '/', data.universities.length);
    unresolved.forEach((name) => console.log('   ??? ', name));

    console.log('\n=== TYPES ===');
    const byType = new Map<string, number>();
    let privateCount = 0;
    for (const university of data.universities) {
        const type = resolveInstitutionType(university.name);
        byType.set(type, (byType.get(type) ?? 0) + 1);
        if (!isStateOwned(university.name)) privateCount += 1;
    }
    [...byType.entries()].forEach(([type, count]) => console.log(`  ${String(count).padStart(3)}  ${type}`));
    console.log(`  ${String(privateCount).padStart(3)}  ғайридавлатӣ`);

    console.log('\n=== CAREERS PER CLUSTER ===');
    const byCluster = new Map<number, number>();
    data.careers.forEach((c) => byCluster.set(c.clusterNumber, (byCluster.get(c.clusterNumber) ?? 0) + 1));
    data.clusters.forEach((cluster) => {
        console.log(`  ${cluster.clusterNumber}. ${cluster.clusterName}: ${byCluster.get(cluster.clusterNumber) ?? 0}`);
    });

    console.log('\n=== TUITION ===');
    const paid = data.offerings.filter((o) => o.tuitionFee !== null).map((o) => o.tuitionFee as number);
    console.log('paid offerings:', paid.length, '| free offerings:', data.offerings.length - paid.length);
    console.log('min / max fee :', Math.min(...paid), '/', Math.max(...paid));

    console.log('\n=== CONTENT ===');
    const validCodes = new Set(data.careers.map((c) => c.code));
    const orphanCodes = [...CAREER_CONTENT.keys()].filter((code) => !validCodes.has(code));
    const writtenPerCluster = new Map<number, number>();
    for (const career of data.careers) {
        if (!CAREER_CONTENT.has(career.code)) continue;
        writtenPerCluster.set(career.clusterNumber, (writtenPerCluster.get(career.clusterNumber) ?? 0) + 1);
    }
    console.log(`дастнавис     : ${CAREER_CONTENT.size} / ${data.careers.length}`);
    data.clusters.forEach((cluster) => {
        const total = data.careers.filter((c) => c.clusterNumber === cluster.clusterNumber).length;
        console.log(`  кластер ${cluster.clusterNumber}: ${writtenPerCluster.get(cluster.clusterNumber) ?? 0} / ${total}`);
    });
    if (orphanCodes.length) {
        console.log('  кодҳои НОДУРУСТ (дар маълумоти МНТ нестанд):');
        orphanCodes.forEach((code) => console.log('   !', code));
    }

    // Every specialty must match a family keyword. One that does not falls back
    // to the cluster default, which reads generic — those are listed to be fixed.
    console.log('\n=== FAMILIES ===');
    const perFamily = new Map<string, number>();
    const unmatched: string[] = [];
    const familyNameOf = (family: unknown) =>
        Object.keys(FAMILIES).find((key) => FAMILIES[key] === family) ?? '?';

    for (const career of data.careers) {
        const matched = matchFamilyKey(career.name);
        const key = matched ?? familyNameOf(resolveFamily(career.name, career.clusterNumber));
        perFamily.set(key, (perFamily.get(key) ?? 0) + 1);
        if (!matched) unmatched.push(career.name);
    }

    console.log(`оилаҳо        : ${perFamily.size} / ${Object.keys(FAMILIES).length} истифода шуд`);
    console.log(`мувофиқат     : ${data.careers.length - unmatched.length} / ${data.careers.length}`);
    [...perFamily.entries()]
        .sort((a, b) => b[1] - a[1])
        .forEach(([key, count]) => console.log(`  ${String(count).padStart(4)}  ${key}`));

    if (unmatched.length) {
        console.log(`\nБе оилаи мушаххас (${unmatched.length}) — ба PROBES илова кунед:`);
        [...new Set(unmatched)].forEach((name) => console.log('   ?', name));
    }

    const problems = unresolved.length + corrupt.length + orphanCodes.length + unmatched.length;
    console.log(problems === 0 ? '\nOK — ҳамаи 884 ихтисос маълумоти мушаххас доранд.' : `\n${problems} мушкил ҳал нашуд.`);
    process.exit(problems === 0 ? 0 : 1);
}

main();
