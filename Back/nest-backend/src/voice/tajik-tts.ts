import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '@nestjs/common';

// Модели VITS дар ONNX — бе Python, бе torch, танҳо onnxruntime дар худи Node.
// Тоҷикӣ: модели худамон (аз facebook/mms-tts-tgk омӯзонида шуд) дар voice-model/.
// Русӣ ва англисӣ: facebook/mms-tts-rus/-eng дар voice-model-rus/ ва voice-model-eng/
// (tajik-tts/export-mms-onnx.py). Ҳамаашон як формат доранд, пас синф якест.

// Ҷумлаи хеле дароз хотираро мехӯрад ва садояш якранг мешавад.
const MAX_CHUNK = 160;
const PAUSE_SECONDS = 0.35;
const COMMA_PAUSE_SECONDS = 0.14;

interface TtsMeta {
    vocab: Record<string, number>;
    addBlank: boolean;
    normalize: boolean;
    padToken: string;
    samplingRate: number;
}

export class TajikTts {
    private readonly logger = new Logger(TajikTts.name);
    private readonly dir: string;
    private readonly metaFile: string;

    constructor(folder = 'voice-model', private readonly label = 'тоҷикӣ') {
        this.dir = join(process.cwd(), folder);
        this.metaFile = join(this.dir, 'tajik-tts.json');
    }

    // Colab моделро ҳамчун onnx/model.onnx мебарорад; номи кӯҳна низ қабул мешавад.
    private modelFile(): string | null {
        return [join(this.dir, 'onnx', 'model.onnx'), join(this.dir, 'tajik-tts.onnx')]
            .find((path) => existsSync(path)) || null;
    }
    private session: any = null;
    private meta: TtsMeta | null = null;
    private loading: Promise<boolean> | null = null;

    get available(): boolean {
        return !!this.modelFile() && existsSync(this.metaFile);
    }

    get sampleRate(): number {
        return this.meta?.samplingRate || 16000;
    }

    // Модел вазнин аст — онро як маротиба ва танҳо ҳангоми ниёз мекушоем.
    // Аз берун: моделро пешакӣ мекушоем, то корбари аввал интизор нашавад.
    warmup(): Promise<boolean> {
        return this.load();
    }

    private async load(): Promise<boolean> {
        if (this.session) return true;
        if (!this.available) return false;
        if (this.loading) return this.loading;

        this.loading = (async () => {
            try {
                const ort = require('onnxruntime-node');
                this.meta = JSON.parse(readFileSync(this.metaFile, 'utf8'));
                this.session = await ort.InferenceSession.create(this.modelFile() as string, {
                    executionProviders: ['cpu'],
                    graphOptimizationLevel: 'all',
                });
                this.logger.log(`Модели ${this.label} кушода шуд — ${this.sampleRate} Hz`);
                return true;
            } catch (error) {
                this.logger.error(`Модели ${this.label} кушода нашуд: ${error}`);
                this.session = null;
                return false;
            } finally {
                this.loading = null;
            }
        })();

        return this.loading;
    }

    // Токенизатори VitsTokenizer: хурдҳарфӣ, партофтани аломатҳои бегона,
    // ва гузоштани холӣ байни ҳарфҳо (add_blank).
    encodeText(text: string): number[] {
        if (!this.meta) this.meta = JSON.parse(readFileSync(this.metaFile, 'utf8'));
        const meta = this.meta;
        const source = meta.normalize ? text.toLowerCase() : text;
        const ids: number[] = [];

        // Таваққуфи хурд («— ») пеш аз ҷумла: бе он модел калимаи аввалро фурӯ мебарад
        // («Маоши…» → «Ваши…»). Санҷиш: калимаи аввал 3/6 → 6/6 (test-lead-pause.py).
        const pause = ['—', '–', '-'].find((char) => typeof meta.vocab[char] === 'number');
        if (pause) {
            ids.push(meta.vocab[pause]);
            if (typeof meta.vocab[' '] === 'number') ids.push(meta.vocab[' ']);
        }

        for (const char of source) {
            const id = meta.vocab[char];
            if (typeof id === 'number') ids.push(id);
        }

        if (!meta.addBlank) return ids;

        const pad = meta.vocab[meta.padToken] ?? 0;
        const spaced: number[] = new Array(ids.length * 2 + 1).fill(pad);
        for (let index = 0; index < ids.length; index += 1) {
            spaced[index * 2 + 1] = ids[index];
        }
        return spaced;
    }

