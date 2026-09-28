import { Body, Controller, Get, Ip, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { VoiceService } from './voice.service';

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
    status() {
        return this.voiceService.status();
    }

    @Get('stt-token')
    @ApiOperation({ summary: 'Токени якбора барои шинохти ҷараёнӣ дар браузер' })
    async sttToken(@Ip() ip: string) {
        this.voiceService.guardSpend(ip, 'token');
        return this.voiceService.sttToken();
    }

    @Post('stt')
    @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 8 * 1024 * 1024 } }))
    @ApiOperation({ summary: 'Садо → матни тоҷикӣ' })
    async stt(@UploadedFile() audio: Express.Multer.File, @Ip() ip: string) {
        this.voiceService.guardSpend(ip);
        return this.voiceService.transcribe(audio?.buffer, audio?.mimetype);
    }

    @Get('speak')
    @ApiOperation({ summary: 'Матн → овоз: тоҷикӣ (модели худамон), русӣ ва англисӣ (MMS)' })
    async speakGet(
        @Query('text') text: string,
        @Query('speed') speed: string,
        @Query('lang') lang: string,
        @Res() res: Response,
    ) {
        await this.send(text, Number(speed) || undefined, res, lang);
    }

    @Post('speak')
    @ApiOperation({ summary: 'Матн → овоз: тоҷикӣ (модели худамон), русӣ ва англисӣ (MMS)' })
    async speakPost(
        @Body() body: { text: string; speed?: number; lang?: string },
        @Res() res: Response,
    ) {
        await this.send(body?.text, Number(body?.speed) || undefined, res, body?.lang);
    }

    private async send(text: string, speed: number | undefined, res: Response, lang?: string) {
        // Як рӯз, на як сол: агар модели овоз иваз шавад, браузер садои нав мегирад.
        res.setHeader('Cache-Control', 'public, max-age=86400');

        // Агар ягон ҷумларо пешакӣ сохта бошем — ҳамонро медиҳем.
        const packed = await this.voiceService.readPack(String(text || '').trim());
        if (packed) {
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('X-Voice-Source', 'pack');
            res.setHeader('Content-Length', String(packed.length));
            res.end(packed);
            return;
        }

        const { audio, cached } = await this.voiceService.speak(text, speed, lang);
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('X-Voice-Source', cached ? 'cache' : 'model');
        res.setHeader('Content-Length', String(audio.length));
        res.end(audio);
    }
}
