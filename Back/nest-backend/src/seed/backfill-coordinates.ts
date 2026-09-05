/**
 * Донишгоҳҳоеро, ки координата надоранд, аз рӯи шаҳрашон пур мекунад.
 *
 * Чаро на seed-и пурра: seed ҷадвалҳоро тоза карда, аз нав менависад, ва бо
 * он ҳамаи маълумоти корбарон — лайкҳо, захираҳо, натиҷаи саволномаҳо — нест
 * мешавад. Ин ҷо танҳо ду сутун навишта мешавад, ва танҳо он ҷое ки холист.
 *
 * Координатаҳо ба шаҳр тааллуқ доранд, на ба бинои донишгоҳ. Кӯшиши ёфтани
 * бинои мушаххас дар OSM ноком шуд: чор коллеҷи тиббӣ дар чор шаҳри гуногун
 * ба як нуқтаи «Медицинский колледж» мувофиқ мешуданд. Ҷои шаҳр рост аст ва
 * тафтишшаванда; ҷои бино не.
 *
 *   npx ts-node --transpileOnly src/seed/backfill-coordinates.ts
 */
import 'dotenv/config';
import { DataSource, IsNull } from 'typeorm';
import { Career } from '../career/career.entity';
import { CareerOffering } from '../career/career-offering.entity';
import { Cluster } from '../cluster/cluster.entity';
import { University } from '../university/university.entity';
import { User } from '../users/user.entity';
import { Appointment } from '../appointment/appointment.entity';
import { SETTLEMENTS } from './university-cities';

async function main(): Promise<void> {
    const dataSource = new DataSource({
        type: 'postgres',
        host: process.env.DB_HOST ?? 'localhost',
        port: Number(process.env.DB_PORT ?? 5432),
        username: process.env.DB_USERNAME ?? 'postgres',
        password: process.env.DB_PASSWORD ?? 'postgres',
        database: process.env.DB_NAME ?? 'career_db',
        entities: [Career, CareerOffering, Cluster, University, User, Appointment],
        synchronize: false,
        logging: ['error'],
    });

    await dataSource.initialize();
    const repo = dataSource.getRepository(University);

    const pending = await repo.find({ where: { latitude: IsNull() } });
    console.log(`донишгоҳҳо бе координата: ${pending.length}`);

    let filled = 0;
    const unknown = new Map<string, number>();

    for (const university of pending) {
        const settlement = university.city ? SETTLEMENTS[university.city] : undefined;
        if (!settlement?.latitude || !settlement?.longitude) {
            const key = university.city ?? '(шаҳр сабт нашуда)';
            unknown.set(key, (unknown.get(key) ?? 0) + 1);
            continue;
        }
        await repo.update(university.id, {
            latitude: settlement.latitude,
            longitude: settlement.longitude,
            region: university.region ?? settlement.region,
        });
        filled += 1;
    }

    console.log(`пур шуд: ${filled}`);
    if (unknown.size) {
        console.log('\nбе координата монданд:');
        for (const [city, count] of [...unknown].sort((a, b) => b[1] - a[1])) {
            console.log(`   ${city.padEnd(28)} ${count}`);
        }
    }

    const total = await repo.count();
    const withCoords = await repo.count({ where: { latitude: IsNull() } });
    console.log(`\nҳоло: ${total - withCoords} / ${total} донишгоҳ координата дорад`);

    await dataSource.destroy();
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
