/**
 * Lists specialties of a cluster ordered by how many universities offer them,
 * so editorial content can be written for the most widely taught ones first.
 *
 *   npx ts-node --transpileOnly src/seed/list-careers.ts <cluster> [limit] [offset]
 */
import { parseNtcData } from './parse-ntc';
import { CAREER_CONTENT } from './content';

function main(): void {
    const clusterNumber = Number(process.argv[2] ?? 1);
    const limit = Number(process.argv[3] ?? 40);
    const offset = Number(process.argv[4] ?? 0);

    const data = parseNtcData();

    const offeringCount = new Map<string, number>();
    const feeByCode = new Map<string, number[]>();
    for (const offering of data.offerings) {
        offeringCount.set(offering.code, (offeringCount.get(offering.code) ?? 0) + 1);
        if (offering.tuitionFee !== null) {
            feeByCode.set(offering.code, [...(feeByCode.get(offering.code) ?? []), offering.tuitionFee]);
        }
    }

    const careers = data.careers
        .filter((career) => career.clusterNumber === clusterNumber)
        .sort((a, b) => (offeringCount.get(b.code) ?? 0) - (offeringCount.get(a.code) ?? 0));

    const written = careers.filter((c) => CAREER_CONTENT.has(c.code)).length;
    console.log(`Кластер ${clusterNumber}: ${careers.length} ихтисос | матн навишташуда: ${written}`);
    console.log(`Нишон дода мешавад: ${offset + 1}–${Math.min(offset + limit, careers.length)}\n`);

    careers.slice(offset, offset + limit).forEach((career, index) => {
        const fees = feeByCode.get(career.code) ?? [];
        const feeLabel = fees.length ? `${Math.min(...fees)}–${Math.max(...fees)} сом.` : 'ройгон';
        const mark = CAREER_CONTENT.has(career.code) ? '✓' : ' ';
        console.log(
            `${mark} ${String(offset + index + 1).padStart(3)}. [${career.code}] ${career.name}` +
            `  — ${offeringCount.get(career.code)} пешниҳод, ${feeLabel}`,
        );
    });
}

main();
