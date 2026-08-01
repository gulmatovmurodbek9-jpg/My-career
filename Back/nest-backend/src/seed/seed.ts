/**
 * Rebuilds the whole database from the official NTC admission table.
 *
 *   npm run seed            # wipes reference data, keeps user accounts
 *   npm run seed -- --all   # wipes everything, including users
 *
 * Idempotent: running it twice produces the same database.
 */
import 'dotenv/config';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { Career } from '../career/career.entity';
import { CareerOffering } from '../career/career-offering.entity';
import { Cluster } from '../cluster/cluster.entity';
import { University } from '../university/university.entity';
import { User, UserRole } from '../users/user.entity';
import { Appointment } from '../appointment/appointment.entity';

import { parseNtcData } from './parse-ntc';
import { SETTLEMENTS, resolveCity, resolveInstitutionType, isStateOwned } from './university-cities';
import { CAREER_CONTENT, buildStubContent } from './content';
import { matchFamilyKey } from './content/families';

const CLUSTER_ICONS: Record<number, string> = {
    1: 'Atom',
    2: 'TrendingUp',
    3: 'BookOpen',
    4: 'Scale',
    5: 'HeartPulse',
};

const CLUSTER_DESCRIPTIONS: Record<number, { description: string; purpose: string }> = {
    1: {
        description:
            'Кластери илмҳои табиӣ ва техникӣ — барномасозӣ, муҳандисӣ, энергетика, сохтмон, нақлиёт ва ' +
            'технологияҳои иттилоотӣ. Барои онҳое, ки бо рақам, схема ва техника кор кардан меписанданд.',
        purpose:
            'Тайёр кардани муҳандисон ва мутахассисони техникӣ, ки инфрасохтор ва иқтисоди рақамии кишварро ' +
            'месозанд ва нигоҳ медоранд.',
    },
    2: {
        description:
            'Кластери иқтисод ва география — молия, баҳисобгирӣ, менеҷмент, савдо, сайёҳӣ ва география. Барои ' +
            'онҳое, ки таҳлил, банақшагирӣ ва кор бо одамону рақамҳоро дӯст медоранд.',
        purpose:
            'Тайёр кардани иқтисодчиён ва менеҷерон, ки метавонанд захираҳоро самаранок идора кунанд ва тиҷорат ' +
            'ташкил намоянд.',
    },
    3: {
        description:
            'Кластери филология, педагогика ва санъат — забонҳо, адабиёт, омӯзгорӣ, мусиқӣ, дизайн ва ҳунар. ' +
            'Барои онҳое, ки бо калима, эҷод ва одамон кор кардан мехоҳанд.',
        purpose:
            'Тайёр кардани омӯзгорон, филологҳо ва аҳли ҳунар, ки насли оянда ва фарҳанги миллиро ташаккул ' +
            'медиҳанд.',
    },
    4: {
        description:
            'Кластери ҷомеашиносӣ ва ҳуқуқ — ҳуқуқшиносӣ, сиёсатшиносӣ, журналистика, кори иҷтимоӣ ва ' +
            'муносибатҳои байналмилалӣ. Барои онҳое, ки адолат, ҷомеа ва муошират барояшон муҳим аст.',
        purpose:
            'Тайёр кардани ҳуқуқшиносон ва мутахассисони соҳаи ҷамъиятӣ, ки ҳуқуқи шаҳрвандон ва тартиби ' +
            'ҳуқуқиро ҳифз мекунанд.',
    },
    5: {
        description:
            'Кластери тиб, биология ва варзиш — табобат, дорусозӣ, ҳамширагӣ, биология, экология ва тарбияи ' +
            'ҷисмонӣ. Барои онҳое, ки ба саломатии инсон ва табиати зинда шавқ доранд.',
        purpose:
            'Тайёр кардани кормандони тиб ва мутахассисони соҳаи саломатӣ, ки ҳаёт ва тандурустии мардумро ' +
            'ҳифз мекунанд.',
    },
};

function buildDataSource(): DataSource {
    return new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'career_db',
        entities: [Career, CareerOffering, Cluster, University, User, Appointment],
        synchronize: true,
        logging: ['error'],
    });
}

