import { Injectable, OnModuleInit, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as path from 'path';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/*
 * Ҳадди вақт барои як провайдери AI. Се провайдер × 20с = 60с дар бадтарин
 * ҳолат, ки аз timeout-и 90-сонияи frontend камтар аст — яъне корбар ҳамеша
 * ё ҷавоб мегирад, ё паёми фаҳмо. Бо 25с се провайдер аз он ҳадд мегузаштанд.
 */
const AI_PROVIDER_TIMEOUT_MS = 20000;

type AiProvider = 'vertex' | 'gemini' | 'groq';

@Injectable()
export class AiService implements OnModuleInit {
    private genAI: GoogleGenerativeAI | null = null;
    private geminiModel: any = null;
    private vertex: GoogleGenAI | null = null;
    private vertexModel = 'gemini-2.5-flash';
    private groqKey: string | null = null;
    private groqModel = 'openai/gpt-oss-120b';

    constructor(private configService: ConfigService) { }

    onModuleInit() {
        const geminiKey = this.configService.get<string>('GEMINI_API_KEY');
        if (geminiKey) {
            this.genAI = new GoogleGenerativeAI(geminiKey);
            // Алиас, на версияи мушаххас: gemini-2.0-flash ва gemini-2.5-flash аллакай
            // бекор шудаанд ва ҳар як бекоркунӣ тамоми AI-ро мекушт.
            this.geminiModel = this.genAI.getGenerativeModel({
                model: 'gemini-flash-latest',
                /*
                 * «Фикркунӣ» хомӯш — ҳамон сабабе, ки дар Vertex.
                 *
                 * Ин роҳ дар сервер асосист: он ҷо VERTEX_PROJECT_ID нест, аз
                 * ин рӯ ҳамаи дархостҳо маҳз аз ҳамин ҷо мегузаранд. Дар
                 * ченкунӣ модел 749 токени фикрро пеш аз ҷавоб месӯзонд ва
                 * даъват 4.9 сония мекашид; бе он ҳамон дархост дар 1.7
                 * сония иҷро мешавад.
                 */
                generationConfig: { thinkingConfig: { thinkingBudget: 0 } } as any,
            });
        }

        /*
         * Groq — провайдери сеюм, берун аз Google.
         *
         * Vertex ва Gemini ҳарду ба ҳамон инфрасохтори Google мераванд:
         * вақте Gemini 503 «серталабӣ» медиҳад, Vertex низ ҳамон ҳол аст.
         * Дар сервер VERTEX_PROJECT_ID нест, яъне занҷир аз як ҳалқа иборат
         * буд ва як садамаи Google тамоми AI-и барномаро мекушт. Groq
         * шабакаи тамоман дигар аст ва калидаш аллакай дар сервер буд, вале
         * ҳеҷ ҷо хонда намешуд.
         */
        this.groqKey = this.configService.get<string>('GROQ_API_KEY') || null;
        this.groqModel = this.configService.get<string>('GROQ_MODEL') || 'openai/gpt-oss-120b';
        if (this.groqKey) {
            console.log(`AI: Groq ҳамчун захира фаъол — модел ${this.groqModel}`);
        } else {
            console.warn('AI: GROQ_API_KEY нест — агар Gemini афтад, захира намемонад');
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
     * Матн месозад, бо гузариши худкор аз Vertex ба Gemini ва баъд ба Groq.
     *
     * Ҳарду ба ҳамон ҳисоби Google Cloud-и корбар пайвастанд. Vertex аввал
     * меистад; агар `aiplatform.googleapis.com` дар лоиҳа фаъол набошад, он
     * 403 медиҳад ва дархост бесадо ба Gemini мегузарад. Баъди фаъол шудани
     * API ҳамон код худаш ба Vertex мегузарад.
     *
     * Vertex ва Gemini ҳарду Google-анд: садамаи умумии Google ҳардуро якҷо
     * мекушад. Groq берун аз он аст ва танҳо ҳамчун захираи охирин меояд.
     */
    async generateContent(
        prompt: string,
        options: { provider?: AiProvider } = {},
    ): Promise<string> {
        const run = (which: AiProvider) => {
            if (which === 'vertex') return this.generateVertexContent(prompt);
            if (which === 'groq') return this.generateGroqContent(prompt);
            return this.generateGeminiContent(prompt);
        };

        /* Groq ҳамеша охирин: сифати тоҷикиаш аз Gemini пасттар аст, пас
           танҳо вақте меояд, ки роҳи Google тамоман баста бошад. */
        const chain: AiProvider[] = options.provider === 'gemini'
            ? ['gemini', 'vertex', 'groq']
            : ['vertex', 'gemini', 'groq'];

        const usable = chain.filter((which) => {
            if (which === 'vertex') return !!this.vertex;
            if (which === 'groq') return !!this.groqKey;
            return true;
        });

        let last: any = null;
        for (const which of usable) {
            try {
                return await this.withTimeout(run(which), which);
            } catch (error) {
                last = error;
                console.error(`AI: провайдери ${which} афтод:`, error?.message || error);
            }
        }
        /*
         * Ҳама афтоданд. Хатои хом ба корбар 500-и бемаъно медиҳад, аз ин рӯ
         * ин ҷо ба паёми фаҳмо табдил меёбад — ва «лимит» танҳо вақте гуфта
         * мешавад, ки воқеан лимит бошад, на ҳар садама.
         */
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

    /**
     * Маҳдудияти вақт барои як провайдер.
     *
     * Провайдери овезонмонда набояд тамоми занҷирро боздорад: агар даъват на
     * хато диҳад ва на ҷавоб, `generateContent` ҳеҷ гоҳ ба провайдери навбатӣ
     * намегузарад ва дархост то timeout-и худи браузер кушода мемонад. Бо ин
     * маҳдудият овезон мондан ҳамчун афтиш ҳисоб мешавад ва занҷир давом
     * мекунад.
     */
    private withTimeout<T>(work: Promise<T>, which: string): Promise<T> {
        return new Promise<T>((resolve, reject) => {
            const timer = setTimeout(
                () => reject(new Error(`провайдери ${which} дар ${AI_PROVIDER_TIMEOUT_MS} мс ҷавоб надод`)),
                AI_PROVIDER_TIMEOUT_MS,
            );

            work.then(resolve, reject).finally(() => clearTimeout(timer));
        });
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
            config: {
                /*
                 * gemini-2.5-flash ба таври пешфарз «фикр» мекунад: дар
                 * ченкунӣ он 2,566 токени фикрро пеш аз ҷавоб месӯзонд ва
                 * даъват 18.8 сония мекашид. Бо хомӯш кардани он ҳамон
                 * дархост дар 3.6 сония иҷро мешавад — 5.3 баробар тезтар,
                 * ва ҷавоб ҳатто пурратар мебарояд. Барои маслиҳати касбӣ
                 * занҷири дарозии мулоҳиза лозим нест.
                 */
                thinkingConfig: { thinkingBudget: 0 },
            },
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

        /* Пештар ҳар афтиши Gemini ҳамчун «лимити рӯзона тамом шуд» баромад
           мекард — ҳатто 503-и «серталабӣ», ки ба лимит ҳеҷ рабте надорад.
           Корбар бовар мекард, ки ҳаққи худро сарф кардааст, ва дигар
           кӯшиш намекард. Ҳоло хатои аслӣ боло меравад ва занҷир ба
           провайдери навбатӣ мегузарад. */
        throw lastError ?? new InternalServerErrorException('Gemini ҷавоб надод');
    }

    /**
     * Groq — API-и бо OpenAI мувофиқ, бе SDK-и алоҳида.
     *
     * Ҳадди вақт аз худи `withTimeout` меояд, вале `AbortController` низ
     * лозим аст: бе он сокети кушода пас аз timeout дар замина мемонад.
     */
    private async generateGroqContent(prompt: string): Promise<string> {
        if (!this.groqKey) {
            throw new InternalServerErrorException('Groq танзим нашудааст (GROQ_API_KEY)');
        }

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), AI_PROVIDER_TIMEOUT_MS);

        try {
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.groqKey}`,
                },
                body: JSON.stringify({
                    model: this.groqModel,
                    messages: [{ role: 'user', content: prompt }],
                    temperature: 0.7,
                }),
                signal: controller.signal,
            });

            if (!response.ok) {
                const detail = await response.text();
                throw new Error(`Groq ${response.status}: ${detail.slice(0, 200)}`);
            }

            const data: any = await response.json();
            const text = data?.choices?.[0]?.message?.content;
            if (!text) throw new Error('Groq ҷавоби холӣ баргардонд');
            return text;
        } finally {
            clearTimeout(timer);
        }
    }
}
