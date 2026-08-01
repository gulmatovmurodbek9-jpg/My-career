import { Injectable, OnModuleInit, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import * as fs from 'fs';
import * as path from 'path';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

@Injectable()
export class AiService implements OnModuleInit {
    private genAI: GoogleGenerativeAI | null = null;
    private geminiModel: any = null;
    private groq: Groq | null = null;

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (geminiKey) {
            this.genAI = new GoogleGenerativeAI(geminiKey);
            this.geminiModel = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        }

        const groqKey = this.configService.get<string>('GROQ_API_KEY');
        if (groqKey) {
            this.groq = new Groq({ apiKey: groqKey });
        }
    }

    /**
     * Transcribe audio using Groq Whisper (whisper-large-v3)
     * Uses full model + prompt hints for maximum accuracy
     */
    async transcribeAudio(filePath: string, lang: string = 'tg'): Promise<string> {
        if (!this.groq) {
            throw new InternalServerErrorException('Groq API Key танзим нашудааст');
        }

        // Map our lang codes to Whisper language codes
        const whisperLang: Record<string, string> = { tj: 'tg', ru: 'ru', en: 'en' };
        const language = whisperLang[lang] || 'ru';

        // Prompt hints improve accuracy for domain-specific vocabulary
        const promptHints: Record<string, string> = {
            tg: 'Ихтисос, маош, донишгоҳ, барномасоз, касб, таълим, кор, мутахассис, сомонӣ, Тоҷикистон, Душанбе',
            ru: 'Профессия, зарплата, университет, программист, карьера, образование, работа, специалист',
            en: 'Career, salary, university, programmer, profession, education, job, specialist',
        };

        try {
            const transcription = await this.groq.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: 'whisper-large-v3',
                language,
                prompt: promptHints[language] || promptHints['ru'],
                response_format: 'verbose_json',
                temperature: 0.0, // deterministic = more accurate
            });

            // Extract text from verbose response
            const text = (transcription as any)?.text || (transcription as any)?.toString?.() || String(transcription);
            return text.trim();
        } catch (error) {
            console.error('Whisper transcription error:', error?.message || error);
            // Fallback to turbo model if full model fails
            try {
                const fallback = await this.groq.audio.transcriptions.create({
                    file: fs.createReadStream(filePath),
                    model: 'whisper-large-v3-turbo',
                    language,
                    response_format: 'text',
                });
                return ((fallback as any)?.toString?.() || String(fallback)).trim();
            } catch {
                throw new InternalServerErrorException('Хатогӣ ҳангоми табдили овоз ба матн');
            }
        }
    }

    async generateContent(prompt: string, options: { provider?: 'gemini' | 'groq' } = {}): Promise<string> {
        const provider = options.provider || 'groq';

        if (provider === 'groq') {
            return this.generateGroqContent(prompt);
        } else {
            return this.generateGeminiContent(prompt);
        }
    }

    /**
     * Extract retry delay (in ms) from a rate-limit error.
     * Handles both Groq ("retry-after" header or message text) and Gemini (retryDelay field).
     */
    private extractRetryDelay(error: any): number | null {
        // 1. Groq: retry-after header (seconds)
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
        // Groq: "tokens per day (TPD)"
        if (msg.includes('per day') || msg.includes('TPD')) return true;
        // Gemini: "free_tier" with limit: 0
        if (msg.includes('limit: 0')) return true;
        return false;
    }

    private async generateGroqContent(prompt: string, retries = 2): Promise<string> {
        if (!this.groq) {
            throw new InternalServerErrorException('Groq API Key танзим нашудааст');
        }

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const completion = await this.groq.chat.completions.create({
                    messages: [{ role: 'user', content: prompt }],
                    model: 'llama-3.3-70b-versatile',
                });
                return completion.choices[0]?.message?.content || '';
            } catch (error) {
                console.error(`Groq Error (attempt ${attempt + 1}/${retries + 1}):`, error?.message || error);

                if (this.isRateLimitError(error)) {
                    // If daily quota exhausted, skip retry and fallback immediately
                    if (this.isDailyQuotaExhausted(error)) {
                        console.log('Groq daily quota exhausted, falling back to Gemini...');
                        break;
                    }

                    // Short rate limit — try waiting
                    if (attempt < retries) {
                        const delay = this.extractRetryDelay(error) || 10_000;
                        console.log(`Groq rate limited, retrying in ${delay}ms...`);
                        await sleep(Math.min(delay, 15_000));
                        continue;
                    }
                }

                // Last attempt or non-rate-limit error: fallback to Gemini
                break;
            }
        }

        // Fallback to Gemini
        if (this.geminiModel) {
            console.log('Falling back to Gemini...');
            return this.generateGeminiContent(prompt);
        }

        throw new HttpException(
            {
                message: 'Лимити рӯзонаи AI тамом шуд. Лутфан баъд аз чанд дақиқа кӯшиш кунед.',
                code: 'AI_RATE_LIMIT',
                retryAfterSeconds: 60,
            },
            HttpStatus.TOO_MANY_REQUESTS,
        );
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