async function wipe(dataSource: DataSource, includeUsers: boolean): Promise<void> {
    // CASCADE clears the TypeORM-generated join tables (career_universities,
    // user_saved_careers, user_liked_careers) along with their owners.
    const tables = ['career_offerings', 'career', 'cluster', 'universities'];
    if (includeUsers) tables.push('appointment', '"user"');

    await dataSource.query(`TRUNCATE TABLE ${tables.join(', ')} RESTART IDENTITY CASCADE`);
    console.log(`  тоза шуд: ${tables.join(', ')}`);
}

async function main(): Promise<void> {
    const includeUsers = process.argv.includes('--all');

    console.log('=== SEED: базаи MyCareer ===\n');
    console.log('1. Хондан ва таҳлили маълумоти МНТ...');
    const data = parseNtcData();
    console.log(
        `   ${data.clusters.length} кластер, ${data.universities.length} донишгоҳ, ` +
        `${data.careers.length} ихтисос, ${data.offerings.length} пешниҳод ` +
        `(${data.stats.repairedValues} қимат ислоҳ шуд)`,
    );

    const dataSource = buildDataSource();
    await dataSource.initialize();
    console.log('\n2. Пайвастшавӣ ба PostgreSQL — OK');

    try {
        console.log(`\n3. Тоза кардани база${includeUsers ? ' (ҳамроҳи корбарон)' : ' (корбарон нигоҳ дошта мешаванд)'}...`);
        await wipe(dataSource, includeUsers);

        // ── Clusters ──
        console.log('\n4. Кластерҳо...');
        const clusterRepo = dataSource.getRepository(Cluster);
        const clusterByNumber = new Map<number, Cluster>();
        for (const parsed of data.clusters) {
            const texts = CLUSTER_DESCRIPTIONS[parsed.clusterNumber];
            const cluster = await clusterRepo.save(
                clusterRepo.create({
                    clusterId: parsed.clusterNumber,
                    clusterName: parsed.clusterName,
                    clusterIcon: CLUSTER_ICONS[parsed.clusterNumber] ?? 'Sparkles',
                    description: texts?.description ?? null,
                    purpose: texts?.purpose ?? null,
                }),
            );
            clusterByNumber.set(parsed.clusterNumber, cluster);
            console.log(`   ${parsed.clusterNumber}. ${parsed.clusterName}`);
        }

        // ── Universities ──
        console.log('\n5. Донишгоҳҳо...');
        const universityRepo = dataSource.getRepository(University);
        const universityByName = new Map<string, University>();
        const universityRows = data.universities.map((parsed) => {
            const city = resolveCity(parsed.name);
            const settlement = city ? SETTLEMENTS[city] : undefined;
            return universityRepo.create({
                name: parsed.name,
                city: city ?? null,
                region: settlement?.region ?? null,
                latitude: settlement?.latitude ?? null,
                longitude: settlement?.longitude ?? null,
                isState: isStateOwned(parsed.name),
                institutionType: resolveInstitutionType(parsed.name),
            });
        });
        for (const saved of await universityRepo.save(universityRows, { chunk: 50 })) {
            universityByName.set(saved.name, saved);
        }
        console.log(`   ${universityByName.size} муассиса сабт шуд`);

        // ── Careers ──
        console.log('\n6. Ихтисосҳо...');
        const offeringsByCode = new Map<string, typeof data.offerings>();
        for (const offering of data.offerings) {
            const list = offeringsByCode.get(offering.code) ?? [];
            list.push(offering);
            offeringsByCode.set(offering.code, list);
        }

        // Neighbours within the same professional family, used to fill
        // "Ихтисосҳои вобаста" for specialties without hand-written content.
        const namesByFamily = new Map<string, string[]>();
        for (const parsed of data.careers) {
            const key = matchFamilyKey(parsed.name);
            if (!key) continue;
            namesByFamily.set(key, [...(namesByFamily.get(key) ?? []), parsed.name]);
        }
        const relatedFor = (name: string): string[] => {
            const key = matchFamilyKey(name);
            if (!key) return [];
            return (namesByFamily.get(key) ?? [])
                .filter((other) => other !== name)
                .slice(0, 5);
        };

        const careerRepo = dataSource.getRepository(Career);
        const careerRows = data.careers.map((parsed) => {
            const written = CAREER_CONTENT.get(parsed.code);
            const content = written ?? buildStubContent(parsed.name, parsed.clusterNumber, parsed.code);

            const offerings = offeringsByCode.get(parsed.code) ?? [];
            const fees = offerings.map((o) => o.tuitionFee).filter((fee): fee is number => fee !== null);
            const minFee = fees.length ? Math.min(...fees) : null;

            return careerRepo.create({
                code: parsed.code,
                name: parsed.name,
                cluster: clusterByNumber.get(parsed.clusterNumber),
                clusterId: clusterByNumber.get(parsed.clusterNumber)?.id,
                mmtCluster: parsed.clusterNumber,
                universities: [
                    ...new Set(offerings.map((o) => o.universityName)),
                ].map((name) => universityByName.get(name)).filter((u): u is University => Boolean(u)),

                tuitionFee: minFee,
                minTuitionFee: minFee,
                maxTuitionFee: fees.length ? Math.max(...fees) : null,
                hasFreeSeats: offerings.some((o) => o.paymentType === 'ройгон'),
                contentWritten: Boolean(written),

                description: content.description ?? null,
                purpose: content.purpose ?? null,
                skills: content.skills ?? null,
                technologies: content.technologies ?? null,
                roadmap: content.roadmap ?? null,
                projectsExamples: content.projectsExamples ?? null,
                learningResources: content.learningResources ?? null,
                careerOpportunities: content.careerOpportunities ?? null,
                salaryAndMarket: content.salaryAndMarket ?? null,
                relatedSpecializations: content.relatedSpecializations?.length
                    ? content.relatedSpecializations
                    : relatedFor(parsed.name),
                advice: content.advice ?? null,
                certification: content.certification ?? null,
                durationYears: content.durationYears ?? 4,
                degreeType: content.degreeType ?? 'Бакалавр',
            });
        });

        const careerByCode = new Map<string, Career>();
        for (const saved of await careerRepo.save(careerRows, { chunk: 25 })) {
            careerByCode.set(saved.code, saved);
        }
        const withContent = careerRows.filter((c) => c.contentWritten).length;
        console.log(`   ${careerByCode.size} ихтисос сабт шуд (${withContent} бо матни дастнавис)`);

        // ── Offerings ──
        console.log('\n7. Пешниҳодҳо (донишгоҳ × ихтисос)...');
        const offeringRepo = dataSource.getRepository(CareerOffering);
        const offeringRows = data.offerings
            .map((parsed) => {
                const career = careerByCode.get(parsed.code);
                const university = universityByName.get(parsed.universityName);
                if (!career || !university) return null;
                return offeringRepo.create({
                    careerId: career.id,
                    universityId: university.id,
                    studyForm: parsed.studyForm,
                    paymentType: parsed.paymentType,
                    tuitionFee: parsed.tuitionFee,
                    language: parsed.language,
                    seats: parsed.seats,
                    basedOn: parsed.basedOn,
                });
            })
            .filter((row): row is CareerOffering => row !== null);

        await offeringRepo.save(offeringRows, { chunk: 200 });
        console.log(`   ${offeringRows.length} пешниҳод сабт шуд`);

        // ── Admin ──
        if (includeUsers) {
            console.log('\n8. Ҳисоби администратор...');
            const userRepo = dataSource.getRepository(User);
            const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@mycareer.tj';
            const password = process.env.SEED_ADMIN_PASSWORD ?? 'admin12345';
            await userRepo.save(
                userRepo.create({
                    name: 'Администратор',
                    email,
                    password: await bcrypt.hash(password, 10),
                    role: UserRole.ADMIN,
                }),
            );
            console.log(`   email: ${email}`);
            console.log(`   парол: ${password}   ← онро баъд аз воридшавӣ иваз кунед`);
        }

        // ── Report ──
        console.log('\n=== НАТИҶА ===');
        console.log('кластерҳо   :', await clusterRepo.count());
        console.log('донишгоҳҳо  :', await universityRepo.count());
        console.log('ихтисосҳо   :', await careerRepo.count());
        console.log('пешниҳодҳо  :', await offeringRepo.count());
        console.log('\nБаза тайёр аст.');
    } finally {
        await dataSource.destroy();
    }
}

main().catch((error) => {
    console.error('\nSEED ноком шуд:', error instanceof Error ? error.message : error);
    process.exit(1);
});
