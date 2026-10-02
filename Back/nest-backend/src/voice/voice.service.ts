import {
    BadRequestException,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    OnModuleDestroy,
    OnModuleInit,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { existsSync, readdirSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';
import { TajikTts } from './tajik-tts';
import { prepareEnglishText, prepareRussianText, prepareTajikText } from './tj-text';
import { ForeignLang, SherpaClient, TtsError } from './sherpa-client';

const MAX_TEXT_LENGTH = 2000;
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const STT_TIMEOUT_MS = 25_000;
const IP_WINDOW_MS = 10 * 60 * 1000;
const REMOTE_TTS_TIMEOUT_MS = 60_000;
// Як синтез дар як вақт; агар дар навбат зиёда аз ин бошад — «банд аст», на бори сервер.
const MAX_SYNTH_QUEUE = 4;

const BUSY_MESSAGE: Record<string, string> = {
    tj: 'Ёвар ҳоло банд аст, каме интизор шавед.',
    ru: 'Помощник сейчас занят, подождите немного.',
    en: 'The assistant is busy right now, please wait a moment.',
};
const TIMEOUT_MESSAGE: Record<string, string> = {
    tj: 'Овоз дер кард — матнро хонед.',
    ru: 'Голос задерживается — прочитайте текст.',
    en: 'The voice is taking too long — please read the text.',
};

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
// ── Русӣ: «2 тысячи», «5 тысяч»; ҳазор ҷинси занона дорад (одна, две).
const RU_ONES = ['ноль', 'один', 'два', 'три', 'четыре', 'пять', 'шесть', 'семь', 'восемь', 'девять'];
const RU_TEENS = ['десять', 'одиннадцать', 'двенадцать', 'тринадцать', 'четырнадцать', 'пятнадцать', 'шестнадцать', 'семнадцать', 'восемнадцать', 'девятнадцать'];
const RU_TENS = ['', '', 'двадцать', 'тридцать', 'сорок', 'пятьдесят', 'шестьдесят', 'семьдесят', 'восемьдесят', 'девяносто'];
const RU_HUNDREDS = ['', 'сто', 'двести', 'триста', 'четыреста', 'пятьсот', 'шестьсот', 'семьсот', 'восемьсот', 'девятьсот'];
const ruForm = (value: number, forms: [string, string, string]): string => {
    const last2 = value % 100;
    const last = value % 10;
    if (last2 >= 11 && last2 <= 14) return forms[2];
    if (last === 1) return forms[0];
    if (last >= 2 && last <= 4) return forms[1];
    return forms[2];
};
const ruUnder1000 = (value: number, feminine = false): string => {
    const parts: string[] = [RU_HUNDREDS[Math.floor(value / 100)]];
    const rest = value % 100;
    if (rest >= 10 && rest < 20) parts.push(RU_TEENS[rest - 10]);
    else {
        parts.push(RU_TENS[Math.floor(rest / 10)]);
        const one = rest % 10;
        if (one) parts.push(feminine && one === 1 ? 'одна' : feminine && one === 2 ? 'две' : RU_ONES[one]);
    }
    return parts.filter(Boolean).join(' ');
};
export const numberToRussian = (value: number): string => {
    if (!Number.isFinite(value)) return '';
    if (value < 0) return `минус ${numberToRussian(-value)}`;
    if (value === 0) return RU_ONES[0];
    const millions = Math.floor(value / 1_000_000);
    const thousands = Math.floor((value % 1_000_000) / 1000);
    const rest = value % 1000;
    return [
        millions ? `${ruUnder1000(millions)} ${ruForm(millions, ['миллион', 'миллиона', 'миллионов'])}` : '',
        thousands ? `${ruUnder1000(thousands, true)} ${ruForm(thousands, ['тысяча', 'тысячи', 'тысяч'])}` : '',
        rest ? ruUnder1000(rest) : '',
    ].filter(Boolean).join(' ');
};

// ── Англисӣ.
const EN_ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
    'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const EN_TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const enUnder1000 = (value: number): string => {
    const parts: string[] = [];
    if (value >= 100) parts.push(`${EN_ONES[Math.floor(value / 100)]} hundred`);
    const rest = value % 100;
    if (rest >= 20) parts.push(EN_TENS[Math.floor(rest / 10)] + (rest % 10 ? ` ${EN_ONES[rest % 10]}` : ''));
    else if (rest > 0) parts.push(EN_ONES[rest]);
    return parts.join(' ');
};
export const numberToEnglish = (value: number): string => {
    if (!Number.isFinite(value)) return '';
    if (value < 0) return `minus ${numberToEnglish(-value)}`;
    if (value === 0) return EN_ONES[0];
    const millions = Math.floor(value / 1_000_000);
    const thousands = Math.floor((value % 1_000_000) / 1000);
    const rest = value % 1000;
    return [
        millions ? `${enUnder1000(millions)} million` : '',
        thousands ? `${enUnder1000(thousands)} thousand` : '',
        rest ? enUnder1000(rest) : '',
    ].filter(Boolean).join(' ');
};

export type VoiceLang = 'tj' | 'ru' | 'en';
const NUMBER_WORDS: Record<VoiceLang, (value: number) => string> = {
    tj: numberToTajik,
    ru: numberToRussian,
    en: numberToEnglish,
};

// «то 4000 сомонӣ» ба се забон.
export const spellNumbers = (text: string, lang: VoiceLang = 'tj'): string =>
    text.replace(/\d[\d\s ]*/g, (match) => {
        const digits = match.replace(/[\s ]/g, '');
        const value = Number(digits);
        if (!Number.isFinite(value) || digits.length > 9) return match;
        const tail = /[\s ]$/.test(match) ? ' ' : '';
        return NUMBER_WORDS[lang](value) + tail;
    });

@Injectable()
export class VoiceService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(VoiceService.name);
    private readonly cacheDir = join(process.cwd(), 'voice-cache');
    // Овозҳои пешакӣ — агар ягон ҷумларо дастӣ сохта бошем.
    private readonly packDir = join(process.cwd(), 'voice-pack');
    private readonly tajik = new TajikTts();
    // Русӣ ва англисӣ: пешфарз — Piper Ruslan ва Kokoro am_echo дар process-и алоҳида
    // (TTS_RU_EN=sherpa). Бо TTS_RU_EN=mms — моделҳои пештараи MMS (баргардонидан бе код).
    private readonly sherpa = new SherpaClient(30_000);
    private synthWaiting = 0;
    private readonly foreign: Record<'ru' | 'en', TajikTts> = {
        ru: new TajikTts('voice-model-rus', 'русӣ'),
        en: new TajikTts('voice-model-eng', 'англисӣ'),
    };

    // Сервер 2 ядро дорад: ду синтези ҳамзамон онро мехобонад.
    private queue: Promise<unknown> = Promise.resolve();

    private spendByIp = new Map<string, number[]>();
    private spendToday = { day: '', count: 0 };

    constructor(private readonly configService: ConfigService) { }

    // Кушодани файли 110 МБ 20 сония мегирад — онро дар оғоз мекунем,
    // то дархости аввали корбар фаврӣ бошад.
    private sttClient: any = null;

    onModuleInit(): void {
        // Токени аввал 8 сония мегирифт (бор кардани SDK + TLS-и аввал) —
        // ҳамаашро дар оғоз мекунем, то микрофони корбар интизор намонад.
        if (this.sttKey) {
            const started = Date.now();
            void this.sttToken()
                .then(() => this.logger.log(`Шинохти нутқ тайёр — ${Date.now() - started} мс`))
                .catch(() => undefined);
        }
        if (this.ttsUrl) {
            this.logger.log(`Овоз аз сервери Python — ${this.ttsUrl}`);
        }
        // ONNX-ро ҳамеша гарм мекунем, ҳатто вақте Python асосист: агар он
        // афтад, бозгашт бояд фаврӣ бошад, на 21 сония — вагарна ёвар ях мезанад.
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
            // MMS-и русӣ/англисӣ танҳо дар реҷаи «mms» ба RAM бор мешавад.
            .then(() => this.ruEnEngine === 'mms'
                ? Promise.all(Object.values(this.foreign).filter((model) => model.available).map((model) => model.warmup()))
                : undefined)
            .catch(() => undefined);
    }

    onModuleDestroy(): void {
        this.sherpa.stop();
    }

    private get ruEnEngine(): 'sherpa' | 'mms' {
        return this.configService.get<string>('TTS_RU_EN') === 'mms' ? 'mms' : 'sherpa';
    }

    private foreignAvailable(lang: ForeignLang): boolean {
        return this.ruEnEngine === 'mms' ? this.foreign[lang].available : this.sherpa.available(lang);
    }

    // Як синтез дар як вақт барои ҳамаи забонҳо (2 ядро). Агар навбат пур бошад —
    // 503 бо рамзи TTS_BUSY: frontend «банд аст» мегӯяд ва матнро нишон медиҳад.
    private async exclusive<T>(lang: string, job: () => Promise<T>): Promise<T> {
        if (this.synthWaiting >= MAX_SYNTH_QUEUE) {
            throw new HttpException({ code: 'TTS_BUSY', message: BUSY_MESSAGE[lang] || BUSY_MESSAGE.tj }, HttpStatus.SERVICE_UNAVAILABLE);
        }
        this.synthWaiting += 1;
        try {
            const run = this.queue.catch(() => undefined).then(job);
            this.queue = run;
            return await run;
        } finally {
            this.synthWaiting -= 1;
        }
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
            languages: ['tj', ...(['ru', 'en'] as ForeignLang[]).filter((lang) => this.foreignAvailable(lang))],
            ruEn: this.ruEnEngine,
            cached: count(this.cacheDir, '.wav'),
            packed: count(this.packDir, '.mp3'),
            speechToText: !!this.sttKey,
        };
    }

    // ── Овоз ───────────────────────────────────────────────────────────
    private prepare(rawText: string, lang: VoiceLang = 'tj'): string {
        const text = String(rawText || '').trim();
        if (!text) throw new BadRequestException('Матн холӣ аст');
        if (text.length > MAX_TEXT_LENGTH) {
            throw new BadRequestException(`Матн аз ${MAX_TEXT_LENGTH} ҳарф дароз аст`);
        }
        // Дар луғати mms-tts-rus ҳарфи «ё» нест — «е» мегузорем, вагарна ҳарф гум мешавад.
        // Тоҷикӣ: лотинӣ (AutoCAD, SCADA), %, «ы/щ» — ба шакле, ки модел мехонад.
        const ready = lang === 'tj' ? prepareTajikText(text) : lang === 'en' ? prepareEnglishText(text) : prepareRussianText(text);
        const spelled = spellNumbers(ready, lang);
        return lang === 'ru' ? spelled.replace(/ё/g, 'е').replace(/Ё/g, 'Е') : spelled;
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

    private async remoteSpeak(text: string, speed?: number): Promise<Buffer | null> {
        const url = this.ttsUrl;
        if (!url) return null;

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REMOTE_TTS_TIMEOUT_MS);

        try {
            const response = await fetch(`${url}/api/tts`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(speed ? { text, speed } : { text }),
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

    async speak(rawText: string, speed?: number, rawLang?: string): Promise<{ audio: Buffer; cached: boolean }> {
        const lang: VoiceLang = rawLang === 'ru' || rawLang === 'en' ? rawLang : 'tj';
        if (lang !== 'tj') return this.speakForeign(rawText, lang);

        if (!this.ttsUrl && !this.tajik.available) {
            throw new ServiceUnavailableException('На TTS_URL монда шудааст, на модел дар voice-model/');
        }

        const spoken = this.prepare(rawText);
        const hash = createHash('sha1').update(`${spoken}|${speed ?? 'auto'}`).digest('hex');
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
            audio = await this.exclusive('tj', () => this.tajik.speak(spoken, speed ?? 1));
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

    // Русӣ ва англисӣ: танҳо ONNX (сервери Python танҳо тоҷикиро медонад).
    // Калиди кеш забонро дорад — ибораҳои забонҳои гуногун набояд омехта шаванд.
    private async speakForeign(rawText: string, lang: ForeignLang): Promise<{ audio: Buffer; cached: boolean }> {
        const engine = this.ruEnEngine;
        if (!this.foreignAvailable(lang)) throw new ServiceUnavailableException(`Модели ${lang} дар сервер нест`);

        const spoken = this.prepare(rawText, lang);
        // Калид: забон + модел + матн — садои кӯҳнаи MMS барои овози нав дода намешавад.
        const modelId = engine === 'mms' ? 'mms' : this.sherpa.modelId(lang);
        const hash = createHash('sha1').update(`${lang}|${modelId}|${spoken}`).digest('hex');
        const file = join(this.cacheDir, `${hash}.wav`);
        if (existsSync(file)) {
            try {
                return { audio: await readFile(file), cached: true };
            } catch {
                /* аз нав месозем */
            }
        }

        let audio: Buffer | null;
        try {
            audio = await this.exclusive(lang, async () => {
                if (engine === 'mms') return this.foreign[lang].speak(spoken);
                try {
                    return await this.sherpa.synth(lang, spoken);
                } catch (error) {
                    // Process дар ҳамин лаҳза афтод — як бор дар process-и нав такрор мекунем.
                    if (error instanceof TtsError && error.code === 'TTS_CRASH') return this.sherpa.synth(lang, spoken);
                    throw error;
                }
            });
        } catch (error) {
            if (error instanceof TtsError) {
                this.logger.warn(`Овози ${lang}: ${error.code} — ${error.message}`);
                const timeout = error.code === 'TTS_TIMEOUT';
                throw new HttpException(
                    { code: error.code, message: (timeout ? TIMEOUT_MESSAGE : BUSY_MESSAGE)[lang] },
                    timeout ? HttpStatus.GATEWAY_TIMEOUT : HttpStatus.SERVICE_UNAVAILABLE,
                );
            }
            throw error;
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

    // Танҳо барои санҷиши маҳаллӣ (TTS_WORKER_TEST=1): афтидан ва овезон шудани process.
    testWorker(type: 'crash' | 'hang'): { pid?: number } {
        if (process.env.TTS_WORKER_TEST !== '1') throw new ServiceUnavailableException();
        this.sherpa.sendTest(type);
        return { pid: this.sherpa.pid };
    }

    // ── Шинохти нутқ ───────────────────────────────────────────────────
    // Токени якбораи браузер: калиди аслӣ ба frontend намеравад.
    // Токен баъди 15 дақиқа худаш нест мешавад.
    async sttToken(): Promise<{ token: string }> {
        if (!this.sttKey) throw new ServiceUnavailableException('ELEVENLABS_API_KEY дар .env нест');
        try {
            if (!this.sttClient) {
                const { ElevenLabsClient } = require('@elevenlabs/elevenlabs-js');
                this.sttClient = new ElevenLabsClient({ apiKey: this.sttKey });
            }
            const created: any = await this.sttClient.tokens.singleUse.create('realtime_scribe');
            const token = created?.token || created;
            if (typeof token !== 'string') throw new Error('токен нодуруст');
            return { token };
        } catch (error) {
            this.logger.error(`Токени шинохт сохта нашуд: ${error}`);
            throw new ServiceUnavailableException('Токени шинохти нутқ сохта нашуд');
        }
    }

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
    // Токени ҷараёнӣ = як ибора дар сӯҳбат (баъди ҳар ҷавоб пайвасти нав),
    // пас лимиташ бояд калон бошад: 30 дар 10 дақиқа дар миёнаи сӯҳбат тамом мешуд
    // ва микрофон хомӯш мемонд. Пул барои сонияи садо аст, на барои токен.
    // Лимити садо барои як IP: корбари муқаррарӣ дар як саҳифа 5–10 ибора мешунавад,
    // пас 400 дар 10 дақиқа хеле зиёд аст — танҳо «TTS-и ройгон барои ҳама»-ро манъ мекунад.
    private speakByIp = new Map<string, number[]>();
    guardSpeak(ip = 'unknown'): void {
        if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') return;
        const now = Date.now();
        const recent = (this.speakByIp.get(ip) || []).filter((at) => now - at < IP_WINDOW_MS);
        if (recent.length >= (Number(this.configService.get<string>('VOICE_SPEAK_LIMIT')) || 400)) {
            throw new ServiceUnavailableException('Дархостҳо аз ҳад зиёд — каме интизор шавед');
        }
        recent.push(now);
        this.speakByIp.set(ip, recent);
        if (this.speakByIp.size > 2000) {
            for (const [key, times] of this.speakByIp) {
                if (!times.some((at) => now - at < IP_WINDOW_MS)) this.speakByIp.delete(key);
            }
        }
    }

    guardSpend(ip = 'unknown', kind: 'token' | 'batch' = 'batch'): void {
        const perIp = kind === 'token'
            ? Number(this.configService.get<string>('VOICE_TOKEN_LIMIT')) || 200
            : Number(this.configService.get<string>('VOICE_IP_LIMIT')) || 30;
        const perDay = Number(this.configService.get<string>('VOICE_DAILY_LIMIT')) || 3000;
        ip = `${kind}:${ip}`;
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
