import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PeerService } from './peer.service';

@ApiTags('peers')
@Controller('peers')
export class PeerController {
    constructor(private readonly peers: PeerService) { }

    @Post('invites')
    @ApiOperation({ summary: 'Хонанда худро баҳо медиҳад ва пайванд барои дӯстон месозад (360°)' })
    create(@Body() body: { name?: string; self?: any; lang?: string }, @Ip() ip: string) {
        return this.peers.create(body, ip);
    }

    @Get('invites/:code')
    @ApiOperation({ summary: 'Барои дӯст: номи хонанда' })
    forFriend(@Param('code') code: string) {
        return this.peers.forFriend(code);
    }

    @Post('invites/:code/answers')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Дӯст хонандаро аз рӯи 8 сифат баҳо медиҳад' })
    answer(@Param('code') code: string, @Body() body: { scores?: any; relation?: string }, @Ip() ip: string) {
        return this.peers.answer(code, body, ip);
    }

    @Get('invites/:code/result')
    @ApiOperation({ summary: 'Барои хонанда: баҳои худ ва миёнаи дӯстон (аз 2 ҷавоб боло)' })
    result(@Param('code') code: string, @Query('secret') secret: string) {
        return this.peers.result(code, secret);
    }
}
