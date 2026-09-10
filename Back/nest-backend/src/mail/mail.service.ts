import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

/**
 * Фиристодани почта тавассути SMTP.
 *
 * Танзимот аз `.env` меояд, то ҳар провайдер кор кунад (Gmail, Mailtrap,
 * Resend SMTP ва ғ.). Агар SMTP танзим нашуда бошад, хидмат хато намедиҳад —
 * ҳаво номаро ба консол менависад, то раванди барқарорсозии парол дар
 * компютери таҳиягар бе ҳисоби почта ҳам санҷида шавад.
 */
@Injectable()
export class MailService {
    private readonly logger = new Logger(MailService.name);
    private transporter: nodemailer.Transporter | null = null;

    constructor(private readonly config: ConfigService) {
        const host = this.config.get<string>('SMTP_HOST');
        const user = this.config.get<string>('SMTP_USER');
        const pass = this.config.get<string>('SMTP_PASS');

        if (!host || !user || !pass) {
            this.logger.warn(
                'SMTP танзим нашудааст — номаҳо ба консол навишта мешаванд. ' +
                'Барои фиристодани воқеӣ SMTP_HOST, SMTP_USER ва SMTP_PASS-ро дар .env гузоред.',
            );
            return;
        }

        const port = Number(this.config.get<string>('SMTP_PORT') ?? 587);

        this.transporter = nodemailer.createTransport({
            host,
            port,
            // 465 ягона порти пурра TLS аст; 587 бо STARTTLS боло мебарояд.
            secure: port === 465,
            auth: { user, pass },
        });
    }

    get isConfigured(): boolean {
        return this.transporter !== null;
    }

    async send(options: { to: string; subject: string; html: string; text: string }): Promise<void> {
        const from =
            this.config.get<string>('MAIL_FROM') ||
            this.config.get<string>('SMTP_USER') ||
            'no-reply@ihtisosiman.tj';

        if (!this.transporter) {
            this.logger.log(
                `[НОМАИ САНҶИШӢ] ба: ${options.to}\nмавзӯъ: ${options.subject}\n${options.text}`,
            );
            return;
        }

        await this.transporter.sendMail({ from, ...options });
        this.logger.log(`Нома ба ${options.to} фиристода шуд: ${options.subject}`);
    }

    /** Номаи барқарорсозии парол бо коди 6-рақама. */
    async sendPasswordResetCode(to: string, code: string, name?: string): Promise<void> {
        const greeting = name ? `Салом, ${name}!` : 'Салом!';

        const text = [
            greeting,
            '',
            'Шумо барқарорсозии паролро дар «Ихтисоси ман» дархост кардед.',
            `Коди тасдиқ: ${code}`,
            '',
            'Код 15 дақиқа эътибор дорад.',
            'Агар шумо дархост накарда бошед, ин номаро нодида гиред — пароли шумо бетағйир мемонад.',
        ].join('\n');

        const html = `
<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a">
  <h1 style="margin:0 0 8px;font-size:20px;font-weight:700">Барқарорсозии парол</h1>
  <p style="margin:0 0 24px;color:#475569;font-size:14px;line-height:1.6">
    ${greeting} Коди тасдиқи шумо:
  </p>
  <div style="background:#f1f5f9;border-radius:14px;padding:20px;text-align:center">
    <span style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:34px;font-weight:700;letter-spacing:10px;color:#003bb3">${code}</span>
  </div>
  <p style="margin:24px 0 0;color:#64748b;font-size:12px;line-height:1.6">
    Код 15 дақиқа эътибор дорад. Агар шумо ин дархостро накарда бошед, номаро нодида гиред —
    пароли шумо бетағйир мемонад. Ин кодро ба касе нагӯед.
  </p>
</div>`.trim();

        await this.send({
            to,
            subject: `${code} — коди барқарорсозии парол`,
            text,
            html,
        });
    }
}
