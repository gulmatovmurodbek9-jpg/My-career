import { Body, Controller, Get, Ip, Post, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { VoiceService } from './voice.service';

@ApiTags('voice')
@Controller('voice')
export class VoiceController {
    constructor(private readonly voiceService: VoiceService) { }

    @Get('status')
    @ApiOperation({ summary: 'Танзимоти овоз: калид ҳаст ё не, чанд ҷумла дар кеш' })
    status() {
        return this.voiceService.status();
    }

    @Get('speak')
    @ApiOperation({ summary: 'Матн → овоз, пора-пора (браузер якбора хондан сар мекунад)' })
    async speakStream(@Query('text') text: string, @Res() res: Response, @Ip() ip: string) {
        const { file, spoken } = this.voiceService.resolveCache(text);
        const cached = await this.voiceService.readCache(file);

        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');

        if (cached) {
            res.setHeader('X-Voice-Cache', 'hit');
            res.setHeader('Content-Length', String(cached.length));
            res.end(cached);
            return;
        }

        res.setHeader('X-Voice-Cache', 'miss');
        this.voiceService.guardSpend(ip);
        await this.voiceService.streamAudio(spoken, file, (chunk) => res.write(chunk));
        res.end();
    }

    @Post('stt')
    @UseInterceptors(FileInterceptor('audio', { limits: { fileSize: 8 * 1024 * 1024 } }))
    @ApiOperation({ summary: 'Садо → матни тоҷикӣ (ElevenLabs Scribe)' })
    async stt(@UploadedFile() audio: Express.Multer.File, @Ip() ip: string) {
        this.voiceService.guardSpend(ip);
        return this.voiceService.transcribe(audio?.buffer, audio?.mimetype);
    }

    @Post('speak')
    @ApiOperation({ summary: 'Матн → овози тоҷикӣ (mp3), бо кеши доимӣ' })
    async speak(@Body() body: { text: string }, @Res() res: Response) {
        const { audio, cached } = await this.voiceService.speak(body?.text);
        res.setHeader('Content-Type', 'audio/mpeg');
        res.setHeader('Content-Length', String(audio.length));
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        res.setHeader('X-Voice-Cache', cached ? 'hit' : 'miss');
        res.send(audio);
    }
}
