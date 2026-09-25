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
    @ApiOperation({ summary: 'Ҳолати овоз: модел, кеш, шинохти нутқ' })
    status() {
        return this.voiceService.status();
    }

    @Get('stt-token')
    @ApiOperation({ summary: 'Токени якбора барои шинохти ҷараёнӣ дар браузер' })
    async sttToken(@Ip() ip: string) {
        this.voiceService.guardSpend(ip);
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
    @ApiOperation({ summary: 'Матн → овози тоҷикӣ (модели худамон)' })
    async speakGet(
        @Query('text') text: string,
        @Query('speed') speed: string,
        @Res() res: Response,
    ) {
        await this.send(text, Number(speed) || undefined, res);
    }

    @Post('speak')
    @ApiOperation({ summary: 'Матн → овози тоҷикӣ (модели худамон)' })
    async speakPost(
        @Body() body: { text: string; speed?: number },
        @Res() res: Response,
    ) {
        await this.send(body?.text, Number(body?.speed) || undefined, res);
    }

    private async send(text: string, speed: number | undefined, res: Response) {
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

        const { audio, cached } = await this.voiceService.speak(text, speed);
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('X-Voice-Source', cached ? 'cache' : 'model');
        res.setHeader('Content-Length', String(audio.length));
        res.end(audio);
    }
}
