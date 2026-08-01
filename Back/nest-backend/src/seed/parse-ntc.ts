/**
 * Parses the official NTC (Маркази миллии тестӣ) admission table into the shape
 * the seeder needs.
 *
 * `ntc_raw_data.json` is a scraped HTML table: one array of 11 strings per row.
 * A handful of rows (38 of 5997) lost bytes during scraping and contain U+FFFD
 * replacement characters — those are repaired against the clean variant of the
 * same value rather than dropped, so no offering is lost.
 */
import * as fs from 'fs';
import * as path from 'path';

export const RAW_DATA_PATH = path.join(__dirname, '..', '..', 'ntc_raw_data.json');

/** Column indexes in a raw row. */
const enum Col {
    Index = 0,
    Cluster = 1,
    University = 2,
    Code = 3,
    Name = 4,
    StudyForm = 5,
    PaymentType = 6,
    TuitionFee = 7,
    Language = 8,
    Seats = 9,
    BasedOn = 10,
}

const REPLACEMENT = '�';

export interface ParsedCluster {
    clusterNumber: number;
    clusterName: string;
}

export interface ParsedUniversity {
    name: string;
}

export interface ParsedCareer {
    code: string;
    name: string;
    clusterNumber: number;
}

export interface ParsedOffering {
    code: string;
    universityName: string;
    studyForm: string;
    paymentType: string;
    tuitionFee: number | null;
    language: string;
    seats: number;
    basedOn: number;
}

export interface ParsedData {
    clusters: ParsedCluster[];
    universities: ParsedUniversity[];
    careers: ParsedCareer[];
    offerings: ParsedOffering[];
    stats: {
        rawRows: number;
        usableRows: number;
        repairedValues: number;
    };
}

