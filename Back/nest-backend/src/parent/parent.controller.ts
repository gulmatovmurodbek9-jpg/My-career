import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParentService } from './parent.service';

@ApiTags('parents')
@Controller('parents')
export class ParentController {
    constructor(private readonly parents: ParentService) { }

    @Post('invites')
    @UseGuards(OptionalJwtGuard)
    @ApiOperation({ summary: 'Хонанда пайванд барои волидайн месозад (холҳо, ихтисосҳо; бо ҳисоб — маълумоти зинда)' })
    create(@Body() body: { childName?: string; scores?: any; lang?: string; careers?: any }, @Ip() ip: string, @Req() req: any) {
        return this.parents.create(body, ip, req.user?.userId || null);
    }

    @Post('invites/:code/ask')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Волид дар бораи ихтисоси фарзанд аз AI мепурсад' })
    ask(@Param('code') code: string, @Body() body: { careerId?: string; question?: string; lang?: string; secret?: string }, @Ip() ip: string) {
        return this.parents.ask(code, body, ip);
    }

    @Get('invites/:code')
    @ApiOperation({ summary: 'Барои волид: номи фарзанд ва ҳолат (натиҷаи фарзанд — баъди ҷавоб)' })
    forParent(@Param('code') code: string) {
        return this.parents.forParent(code);
    }

    @Post('invites/:code/answers')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Ҷавобҳои волид → муқоиса' })
    answer(@Param('code') code: string, @Body() body: { answers?: string[]; wish?: string; relation?: string }, @Ip() ip: string) {
        return this.parents.answer(code, body, ip);
    }

    @Get('invites/:code/result')
    @ApiOperation({ summary: 'Барои хонанда: ҷавоби волид омад ё не ва муқоиса' })
    forChild(@Param('code') code: string, @Query('secret') secret: string) {
        return this.parents.forChild(code, secret);
    }
}
