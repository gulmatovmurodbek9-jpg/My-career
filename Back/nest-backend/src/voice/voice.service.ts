import {
    BadRequestException,
    Injectable,
    Logger,
    OnModuleInit,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { existsSync, readdirSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { TajikTts } from './tajik-tts';

const MAX_TEXT_LENGTH = 2000;
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const STT_TIMEOUT_MS = 25_000;
const IP_WINDOW_MS = 10 * 60 * 1000;
const REMOTE_TTS_TIMEOUT_MS = 60_000;

// ── Рақамҳо ────────────────────────────────────────────────────────────
// Модел рақамро намехонад: «4000» бояд «чор ҳазор» шавад.
const ONES = ['сифр', 'як', 'ду', 'се', 'чор', 'панҷ', 'шаш', 'ҳафт', 'ҳашт', 'нӯҳ'];
const TEENS = ['даҳ', 'ёздаҳ', 'дувоздаҳ', 'сенздаҳ', 'чордаҳ', 'понздаҳ', 'шонздаҳ', 'ҳабдаҳ', 'ҳаждаҳ', 'нуздаҳ'];
const TENS = ['', '', 'бист', 'сӣ', 'чил', 'панҷоҳ', 'шаст', 'ҳафтод', 'ҳаштод', 'навад'];
const HUNDREDS = ['', 'сад', 'дусад', 'сесад', 'чорсад', 'панҷсад', 'шашсад', 'ҳафтсад', 'ҳаштсад', 'нӯҳсад'];

const joinTj = (parts: string[]): string => parts.filter(Boolean).reduce((a, b) => `${a}у ${b}`);

const under100 = (value: number): string => {
    if (value < 10) return ONES[value];
    if (value < 20) return TEENS[value - 10];
    const rest = value % 10;
    return rest ? joinTj([TENS[Math.floor(value / 10)], ONES[rest]]) : TENS[Math.floor(value / 10)];
};

const under1000 = (value: number): string => {
    if (value < 100) return under100(value);
    const rest = value % 100;
    return rest ? joinTj([HUNDREDS[Math.floor(value / 100)], under100(rest)]) : HUNDREDS[Math.floor(value / 100)];
};

export const numberToTajik = (value: number): string => {
    if (!Number.isFinite(value)) return '';
    if (value < 0) return `манфии ${numberToTajik(-value)}`;
    if (value === 0) return ONES[0];
    if (value < 1000) return under1000(value);

    if (value < 1_000_000) {
        const thousands = Math.floor(value / 1000);
        const rest = value % 1000;
        const head = `${under1000(thousands)} ҳазор`;
        return rest ? joinTj([head, under1000(rest)]) : head;
    }

    const millions = Math.floor(value / 1_000_000);
    const rest = value % 1_000_000;
    const head = `${under1000(millions)} миллион`;
    return rest ? joinTj([head, numberToTajik(rest)]) : head;
};

// «то 4000 сомонӣ» → «то чор ҳазор сомонӣ». Фосилаи дарунирақамӣ низ гирифта мешавад.
export const spellNumbers = (text: string): string =>
    text.replace(/\d[\d\s ]*/g, (match) => {
        const digits = match.replace(/[\s ]/g, '');
        const value = Number(digits);
        if (!Number.isFinite(value) || digits.length > 9) return match;
        const tail = /[\s ]$/.test(match) ? ' ' : '';
        return numberToTajik(value) + tail;
    });

@Injectable()
export class VoiceService implements OnModuleInit {
    private readonly logger = new Logger(VoiceService.name);
    private readonly cacheDir = join(process.cwd(), 'voice-cache');
    // Овозҳои пешакӣ — агар ягон ҷумларо дастӣ сохта бошем.
    private readonly packDir = join(process.cwd(), 'voice-pack');
    private readonly tajik = new TajikTts();

    // Сервер 2 ядро дорад: ду синтези ҳамзамон онро мехобонад.
    private queue: Promise<unknown> = Promise.resolve();

    private spendByIp = new Map<string, number[]>();
    private spendToday = { day: '', count: 0 };

    constructor(private readonly configService: ConfigService) { }

    // Кушодани файли 110 МБ 20 сония мегирад — онро дар оғоз мекунем,
    // то дархости аввали корбар фаврӣ бошад.
    onModuleInit(): void {
        if (this.ttsUrl) {
            this.logger.log(`Овоз аз сервери Python — ${this.ttsUrl}`);
            return;
        }
        if (!this.tajik.available) {
            this.logger.warn('Модели овоз дар voice-model/ нест');
            return;
        }
        const started = Date.now();
        void this.tajik
            .warmup()
            .then((ok) => {
                if (ok) this.logger.log(`Модели овоз тайёр — ${Date.now() - started} мс`);
            })
            .catch(() => undefined);
    }

    // Сервери Python бо модели аслӣ (tajik-tts/server.py).
    // Агар монда нашуда бошад, модели ONNX дар худи Node кор мекунад.
    private get ttsUrl(): string | null {
        const raw = this.configService.get<string>('TTS_URL');
        return raw ? raw.trim().replace(/\/+$/, '') : null;
    }

    private get sttKey(): string | null {
        return this.configService.get<string>('ELEVENLABS_API_KEY') || null;
    }

    status() {
        const count = (dir: string, ext: string) => {
            try {
                return existsSync(dir) ? readdirSync(dir).filter((name) => name.endsWith(ext)).length : 0;
            } catch {
                return 0;
            }
        };

        return {
            tts: this.ttsUrl ? 'python' : this.tajik.available ? 'onnx' : 'none',
            ttsUrl: this.ttsUrl,
            sampleRate: this.tajik.sampleRate,
            cached: count(this.cacheDir, '.wav'),
            packed: count(this.packDir, '.mp3'),
            speechToText: !!this.sttKey,
        };
    }

    // ── Овоз ───────────────────────────────────────────────────────────
    private prepare(rawText: string): string {
        const text = String(rawText || '').trim();
        if (!text) throw new BadRequestException('Матн холӣ аст');
        if (text.length > MAX_TEXT_LENGTH) {
            throw new BadRequestException(`Матн аз ${MAX_TEXT_LENGTH} ҳарф дароз аст`);
        }
        return spellNumbers(text);
    }

    async readPack(spoken: string): Promise<Buffer | null> {
        const hash = createHash('sha1').update(spoken).digest('hex');
        const file = join(this.packDir, `${hash}.mp3`);
        if (!existsSync(file)) return null;
        try {
            return await readFile(file);
        } catch {
            return null;
        }
    }

    private async remoteSpeak(text: string, speed: number): Promise<Buffer | null> {
        const url = this.ttsUrl;
        if (!url) return null;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REMOTE_TTS_TIMEOUT_MS);

        try {
            const response = await fetch(`${url}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, speed }),
                signal: controller.signal,
            });
            if (!response.ok) {
                this.logger.error(`Сервери овоз ${response.status}: ${(await response.text()).slice(0, 160)}`);
                return null;
            }
            return Buffer.from(await response.arrayBuffer());
        } catch (error) {
            this.logger.error(`Сервери овоз нарасид: ${error}`);
            return null;
        } finally {
            clearTimeout(timer);
        }
    }

    async speak(rawText: string, speed = 1): Promise<{ audio: Buffer; cached: boolean }> {
        if (!this.ttsUrl && !this.tajik.available) {
            throw new ServiceUnavailableException('На TTS_URL монда шудааст, на модел дар voice-model/');
        }

        const spoken = this.prepare(rawText);
        const hash = createHash('sha1').update(`${spoken}|${speed}`).digest('hex');
        const file = join(this.cacheDir, `${hash}.wav`);

        if (existsSync(file)) {
            try {
                return { audio: await readFile(file), cached: true };
            } catch {
                /* аз нав месозем */
            }
        }

        // Сервери Python худаш навбат дорад; ONNX-ро мо навбат мекунем.
        let audio = await this.remoteSpeak(spoken, speed);
        if (!audio && this.tajik.available) {
            audio = await (this.queue = this.queue
                .catch(() => undefined)
                .then(() => this.tajik.speak(spoken, speed))) as Buffer | null;
        }

        if (!audio) throw new ServiceUnavailableException('Овоз сохта нашуд');

        try {
            await mkdir(this.cacheDir, { recursive: true });
            await writeFile(file, audio);
        } catch (error) {
            this.logger.warn(`Кеш нигоҳ дошта нашуд: ${error}`);
        }

        return { audio, cached: false };
    }

    // ── Шинохти нутқ ───────────────────────────────────────────────────
    // Модели мо танҳо гап мезанад. Барои шунидани тоҷикӣ ивазкунанда надорем.
    async transcribe(buffer?: Buffer, mimetype?: string): Promise<{ text: string }> {
        if (!buffer?.length) throw new BadRequestException('Садо холӣ аст');
        if (buffer.length > MAX_AUDIO_BYTES) throw new BadRequestException('Садо хеле калон аст');
        if (!this.sttKey) throw new ServiceUnavailableException('ELEVENLABS_API_KEY дар .env нест');

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), STT_TIMEOUT_MS);

        try {
            const form = new FormData();
            form.append(
                'file',
                new Blob([new Uint8Array(buffer)], { type: mimetype || 'audio/webm' }),
                'speech.webm',
            );
            form.append('model_id', this.configService.get<string>('ELEVENLABS_STT_MODEL') || 'scribe_v1');
            const code = this.configService.get<string>('ELEVENLABS_STT_LANG') ?? 'tgk';
            if (code) form.append('language_code', code);

            const response = await fetch(STT_URL, {
                method: 'POST',
                headers: { 'xi-api-key': this.sttKey },
                body: form,
                signal: controller.signal,
            });

            if (!response.ok) {
                const detail = (await response.text()).slice(0, 220);
                this.logger.error(`Scribe ${response.status}: ${detail}`);
                throw new ServiceUnavailableException(`Шинохти нутқ нашуд (${response.status})`);
            }

            const data: any = await response.json();
            return { text: toCyrillic(String(data?.text || '').trim()) };
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                throw new ServiceUnavailableException('Шинохти нутқ дер кард');
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }

    // Танҳо шинохти нутқ пул мегирад — овоз акнун аз они худамон аст.
    guardSpend(ip = 'unknown'): void {
        const perIp = Number(this.configService.get<string>('VOICE_IP_LIMIT')) || 30;
        const perDay = Number(this.configService.get<string>('VOICE_DAILY_LIMIT')) || 800;
        const now = Date.now();
        const today = new Date().toISOString().slice(0, 10);

        if (this.spendToday.day !== today) this.spendToday = { day: today, count: 0 };
        if (this.spendToday.count >= perDay) {
            this.logger.warn(`Лимити рӯзона пур шуд (${perDay})`);
            throw new ServiceUnavailableException('Лимити рӯзонаи шинохти нутқ пур шуд');
        }

        const recent = (this.spendByIp.get(ip) || []).filter((at) => now - at < IP_WINDOW_MS);
        if (recent.length >= perIp) {
            throw new ServiceUnavailableException('Дархостҳо аз ҳад зиёд — каме интизор шавед');
        }

        recent.push(now);
        this.spendByIp.set(ip, recent);
        this.spendToday.count += 1;

        if (this.spendByIp.size > 500) {
            for (const [key, times] of this.spendByIp) {
                if (!times.some((at) => now - at < IP_WINDOW_MS)) this.spendByIp.delete(key);
            }
        }
    }
}

// Scribe баъзан ба хатти форсӣ мегузарад («من» ба ҷойи «ман»).
const PERSIAN_WORDS: Array<[RegExp, string]> = [
    [/می‌?خواهم/g, 'мехоҳам'],
    [/می‌?خواهی/g, 'мехоҳӣ'],
    [/برای/g, 'барои'],
    [/شما/g, 'шумо'],
    [/کدام/g, 'кадом'],
    [/کجا/g, 'куҷо'],
    [/این/g, 'ин'],
    [/است/g, 'аст'],
    [/من/g, 'ман'],
    [/تو/g, 'ту'],
    [/ما/g, 'мо'],
    [/در/g, 'дар'],
    [/که/g, 'ки'],
    [/را/g, 'ро'],
    [/به/g, 'ба'],
    [/از/g, 'аз'],
    [/با/g, 'бо'],
    [/آن/g, 'он'],
    [/چه/g, 'чӣ'],
    [/و/g, 'ва'],
];

const toCyrillic = (text: string): string => {
    if (!/[؀-ۿ]/.test(text)) return text;
    let result = text;
    for (const [pattern, word] of PERSIAN_WORDS) result = result.replace(pattern, word);
    return result.replace(/[؀-ۿ‌]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
};
