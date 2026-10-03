import { Body, Controller, ForbiddenException, Get, Ip, NotFoundException, Post, Query, Req, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { VoiceService } from './voice.service';

// Дархостҳои худи сервер (prewarm-voice.js) ва сайти мо.
const LOCAL_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);
const SITE_HOSTS = new Set(['ikhtisosiman.qobus.tj', 'localhost', '127.0.0.1']);
const isProduction = () => process.env.NODE_ENV === 'production';

// Хизматҳои пулакӣ (ElevenLabs) ва синтез танҳо барои сайти мо: пештар ҳар кас
// бо curl токен мегирифт ва TTS-и ройгон дошт. Браузер Origin ё Referer мефиристад.
function fromOurSite(req: Request, ip: string): boolean {
    if (!isProduction() || LOCAL_IPS.has(ip)) return true;
    const source = String(req.headers.origin || req.headers.referer || '');
    try {
        return SITE_HOSTS.has(new URL(source).hostname);
    } catch {
        return false;
    }
}

@ApiTags('voice')
@Controller('voice')
export class VoiceController {
    constructor(private readonly voiceService: VoiceService) { }

    // Ташхиси микрофон дар браузери корбар: ҳодисаҳо ба voice-debug.log.
    // Танҳо бо VOICE_DEBUG=1 (дар компютери таҳиягар); дар сервер хомӯш.
    @Post('debug')
    debug(@Body() body: { events?: unknown[] }) {
        if (process.env.VOICE_DEBUG !== '1') return { ok: false };
        const events = Array.isArray(body?.events) ? body.events.slice(0, 50) : [];
        const lines = events.map((event) => JSON.stringify(event).slice(0, 400)).join('\n');
        if (lines) require('fs').appendFileSync('voice-debug.log', `${lines}\n`);
        return { ok: true };
    }

    @Get('status')
    @ApiOperation({ summary: 'Ҳолати овоз: модел, кеш, шинохти нутқ' })
    status(@Ip() ip: string) {
        const status = this.voiceService.status();
        // Танзимоти дохилӣ (ttsUrl, кеш) танҳо барои худи сервер.
        if (isProduction() && !LOCAL_IPS.has(ip)) {
            return { speechToText: status.speechToText, languages: status.languages };
        }
        return status;
    }

    @Get('stt-token')
    @ApiOperation({ summary: 'Токени якбора барои шинохти ҷараёнӣ дар браузер' })
    async sttToken(@Ip() ip: string, @Req() req: Request) {
        if (!fromOurSite(req, ip)) throw new ForbiddenException();
        this.voiceService.guardSpend(ip, 'token');
        return this.voiceService.sttToken();
    }

    @Post('stt')
    @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 8 * 1024 * 1024 } }))
    @ApiOperation({ summary: 'Садо → матни тоҷикӣ' })
    async stt(@UploadedFile() audio: Express.Multer.File, @Ip() ip: string, @Req() req: Request) {
        if (!fromOurSite(req, ip)) throw new ForbiddenException();
        this.voiceService.guardSpend(ip);
        return this.voiceService.transcribe(audio?.buffer, audio?.mimetype);
    }

    // Санҷиши маҳаллӣ: process-и ru/en-ро «афтонидан» ё «овезон кардан».
    // Танҳо бо TTS_WORKER_TEST=1 ва аз IP-и маҳаллӣ; дар сервер 404/503.
    @Post('test-worker')
    testWorker(@Body() body: { type?: string }, @Ip() ip: string) {
        if (process.env.TTS_WORKER_TEST !== '1' || !LOCAL_IPS.has(ip)) throw new NotFoundException();
        return this.voiceService.testWorker(body?.type === 'hang' ? 'hang' : 'crash');
    }

    @Get('speak')
    @ApiOperation({ summary: 'Матн → овоз: тоҷикӣ (модели худамон), русӣ (Piper Ruslan), англисӣ (Piper Ryan)' })
    async speakGet(
        @Query('text') text: string,
        @Query('speed') speed: string,
        @Query('lang') lang: string,
        @Ip() ip: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        if (!fromOurSite(req, ip)) throw new ForbiddenException();
        this.voiceService.guardSpeak(ip);
        await this.send(text, Number(speed) || undefined, res, lang);
    }

    @Post('speak')
    @ApiOperation({ summary: 'Матн → овоз: тоҷикӣ (модели худамон), русӣ (Piper Ruslan), англисӣ (Piper Ryan)' })
    async speakPost(
        @Body() body: { text: string; speed?: number; lang?: string },
        @Ip() ip: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        if (!fromOurSite(req, ip)) throw new ForbiddenException();
        this.voiceService.guardSpeak(ip);
        await this.send(body?.text, Number(body?.speed) || undefined, res, body?.lang);
    }

    private async send(text: string, speed: number | undefined, res: Response, lang?: string) {
        // Хато («банд аст», «дер шуд») набояд дар кеши браузер монад — кеш танҳо барои садо.
        res.setHeader('Cache-Control', 'no-store');

        // Агар ягон ҷумларо пешакӣ сохта бошем — ҳамонро медиҳем.
        const packed = await this.voiceService.readPack(String(text || '').trim());
        if (packed) {
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('X-Voice-Source', 'pack');
            res.setHeader('Content-Length', String(packed.length));
            res.end(packed);
            return;
        }

        const { audio, cached } = await this.voiceService.speak(text, speed, lang);
        // Як рӯз, на як сол: агар модели овоз иваз шавад, браузер садои нав мегирад.
        res.setHeader('Cache-Control', 'public, max-age=86400');
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('X-Voice-Source', cached ? 'cache' : 'model');
        res.setHeader('Content-Length', String(audio.length));
        res.end(audio);
    }
}
