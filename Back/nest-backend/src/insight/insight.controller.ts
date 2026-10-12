import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InsightService } from './insight.service';

@ApiTags('career-insight')
@Controller('career-insight')
export class InsightController {
    constructor(private readonly insight: InsightService) { }

    @Post(':id/why')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: '«Чаро ин касб?» — AI сабаби интихобро баҳо медиҳад (матн нигоҳ дошта намешавад)' })
    why(@Param('id') id: string, @Body() body: { reason?: string; lang?: string }, @Ip() ip: string) {
        return this.insight.why(id, body, ip);
    }

    @Get(':id/future')
    @ApiOperation({ summary: '«Касби ман дар соли 2035» — пешгӯии AI (кеш)' })
    future(@Param('id') id: string, @Query('lang') lang: string, @Ip() ip: string) {
        return this.insight.future(id, lang, ip);
    }
}
