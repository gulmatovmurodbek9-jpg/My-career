import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InterviewMessage, InterviewService } from './interview.service';

@ApiTags('interview')
@Controller('interview')
export class InterviewController {
    constructor(private readonly interview: InterviewService) { }

    @Get(':careerId')
    @ApiOperation({ summary: 'Мутахассиси виртуалии ихтисос: ном, шаҳр, таҷриба, салом ва саволҳои тайёр' })
    info(@Param('careerId') careerId: string, @Query('lang') lang?: string) {
        return this.interview.info(careerId, lang);
    }

    @Post(':careerId')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Савол ба мутахассиси виртуалӣ (AI, аз номи ӯ)' })
    ask(@Param('careerId') careerId: string, @Body() body: { messages?: InterviewMessage[]; lang?: string }, @Ip() ip: string) {
        return this.interview.ask(careerId, body, ip);
    }
}