    // float32 [-1..1] → WAV 16-bit mono.
    private toWav(samples: Float32Array): Buffer {
        const rate = this.sampleRate;
        const data = Buffer.alloc(samples.length * 2);
        for (let index = 0; index < samples.length; index += 1) {
            const clamped = Math.max(-1, Math.min(1, samples[index]));
            data.writeInt16LE(Math.round(clamped * 32767), index * 2);
        }

        const header = Buffer.alloc(44);
        header.write('RIFF', 0);
        header.writeUInt32LE(36 + data.length, 4);
        header.write('WAVE', 8);
        header.write('fmt ', 12);
        header.writeUInt32LE(16, 16);
        header.writeUInt16LE(1, 20);
        header.writeUInt16LE(1, 22);
        header.writeUInt32LE(rate, 24);
        header.writeUInt32LE(rate * 2, 28);
        header.writeUInt16LE(2, 32);
        header.writeUInt16LE(16, 34);
        header.write('data', 36);
        header.writeUInt32LE(data.length, 40);

        return Buffer.concat([header, data]);
    }

    // Матнро ба ҷумлаҳо мебурад; ҷумлаи дароз аз рӯи вергул ё фосила бурида мешавад.
    static split(text: string, maxLen = MAX_CHUNK): string[] {
        const sentences = text.match(/[^.!?…]+[.!?…]*/g) || [text];
        const out: string[] = [];

        for (const raw of sentences) {
            let part = raw.trim();
            if (!part) continue;

            while (part.length > maxLen) {
                let cut = part.lastIndexOf(',', maxLen);
                if (cut <= 20) cut = part.lastIndexOf(' ', maxLen);
                if (cut <= 0) cut = maxLen;
                out.push(part.slice(0, cut + 1).trim());
                part = part.slice(cut + 1).trim();
            }
            if (part) out.push(part);
        }

        return out;
    }

    private async synthesize(text: string): Promise<Float32Array | null> {
        const ids = this.encodeText(text);
        if (ids.length < 3) return null;

        const ort = require('onnxruntime-node');
        const length = ids.length;
        const inputIds = new ort.Tensor('int64', BigInt64Array.from(ids.map((n) => BigInt(n))), [1, length]);
        const attention = new ort.Tensor('int64', BigInt64Array.from(new Array(length).fill(BigInt(1))), [1, length]);

        const feeds: Record<string, any> = {};
        for (const name of this.session.inputNames) {
            feeds[name] = name.includes('attention') ? attention : inputIds;
        }

        const output = await this.session.run(feeds);
        return output[this.session.outputNames[0]].data as Float32Array;
    }

    // Дар луғати модел вергул нест — бе ин ҳамаи ҷумла бе нафас якҷоя хонда мешуд.
    // Ҷумла аз рӯи «, ; :» ба қисмҳо ҷудо мешавад ва байнашон таваққуфи кӯтоҳ.
    // Қисмҳои хеле кӯтоҳ («Салом,») ба қисми навбатӣ ҳамроҳ мешаванд.
    static phrases(sentence: string): string[] {
        const parts = sentence.split(/(?<=[,;:])\s+/).map((part) => part.trim()).filter(Boolean);
        const out: string[] = [];
        for (const part of parts) {
            const last = out[out.length - 1];
            if (last !== undefined && (last.length < 14 || part.length < 8)) out[out.length - 1] = `${last} ${part}`;
            else out.push(part);
        }
        return out;
    }

    async speak(text: string, speed = 1): Promise<Buffer | null> {
        if (!(await this.load())) return null;

        const chunks = TajikTts.split(text);
        if (!chunks.length) return null;

        const gap = Math.round(this.sampleRate * PAUSE_SECONDS);
        const commaGap = Math.round(this.sampleRate * COMMA_PAUSE_SECONDS);
        const pieces: Float32Array[] = [];

        try {
            for (const [index, chunk] of chunks.entries()) {
                const phrases = TajikTts.phrases(chunk);
                for (const [phraseIndex, phrase] of phrases.entries()) {
                    const wave = await this.synthesize(phrase);
                    if (!wave?.length) continue;
                    pieces.push(wave);
                    if (phraseIndex < phrases.length - 1) pieces.push(new Float32Array(commaGap));
                }
                if (index < chunks.length - 1) pieces.push(new Float32Array(gap));
            }
        } catch (error) {
            this.logger.error(`Синтез нашуд: ${error}`);
            return null;
        }

        if (!pieces.length) return null;

        const total = pieces.reduce((sum, piece) => sum + piece.length, 0);
        const all = new Float32Array(total);
        let offset = 0;
        for (const piece of pieces) {
            all.set(piece, offset);
            offset += piece.length;
        }

        // Суръат ҳангоми табдил ба ONNX дар худи модел сабт шудааст —
        // баъдан онро тағйир дода намешавад, вале дар кеш фарқ мекунад.
        void speed;
        return this.toWav(all);
    }
}
