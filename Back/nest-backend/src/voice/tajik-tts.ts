import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '@nestjs/common';

// Модели VITS-и худамон (аз facebook/mms-tts-tgk омӯзонида шуд), ба ONNX табдил дода.
// Бе Python, бе torch — танҳо onnxruntime дар худи Node.
const MODEL_DIR = join(process.cwd(), 'voice-model');
const MODEL_FILE = join(MODEL_DIR, 'tajik-tts.onnx');
const META_FILE = join(MODEL_DIR, 'tajik-tts.json');

interface TtsMeta {
    vocab: Record<string, number>;
    addBlank: boolean;
    normalize: boolean;
    padToken: string;
    samplingRate: number;
}

export class TajikTts {
    private readonly logger = new Logger(TajikTts.name);
    private session: any = null;
    private meta: TtsMeta | null = null;
    private loading: Promise<boolean> | null = null;

    get available(): boolean {
        return existsSync(MODEL_FILE) && existsSync(META_FILE);
    }

    get sampleRate(): number {
        return this.meta?.samplingRate || 16000;
    }

    // Модел вазнин аст — онро як маротиба ва танҳо ҳангоми ниёз мекушоем.
    private async load(): Promise<boolean> {
        if (this.session) return true;
        if (!this.available) return false;
        if (this.loading) return this.loading;

        this.loading = (async () => {
            try {
                const ort = require('onnxruntime-node');
                this.meta = JSON.parse(readFileSync(META_FILE, 'utf8'));
                this.session = await ort.InferenceSession.create(MODEL_FILE, {
                    executionProviders: ['cpu'],
                    graphOptimizationLevel: 'all',
                });
                this.logger.log(`Модели тоҷикӣ кушода шуд — ${this.sampleRate} Hz`);
                return true;
            } catch (error) {
                this.logger.error(`Модел кушода нашуд: ${error}`);
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
    private encode(text: string): number[] {
        const meta = this.meta!;
        const source = meta.normalize ? text.toLowerCase() : text;
        const ids: number[] = [];

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

    async speak(text: string): Promise<Buffer | null> {
        if (!(await this.load())) return null;

        const ids = this.encode(text);
        if (ids.length < 3) return null;

        try {
            const ort = require('onnxruntime-node');
            const length = ids.length;
            const inputIds = new ort.Tensor('int64', BigInt64Array.from(ids.map((n) => BigInt(n))), [1, length]);
            const attention = new ort.Tensor('int64', BigInt64Array.from(new Array(length).fill(BigInt(1))), [1, length]);

            const feeds: Record<string, any> = {};
            for (const name of this.session.inputNames) {
                if (name.includes('attention')) feeds[name] = attention;
                else feeds[name] = inputIds;
            }

            const output = await this.session.run(feeds);
            const first = output[this.session.outputNames[0]];
            return this.toWav(first.data as Float32Array);
        } catch (error) {
            this.logger.error(`Синтез нашуд: ${error}`);
            return null;
        }
    }
}
