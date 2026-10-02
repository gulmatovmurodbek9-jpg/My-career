import { ChildProcess, fork } from 'child_process';
import { existsSync } from 'fs';
import { setPriority } from 'os';
import { join } from 'path';
import { Logger } from '@nestjs/common';

// Мизоҷи process-и алоҳидаи овози русӣ/англисӣ (tts-worker.js).
// - Process бо приоритети паст (nice 10): веб ва Postgres ҳамеша пеш.
// - Агар афтад — худкор аз нав оғоз мешавад (1 с, 2 с, 4 с … то 30 с).
// - Агар 30 сония ҷавоб надиҳад — дархост бо TTS_TIMEOUT рад ва process аз нав.
// - Порти шабака нест: танҳо канали IPC.

export type ForeignLang = 'ru' | 'en';

export class TtsError extends Error {
    constructor(readonly code: 'TTS_TIMEOUT' | 'TTS_FAILED' | 'TTS_CRASH', message: string) {
        super(message);
    }
}

const MODELS: Record<ForeignLang, { dir: string; file: string; id: string }> = {
    ru: { dir: 'vits-piper-ru_RU-ruslan-medium', file: 'ru_RU-ruslan-medium.onnx', id: 'piper-ruslan-n05' },
    en: { dir: 'kokoro-multi-lang-v1_0', file: 'model.onnx', id: 'kokoro-echo-t2' },
};

const LOW_PRIORITY = 10;

export class SherpaClient {
    private readonly logger = new Logger('SherpaTts');
    private readonly root = process.env.VOICE_MODELS_DIR || join(process.cwd(), 'voice-models');
    private readonly workerFile = join(process.cwd(), 'tts-worker.js');
    private child: ChildProcess | null = null;
    private seq = 0;
    private restarts = 0;
    private restartTimer: NodeJS.Timeout | null = null;
    private stopped = false;
    private readonly pending = new Map<number, {
        resolve: (wav: Buffer) => void;
        reject: (error: Error) => void;
        timer: NodeJS.Timeout;
    }>();

    constructor(private readonly timeoutMs = 30_000) { }

    available(lang: ForeignLang): boolean {
        const spec = MODELS[lang];
        return existsSync(this.workerFile) && existsSync(join(this.root, spec.dir, spec.file));
    }

    modelId(lang: ForeignLang): string {
        return MODELS[lang].id;
    }

    // Барои санҷиш ва status.
    get pid(): number | undefined {
        return this.child?.pid;
    }

    private start(): ChildProcess {
        if (this.child) return this.child;
        const child = fork(this.workerFile, [], {
            serialization: 'advanced',
            stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
            execArgv: [],
            env: { ...process.env },
        });
        try {
            if (child.pid) setPriority(child.pid, LOW_PRIORITY);
        } catch (error) {
            this.logger.warn(`Приоритети паст гузошта нашуд: ${error}`);
        }
        child.on('message', (message: any) => this.onMessage(message));
        child.on('exit', (code, signal) => this.onExit(child, code, signal));
        child.on('error', (error) => this.logger.error(`Process-и овоз: ${error}`));
        this.child = child;
        this.logger.log(`Process-и овози ru/en оғоз шуд (pid ${child.pid}, nice ${LOW_PRIORITY})`);
        return child;
    }

    private onMessage(message: any) {
        if (message?.type === 'log') {
            this.logger.log(message.message);
            return;
        }
        if (message?.type !== 'result') return;
        const job = this.pending.get(message.id);
        if (!job) return;
        this.pending.delete(message.id);
        clearTimeout(job.timer);
        if (message.ok) {
            this.restarts = 0;
            job.resolve(Buffer.from(message.wav));
        } else {
            job.reject(new TtsError('TTS_FAILED', message.error || 'синтез нашуд'));
        }
    }

    private onExit(child: ChildProcess, code: number | null, signal: string | null) {
        if (this.child === child) this.child = null;
        for (const [id, job] of this.pending) {
            clearTimeout(job.timer);
            job.reject(new TtsError('TTS_CRASH', `process-и овоз афтод (${code ?? signal})`));
            this.pending.delete(id);
        }
        if (this.stopped) return;
        // Аз нав оғоз — бо таваққуфи афзоянда, то афтидани пайдарпай серверро банд накунад.
        const delay = Math.min(30_000, 1000 * 2 ** this.restarts);
        this.restarts += 1;
        this.logger.warn(`Process-и овоз баста шуд (${code ?? signal}) — баъд аз ${delay} мс аз нав`);
        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.restartTimer = setTimeout(() => {
            this.restartTimer = null;
            if (!this.stopped && !this.child) this.start();
        }, delay);
    }

    synth(lang: ForeignLang, text: string): Promise<Buffer> {
        const child = this.start();
        const id = ++this.seq;
        return new Promise<Buffer>((resolve, reject) => {
            const timer = setTimeout(() => {
                if (!this.pending.has(id)) return;
                this.pending.delete(id);
                reject(new TtsError('TTS_TIMEOUT', `овоз дар ${this.timeoutMs / 1000} сония тайёр нашуд`));
                // Process овезон аст (синтез синхронӣ аст) — онро мекушем, худаш аз нав оғоз мешавад.
                this.logger.warn('Process-и овоз ҷавоб надод — аз нав оғоз карда мешавад');
                child.kill('SIGKILL');
            }, this.timeoutMs);
            this.pending.set(id, { resolve, reject, timer });
            child.send({ type: 'synth', id, lang, text });
        });
    }

    // Танҳо барои санҷиш (TTS_WORKER_TEST=1).
    sendTest(type: 'crash' | 'hang') {
        this.start().send({ type });
    }

    stop() {
        this.stopped = true;
        if (this.restartTimer) clearTimeout(this.restartTimer);
        this.child?.kill();
        this.child = null;
    }
}
