import {
    BadRequestException,
    Injectable,
    Logger,
    ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';
import { existsSync, readdirSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const MAX_TEXT_LENGTH = 500;
const TTS_TIMEOUT_MS = 20_000;
const ELEVEN_URL = 'https://api.elevenlabs.io/v1/text-to-speech';
const STT_URL = 'https://api.elevenlabs.io/v1/speech-to-text';
const STT_TIMEOUT_MS = 25_000;
const MAX_AUDIO_BYTES = 8 * 1024 * 1024;
const IP_WINDOW_MS = 10 * 60 * 1000;

// Scribe баъзан ба хатти форсӣ мегузарад («من» ба ҷойи «ман»), чунки
// тоҷикӣ забони форсист. Калимаҳои маъмулро бармегардонем.
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
    [/وا/g, 'во'],
    [/آن/g, 'он'],
    [/چه/g, 'чӣ'],
    [/و/g, 'ва'],
];

const toCyrillic = (text: string): string => {
    if (!/[؀-ۿ]/.test(text)) return text;
    let result = text;
    for (const [pattern, word] of PERSIAN_WORDS) result = result.replace(pattern, word);
    // Ҳарфи форсии боқимонда маъно надорад — мебарорем.
    return result.replace(/[؀-ۿ‌]+/g, ' ').replace(/s{2,}/g, ' ').trim();
};

// Модел тоҷикиро расман намедонад ва ҳарфҳои хосро вайрон мехонад.
// Барои садо онҳоро ба шакли наздиктарин мегардонем; матни экран дигар намешавад.
const SPEECH_MAP: Record<string, string> = {
    'ӯ': 'у', 'Ӯ': 'У',
    'ӣ': 'и', 'Ӣ': 'И',
    'ғ': 'г', 'Ғ': 'Г',
    'қ': 'к', 'Қ': 'К',
    'ҳ': 'х', 'Ҳ': 'Х',
    'ҷ': 'дж', 'Ҷ': 'Дж',
};

export const sayify = (text: string): string =>
    text.replace(/[ӯӮӣӢғҒқҚҳҲҷҶ]/g, (letter) => SPEECH_MAP[letter] ?? letter);

@Injectable()
export class VoiceService {
    private readonly logger = new Logger(VoiceService.name);
    private readonly cacheDir = join(process.cwd(), 'voice-cache');

    constructor(private readonly configService: ConfigService) { }

    private get apiKey(): string | null {
        return this.configService.get<string>('ELEVENLABS_API_KEY') || null;
    }

    private get voiceId(): string {
        return this.configService.get<string>('ELEVENLABS_VOICE_ID') || 'o6mkaley5d7ALxBgZ1dx';
    }

    private get modelId(): string {
        return this.configService.get<string>('ELEVENLABS_MODEL_ID') || 'eleven_multilingual_v2';
    }

    // Аз .env идора мешаванд, то овозро бе тағйири код танзим кунем.
    private get voiceSettings() {
        const num = (key: string, fallback: number) => {
            const value = Number(this.configService.get<string>(key));
            return Number.isFinite(value) ? value : fallback;
        };
        return {
            stability: num('ELEVENLABS_STABILITY', 0.75),
            similarity_boost: num('ELEVENLABS_SIMILARITY', 0.95),
            style: num('ELEVENLABS_STYLE', 0),
            use_speaker_boost: this.configService.get<string>('ELEVENLABS_SPEAKER_BOOST') !== 'false',
        };
    }

    // Танзимро нишон медиҳад, вале худи калидро ҳеҷ гоҳ бармегардонад.
    status() {
        let cached = 0;
        try {
            if (existsSync(this.cacheDir)) {
                cached = readdirSync(this.cacheDir).filter((name) => name.endsWith('.mp3')).length;
            }
        } catch {
            cached = 0;
        }

        return {
            configured: !!this.apiKey,
            voiceId: this.voiceId,
            model: this.modelId,
            cached,
        };
    }

    // Браузер тоҷикиро намешиносад ва «муҳандис»-ро «мультик» мешунавад.
    // Scribe забони тоҷикиро мешиносад ва ҳамон калиди мо кор мекунад.
    private spendByIp = new Map<string, number[]>();
    private spendToday = { day: '', count: 0 };

    // Кеш ройгон аст — танҳо сохтани садои НАВ пул мегирад, пас
    // ҳамонро ҳисоб мекунем. Ду сатҳ: як корбар ва тамоми рӯз.
    guardSpend(ip = 'unknown'): void {
        const perIp = Number(this.configService.get<string>('VOICE_IP_LIMIT')) || 15;
        const perDay = Number(this.configService.get<string>('VOICE_DAILY_LIMIT')) || 400;
        const now = Date.now();
        const today = new Date().toISOString().slice(0, 10);

        if (this.spendToday.day !== today) this.spendToday = { day: today, count: 0 };
        if (this.spendToday.count >= perDay) {
            this.logger.warn(`Лимити рӯзона пур шуд (${perDay})`);
            throw new ServiceUnavailableException('Лимити рӯзонаи овоз пур шуд');
        }

        const recent = (this.spendByIp.get(ip) || []).filter((at) => now - at < IP_WINDOW_MS);
        if (recent.length >= perIp) {
            throw new ServiceUnavailableException('Дархостҳо аз ҳад зиёд — каме интизор шавед');
        }

        recent.push(now);
        this.spendByIp.set(ip, recent);
        this.spendToday.count += 1;

        // Хотираро тоза нигоҳ медорем.
        if (this.spendByIp.size > 500) {
            for (const [key, times] of this.spendByIp) {
                if (!times.some((at) => now - at < IP_WINDOW_MS)) this.spendByIp.delete(key);
            }
        }
    }

    async transcribe(buffer?: Buffer, mimetype?: string): Promise<{ text: string }> {
        if (!buffer?.length) throw new BadRequestException('Садо холӣ аст');
        if (buffer.length > MAX_AUDIO_BYTES) throw new BadRequestException('Садо хеле калон аст');
        if (!this.apiKey) throw new ServiceUnavailableException('ELEVENLABS_API_KEY дар .env нест');

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
                headers: { 'xi-api-key': this.apiKey },
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

    resolveCache(rawText: string): { file: string; spoken: string } {
        const text = String(rawText || '').trim();
        if (!text) throw new BadRequestException('Матн холӣ аст');
        if (text.length > MAX_TEXT_LENGTH) {
            throw new BadRequestException(`Матн аз ${MAX_TEXT_LENGTH} ҳарф дароз аст`);
        }
        const spoken = sayify(text);
        const hash = createHash('sha1')
            .update([this.voiceId, this.modelId, spoken].join('|'))
            .digest('hex');
        return { file: join(this.cacheDir, `${hash}.mp3`), spoken };
    }

    async readCache(file: string): Promise<Buffer | null> {
        if (!existsSync(file)) return null;
        try {
            return await readFile(file);
        } catch {
            return null;
        }
    }

    // Садоро пора-пора мефиристем: браузер пеш аз тайёр шудани тамоми файл
    // хондан сар мекунад. Ҳамзамон онро дар кеш ҷамъ мекунем.
    async streamAudio(spoken: string, file: string, onChunk: (chunk: Buffer) => void): Promise<void> {
        if (!this.apiKey) {
            throw new ServiceUnavailableException('ELEVENLABS_API_KEY дар .env нест');
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

        try {
            const response = await fetch(
                `${ELEVEN_URL}/${this.voiceId}/stream?output_format=mp3_44100_128`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'audio/mpeg',
                        'xi-api-key': this.apiKey,
                    },
                    body: JSON.stringify({
                        text: spoken,
                        model_id: this.modelId,
                        voice_settings: this.voiceSettings,
                    }),
                    signal: controller.signal,
                },
            );

            if (!response.ok || !response.body) {
                const detail = (await response.text()).slice(0, 200);
                this.logger.error(`ElevenLabs stream ${response.status}: ${detail}`);
                throw new ServiceUnavailableException(`ElevenLabs ҷавоб надод (${response.status})`);
            }

            const parts: Buffer[] = [];
            const reader = response.body.getReader();
            for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                const chunk = Buffer.from(value);
                parts.push(chunk);
                onChunk(chunk);
            }

            try {
                await mkdir(this.cacheDir, { recursive: true });
                await writeFile(file, Buffer.concat(parts));
            } catch (error) {
                this.logger.warn(`Кеш нигоҳ дошта нашуд: ${error}`);
            }
        } finally {
            clearTimeout(timer);
        }
    }

    async speak(rawText: string): Promise<{ audio: Buffer; cached: boolean }> {
        const text = String(rawText || '').trim();
        if (!text) throw new BadRequestException('Матн холӣ аст');
        if (text.length > MAX_TEXT_LENGTH) {
            throw new BadRequestException(`Матн аз ${MAX_TEXT_LENGTH} ҳарф дароз аст`);
        }

        const spoken = sayify(text);
        const hash = createHash('sha1')
            .update([this.voiceId, this.modelId, spoken].join('|'))
            .digest('hex');
        const file = join(this.cacheDir, `${hash}.mp3`);

        // Ҳар ҷумла танҳо як маротиба пул мегирад — баъдан аз диск меояд.
        if (existsSync(file)) {
            return { audio: await readFile(file), cached: true };
        }

        if (!this.apiKey) {
            throw new ServiceUnavailableException('ELEVENLABS_API_KEY дар .env нест');
        }

        const audio = await this.requestAudio(spoken);
        try {
            await mkdir(this.cacheDir, { recursive: true });
            await writeFile(file, audio);
        } catch (error) {
            this.logger.warn(`Кеш нигоҳ дошта нашуд: ${error}`);
        }

        return { audio, cached: false };
    }

    private async requestAudio(spoken: string): Promise<Buffer> {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), TTS_TIMEOUT_MS);

        try {
            const response = await fetch(
                `${ELEVEN_URL}/${this.voiceId}?output_format=mp3_44100_128`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Accept: 'audio/mpeg',
                        'xi-api-key': this.apiKey as string,
                    },
                    body: JSON.stringify({
                        text: spoken,
                        model_id: this.modelId,
                        voice_settings: this.voiceSettings,
                    }),
                    signal: controller.signal,
                },
            );

            if (!response.ok) {
                const detail = (await response.text()).slice(0, 200);
                this.logger.error(`ElevenLabs ${response.status}: ${detail}`);
                if (response.status === 401) {
                    throw new ServiceUnavailableException('Калиди ElevenLabs нодуруст аст');
                }
                if (response.status === 429) {
                    throw new ServiceUnavailableException('Лимити ElevenLabs тамом шуд');
                }
                throw new ServiceUnavailableException(`ElevenLabs ҷавоб надод (${response.status})`);
            }

            return Buffer.from(await response.arrayBuffer());
        } catch (error: any) {
            if (error?.name === 'AbortError') {
                throw new ServiceUnavailableException('ElevenLabs дер кард');
            }
            throw error;
        } finally {
            clearTimeout(timer);
        }
    }
}
