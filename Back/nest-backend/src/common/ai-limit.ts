import { HttpException, HttpStatus } from '@nestjs/common';

// Ҳимояи кредити AI аз ботҳо: ҳар IP дар як соат то AI_PER_IP_HOUR (пешфарз 120)
// дархости AI-и бе логин (ёвар, ҷустуҷӯи AI, ҷавоби озод дар тест).
// Дар хотира нигоҳ дошта мешавад — баъди restart аз нав; барои як сервер кофист.
const hits = new Map<string, number[]>();
const HOUR = 60 * 60 * 1000;

export function assertAiAllowed(ip: string | undefined): void {
    const limit = Number(process.env.AI_PER_IP_HOUR ?? 120);
    if (!limit || limit <= 0) return;
    const key = ip || 'unknown';
    const now = Date.now();
    const recent = (hits.get(key) || []).filter((at) => now - at < HOUR);
    if (recent.length >= limit) {
        throw new HttpException(
            { message: 'Дархост аз ҳад зиёд — баъди як соат боз кӯшиш кунед.', code: 'AI_RATE_LIMIT' },
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
    recent.push(now);
    hits.set(key, recent);
    // Хотира намерӯяд: IP-ҳои кӯҳна гоҳ-гоҳ тоза мешаванд.
    if (hits.size > 5000) {
        for (const [other, list] of hits) if (!list.some((at) => now - at < HOUR)) hits.delete(other);
    }
}
