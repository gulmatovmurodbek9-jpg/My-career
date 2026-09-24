import { Injectable, OnModuleInit, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Ҳадди вақт барои як провайдер: провайдери овезонмонда набояд тамоми занҷирро нигоҳ дорад.
const AI_PROVIDER_TIMEOUT_MS = 20000;

// Провайдере, ки афтод, 5 дақиқа гузаронида мешавад.
const AI_PROVIDER_COOLDOWN_MS = 5 * 60 * 1000;

const AI_UNPROVEN_TIMEOUT_MS = 30000;

type AiProvider = 'vertex' | 'gemini';

@Injectable()
export class AiService implements OnModuleInit {
    private genAI: GoogleGenerativeAI | null = null;
    private geminiModel: any = null;
    private vertex: GoogleGenAI | null = null;
    private vertexModel = 'gemini-2.5-flash';
    private providerDownUntil = new Map<AiProvider, number>();
    private providerFailures = new Map<AiProvider, number>();
    private providerProven = new Set<AiProvider>();

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (geminiKey) {
            this.genAI = new GoogleGenerativeAI(geminiKey);
            this.geminiModel = this.genAI.getGenerativeModel({
                model: 'gemini-flash-latest',
                generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as any,
            });
        }

        this.vertexModel = this.configService.get<string>('VERTEX_MODEL') || 'gemini-2.5-flash';

        const project =
            this.configService.get<string>('VERTEX_PROJECT_ID') ||
            this.configService.get<string>('GOOGLE_CLOUD_PROJECT');
        const location = this.configService.get<string>('VERTEX_LOCATION') || 'global';

        if (project) {
            this.vertex = new GoogleGenAI({ vertexai: true, project, location });
            console.log(`AI: Vertex фаъол — лоиҳа ${project}, минтақа ${location}, модел ${this.vertexModel}`);
        } else {
            console.warn('AI: VERTEX_PROJECT_ID танзим нашудааст — танҳо Gemini API истифода мешавад');
        }
    }

    // Занҷир: Vertex → Gemini. Агар яке афтад, навбатӣ кӯшиш мекунад.
    async generateContent(
        prompt: string,
        options: { provider?: AiProvider; timeoutMs?: number } = {},
    ): Promise<string> {
        const run = (which: AiProvider) => {
            if (which === 'vertex') return this.generateVertexContent(prompt);
            return this.generateGeminiContent(prompt);
        };

        const chain: AiProvider[] = options.provider === 'gemini'
            ? ['gemini', 'vertex']
            : ['vertex', 'gemini'];

        const usable = chain.filter((which) => {
            if (which === 'vertex') return !!this.vertex;
            return true;
        });

        const now = Date.now();
        const healthy = usable.filter((which) => (this.providerDownUntil.get(which) ?? 0) <= now);
        const promoted = (which: AiProvider) => this.providerProven.has(which);
        const order = [...(healthy.length ? healthy : usable)]
            .sort((a, b) => Number(promoted(b)) - Number(promoted(a)));

        let last: any = null;
        for (const which of order) {
            const proven = this.providerProven.has(which);
            const requested = Math.max(options.timeoutMs ?? AI_PROVIDER_TIMEOUT_MS, AI_PROVIDER_TIMEOUT_MS);
            const ms = proven ? requested : Math.min(requested, AI_UNPROVEN_TIMEOUT_MS);
            try {
                const result = await this.withTimeout(run(which), which, ms);
                this.providerProven.add(which);
                this.providerFailures.delete(which);
                this.providerDownUntil.delete(which);
                return result;
            } catch (error) {
                last = error;
                const failures = (this.providerFailures.get(which) ?? 0) + 1;
                this.providerFailures.set(which, failures);
                const coolDown = failures >= 2 || (!proven && this.providerProven.size > 0);
                if (coolDown) this.providerDownUntil.set(which, Date.now() + AI_PROVIDER_COOLDOWN_MS);
                console.error(
                    `AI: провайдери ${which} афтод${coolDown ? ` (${AI_PROVIDER_COOLDOWN_MS / 60000} дақ. гузаронида мешавад)` : ''}:`,
                    error?.message || error,
                );
            }
        }
        if (last instanceof HttpException) throw last;

        const rateLimited = this.isRateLimitError(last);
        throw new HttpException(
            {
                message: rateLimited
                    ? 'Лимити AI муваққатан тамом шуд. Баъд аз чанд дақиқа кӯшиш кунед.'
                    : 'Хидмати AI ҳоло дастрас нест. Баъд аз чанд дақиқа кӯшиш кунед.',
                code: rateLimited ? 'AI_RATE_LIMIT' : 'AI_UNAVAILABLE',
                retryAfterSeconds: 60,
            },
            rateLimited ? HttpStatus.TOO_MANY_REQUESTS : HttpStatus.SERVICE_UNAVAILABLE,
        );
    }

    private withTimeout<T>(work: Promise<T>, which: string, ms: number = AI_PROVIDER_TIMEOUT_MS): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(
                () => reject(new Error(`провайдери ${which} дар ${ms} мс ҷавоб надод`)),
                ms,
            );

            work.then(resolve, reject).finally(() => clearTimeout(timer));
        });
    }

    private async generateVertexContent(prompt: string): Promise<string> {
        if (!this.vertex) {
            throw new InternalServerErrorException('Vertex танзим нашудааст (VERTEX_PROJECT_ID)');
        }

        const response = await this.vertex.models.generateContent({
            model: this.vertexModel,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                thinkingConfig: { thinkingBudget: 0 },
            },
        });

        const text = response.text;
        if (!text) {
            throw new Error('Vertex ҷавоби холӣ баргардонд');
        }
        return text;
    }

    private extractRetryDelay(error: any): number | null {
        const retryAfterHeader = error?.headers?.['retry-after'];
        if (retryAfterHeader) {
            return Math.min(Number(retryAfterHeader) * 1000, 30_000);
        }

        if (error?.errorDetails) {
            for (const detail of error.errorDetails) {
                if (detail.retryDelay) {
                    const secs = parseFloat(detail.retryDelay);
                    if (!isNaN(secs)) return Math.min(secs * 1000, 30_000);
                }
            }
        }

        const msg = error?.error?.error?.message || error?.message || '';
        const match = msg.match(/try again in (\d+)m?([\d.]+)?s/i);
        if (match) {
            const mins = match[1] ? parseInt(match[1]) : 0;
            const secs = match[2] ? parseFloat(match[2]) : 0;
            return Math.min((mins * 60 + secs) * 1000, 30_000);
        }

        return null;
    }

    private isRateLimitError(error: any): boolean {
        return error?.status === 429 ||
            error?.statusText === 'Too Many Requests' ||
            error?.error?.error?.code === 'rate_limit_exceeded';
    }

    private isDailyQuotaExhausted(error: any): boolean {
        const msg = error?.error?.error?.message || error?.message || '';
        if (msg.includes('per day') || msg.includes('TPD')) return true;
        if (msg.includes('limit: 0')) return true;
        return false;
    }

    private async generateGeminiContent(prompt: string, retries = 2): Promise<string> {
        if (!this.geminiModel) {
            throw new InternalServerErrorException('Gemini API Key танзим нашудааст');
        }

        let lastError: any = null;
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const result = await this.geminiModel.generateContent(prompt);
                return result.response.text();
            } catch (error) {
                lastError = error;
                console.error(`Gemini Error (attempt ${attempt + 1}/${retries + 1}):`, error?.message || error);

                if (this.isRateLimitError(error)) {
                    if (this.isDailyQuotaExhausted(error)) {
                        console.log('Gemini daily/free-tier quota exhausted.');
                        break;
                    }

                    if (attempt < retries) {
                        const delay = this.extractRetryDelay(error) || 10_000;
                        console.log(`Gemini rate limited, retrying in ${delay}ms...`);
                        await sleep(Math.min(delay, 15_000));
                        continue;
                    }
                }

                break;
            }
        }

        throw lastError ?? new InternalServerErrorException('Gemini ҷавоб надод');
    }
}