/** The scraper left HTML entities in place. */
function decodeEntities(value: string): string {
    return String(value)
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&#39;/g, "'")
        .replace(/&laquo;|&raquo;/g, '"')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function isCorrupt(value: string): boolean {
    return value.includes(REPLACEMENT);
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Builds a repair table for one column.
 *
 * A lost character does not map 1:1 onto replacement chars — a single Cyrillic
 * letter usually arrives as two (`Тоҷикистон` → `Тоҷик��стон`) — so each run of
 * replacement chars is matched as "one to four arbitrary characters" instead of
 * by position. Only unambiguous matches are recorded.
 */
function buildRepairTable(values: string[]): Map<string, string> {
    const clean = new Set<string>();
    const corrupt = new Set<string>();
    for (const value of values) {
        if (!value) continue;
        (isCorrupt(value) ? corrupt : clean).add(value);
    }

    const repairs = new Map<string, string>();
    const cleanList = [...clean];

    for (const broken of corrupt) {
        const pattern = broken
            .split(/�+/)
            .map(escapeRegExp)
            .join('.{1,4}');
        const matcher = new RegExp(`^${pattern}$`);

        const candidates = cleanList.filter((candidate) => matcher.test(candidate));
        if (candidates.length === 1) {
            repairs.set(broken, candidates[0]);
        }
    }

    return repairs;
}

/** `1-ум - "Табиӣ ва техникӣ"` → `{ clusterNumber: 1, clusterName: 'Табиӣ ва техникӣ' }` */
function parseCluster(value: string): ParsedCluster | null {
    const numberMatch = value.match(/^(\d+)/);
    if (!numberMatch) return null;

    const clusterNumber = Number(numberMatch[1]);
    if (clusterNumber < 1 || clusterNumber > 5) return null;

    const nameMatch = value.match(/"([^"]+)"/);
    const clusterName = nameMatch ? nameMatch[1].trim() : value.replace(/^\d+-\S+\s*-\s*/, '').trim();

    return { clusterNumber, clusterName };
}

/**
 * Reads the first integer in a cell.
 *
 * Fee cells are not always a bare number: some carry an alternative price in
 * parentheses ("7500 (7375)") and some are just "*" when the price is not
 * published. Stripping every non-digit would splice those into one huge number,
 * so only the leading group is taken.
 */
function parseInteger(value: string): number | null {
    const match = value.match(/\d+/);
    if (!match) return null;
    const parsed = Number(match[0]);
    return Number.isFinite(parsed) ? parsed : null;
}

export function parseNtcData(rawPath: string = RAW_DATA_PATH): ParsedData {
    const raw: unknown = JSON.parse(fs.readFileSync(rawPath, 'utf8'));
    if (!Array.isArray(raw)) throw new Error(`${rawPath} does not contain an array`);

    const rows: string[][] = raw
        .filter((row): row is string[] => Array.isArray(row) && row.length === Col.BasedOn + 1)
        .map((row) => row.map(decodeEntities))
        .filter((row) => row.some((cell) => cell.length > 0));

    // Repair the columns whose values must match exactly across rows.
    const universityRepairs = buildRepairTable(rows.map((r) => r[Col.University]));
    const nameRepairs = buildRepairTable(rows.map((r) => r[Col.Name]));
    const clusterRepairs = buildRepairTable(rows.map((r) => r[Col.Cluster]));
    const formRepairs = buildRepairTable(rows.map((r) => r[Col.StudyForm]));
    const paymentRepairs = buildRepairTable(rows.map((r) => r[Col.PaymentType]));
    const languageRepairs = buildRepairTable(rows.map((r) => r[Col.Language]));

    let repairedValues = 0;
    const repair = (value: string, table: Map<string, string>): string => {
        const fixed = table.get(value);
        if (fixed) {
            repairedValues += 1;
            return fixed;
        }
        return value;
    };

    const clusters = new Map<number, ParsedCluster>();
    const universities = new Map<string, ParsedUniversity>();
    const careers = new Map<string, ParsedCareer>();
    const offerings: ParsedOffering[] = [];

    for (const row of rows) {
        const code = row[Col.Code].replace(/\s+/g, '');
        const name = repair(row[Col.Name], nameRepairs);
        const universityName = repair(row[Col.University], universityRepairs);
        const cluster = parseCluster(repair(row[Col.Cluster], clusterRepairs));

        // A row without these is not a real offering.
        if (!code || !name || !universityName || !cluster) continue;
        if (isCorrupt(code) || isCorrupt(name) || isCorrupt(universityName)) continue;

        clusters.set(cluster.clusterNumber, cluster);
        universities.set(universityName, { name: universityName });

        // Codes repeat across universities; keep the first clean name we see.
        if (!careers.has(code)) {
            careers.set(code, { code, name, clusterNumber: cluster.clusterNumber });
        }

        const paymentType = repair(row[Col.PaymentType], paymentRepairs);
        const tuitionFee = paymentType === 'ройгон' ? null : parseInteger(row[Col.TuitionFee]);

        offerings.push({
            code,
            universityName,
            studyForm: repair(row[Col.StudyForm], formRepairs) || 'рӯзона',
            paymentType: paymentType || 'пулакӣ',
            tuitionFee,
            language: repair(row[Col.Language], languageRepairs) || 'тоҷикӣ',
            seats: parseInteger(row[Col.Seats]) ?? 0,
            basedOn: parseInteger(row[Col.BasedOn]) ?? 11,
        });
    }

    return {
        clusters: [...clusters.values()].sort((a, b) => a.clusterNumber - b.clusterNumber),
        universities: [...universities.values()].sort((a, b) => a.name.localeCompare(b.name)),
        careers: [...careers.values()].sort((a, b) => a.name.localeCompare(b.name)),
        offerings,
        stats: {
            rawRows: raw.length,
            usableRows: rows.length,
            repairedValues,
        },
    };
}

// Allow `npx ts-node src/seed/parse-ntc.ts` for a quick sanity report.
if (require.main === module) {
    const data = parseNtcData();
    console.log('rawRows        :', data.stats.rawRows);
    console.log('usableRows     :', data.stats.usableRows);
    console.log('repairedValues :', data.stats.repairedValues);
    console.log('clusters       :', data.clusters.length);
    console.log('universities   :', data.universities.length);
    console.log('careers        :', data.careers.length);
    console.log('offerings      :', data.offerings.length);
    console.log('\nClusters:');
    data.clusters.forEach((c) => console.log(`  ${c.clusterNumber}. ${c.clusterName}`));
}
