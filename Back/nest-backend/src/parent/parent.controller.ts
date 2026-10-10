import { Body, Controller, Get, HttpCode, HttpStatus, Ip, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ParentService } from './parent.service';

@ApiTags('parents')
@Controller('parents')
export class ParentController {
    constructor(private readonly parents: ParentService) { }

    @Post('invites')
    @ApiOperation({ summary: 'Хонанда пайванд барои волидайн месозад (бо холҳои тести худ)' })
    create(@Body() body: { childName?: string; scores?: any; lang?: string }, @Ip() ip: string) {
        return this.parents.create(body, ip);
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
