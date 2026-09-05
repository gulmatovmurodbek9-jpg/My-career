import { Injectable, OnModuleInit, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@Injectable()
export class AiService implements OnModuleInit {
    private genAI: GoogleGenerativeAI | null = null;
    private geminiModel: any = null;
    private vertex: GoogleGenAI | null = null;
    private vertexModel = 'gemini-2.5-flash';

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (geminiKey) {
            this.genAI = new GoogleGenerativeAI(geminiKey);
            // Алиас, на версияи мушаххас: gemini-2.0-flash ва gemini-2.5-flash аллакай
            // бекор шудаанд ва ҳар як бекоркунӣ тамоми AI-ро мекушт.
            this.geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
        }

        this.vertexModel = this.configService.get<string>('VERTEX_MODEL') || 'gemini-2.5-flash';

        // Vertex AI бо лоиҳаи воқеии Google Cloud кор мекунад: ҳисоб ба ҳамон
        // лоиҳа меравад ва кредити $300 аз ҳамон ҷо сарф мешавад.
        const project =
            this.configService.get<string>('VERTEX_PROJECT_ID') ||
            this.configService.get<string>('GOOGLE_CLOUD_PROJECT');
        const location = this.configService.get<string>('VERTEX_LOCATION') || 'global';

        if (project) {
            // Эътимоднома аз GOOGLE_APPLICATION_CREDENTIALS (файли калиди ҳисоби
            // хизматӣ) ё аз `gcloud auth application-default login` гирифта мешавад.
            this.vertex = new GoogleGenAI({ vertexai: true, project, location });
            console.log(`AI: Vertex фаъол — лоиҳа ${project}, минтақа ${location}, модел ${this.vertexModel}`);
        } else {
            console.warn('AI: VERTEX_PROJECT_ID танзим нашудааст — танҳо Gemini API истифода мешавад');
        }
    }

    /**
     * Матн месозад, бо гузариши худкор аз Vertex ба Gemini.
     *
     * Ҳарду ба ҳамон ҳисоби Google Cloud-и корбар пайвастанд. Vertex аввал
     * меистад; агар `aiplatform.googleapis.com` дар лоиҳа фаъол набошад, он
     * 403 медиҳад ва дархост бесадо ба Gemini мегузарад. Баъди фаъол шудани
     * API ҳамон код худаш ба Vertex мегузарад.
     *
     * Танҳо провайдерҳои Google истифода мешаванд.
     */
    async generateContent(
        prompt: string,
        options: { provider?: 'vertex' | 'gemini' } = {},
    ): Promise<string> {
        const run = (which: 'vertex' | 'gemini') =>
            which === 'vertex' ? this.generateVertexContent(prompt) : this.generateGeminiContent(prompt);

        const chain: Array<'vertex' | 'gemini'> = options.provider === 'gemini'
            ? ['gemini', 'vertex']
            : ['vertex', 'gemini'];

        const usable = chain.filter((which) => which !== 'vertex' || this.vertex);

        let last: any = null;
        for (const which of usable) {
            try {
                return await run(which);
            } catch (error) {
                last = error;
                console.error(`AI: провайдери ${which} афтод:`, error?.message || error);
            }
        }
        throw last ?? new InternalServerErrorException('Ҳеҷ провайдери AI дастрас нест');
    }

    /**
     * Vertex AI тавассути SDK-и расмӣ.
     *
     * Дархост ба `aiplatform.googleapis.com` бо эътимодномаи ҳисоби хизматӣ
     * меравад, на бо калиди оддии API — танҳо ҳамин роҳ ба лоиҳа ва кредити
     * Google Cloud пайваст мешавад.
     */
    private async generateVertexContent(prompt: string): Promise<string> {
        if (!this.vertex) {
            throw new InternalServerErrorException('Vertex танзим нашудааст (VERTEX_PROJECT_ID)');
        }

        const response = await this.vertex.models.generateContent({
            model: this.vertexModel,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
        });

        const text = response.text;
        if (!text) {
            throw new Error('Vertex ҷавоби холӣ баргардонд');
        }
        return text;
    }

    /**
     * Extract retry delay (in ms) from a rate-limit error.
     * Handles the retry-after header and Gemini's retryDelay field.
     */
    private extractRetryDelay(error: any): number | null {
        // 1. retry-after header (seconds)
        const retryAfterHeader = error?.headers?.['retry-after'];
        if (retryAfterHeader) {
            return Math.min(Number(retryAfterHeader) * 1000, 30_000);
        }

        // 2. Gemini: errorDetails retryDelay
        if (error?.errorDetails) {
            for (const detail of error.errorDetails) {
                if (detail.retryDelay) {
                    const secs = parseFloat(detail.retryDelay);
                    if (!isNaN(secs)) return Math.min(secs * 1000, 30_000);
                }
            }
        }

        // 3. Parse "Please try again in Xm Ys" from message
        const msg = error?.error?.error?.message || error?.message || '';
        const match = msg.match(/try again in (\d+)m?([\d.]+)?s/i);
        if (match) {
            const mins = match[1] ? parseInt(match[1]) : 0;
            const secs = match[2] ? parseFloat(match[2]) : 0;
            return Math.min((mins * 60 + secs) * 1000, 30_000);
        }

        return null;
    }

    /**
     * Check if error is a rate-limit (429) error.
     */
    private isRateLimitError(error: any): boolean {
        return error?.status === 429 ||
            error?.statusText === 'Too Many Requests' ||
            error?.error?.error?.code === 'rate_limit_exceeded';
    }

    /**
     * Check if the rate-limit is a DAILY quota (not recoverable by short retry).
     */
    private isDailyQuotaExhausted(error: any): boolean {
        const msg = error?.error?.error?.message || error?.message || '';
        // "tokens per day (TPD)"
        if (msg.includes('per day') || msg.includes('TPD')) return true;
        // Gemini: "free_tier" with limit: 0
        if (msg.includes('limit: 0')) return true;
        return false;
    }

    private async generateGeminiContent(prompt: string, retries = 2): Promise<string> {
        if (!this.geminiModel) {
            throw new InternalServerErrorException('Gemini API Key танзим нашудааст');
        }

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const result = await this.geminiModel.generateContent(prompt);
                return result.response.text();
            } catch (error) {
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

        // Both providers exhausted
        throw new HttpException(
            {
                message: 'Лимити рӯзонаи AI тамом шуд. Лутфан баъд аз чанд дақиқа кӯшиш кунед.',
                code: 'AI_RATE_LIMIT',
                retryAfterSeconds: 60,
            },
            HttpStatus.TOO_MANY_REQUESTS,
        );
    }
}
