import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { FinishInput, TrialService } from './trial.service';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { ClassroomService } from '../classroom/classroom.service';

// «Як рӯз дар ихтисос» — бе бақайдгирӣ, то ҳар хонанда (ва журӣ) зуд санҷад.
@ApiTags('trial')
@Controller('trial')
export class TrialController {
    constructor(private readonly trial: TrialService, private readonly classrooms: ClassroomService) { }

    // Кӣ санҷид: корбари воридшуда ё хонандаи бе почта дар синф (аз сарлавҳа, на аз body).
    private async who(req: any) {
        return { userId: req.user?.userId || null, guestId: await this.classrooms.resolveGuest(req.headers?.['x-class-guest']) };
    }

    @Get()
    @ApiOperation({ summary: 'Рӯйхати сенарияҳо ва оилаҳои ихтисос' })
    list(@Query('lang') lang?: string) {
        return this.trial.list(lang);
    }

    @Get('resolve')
    @ApiOperation({ summary: 'Кадом сенария ба ихтисос (рамз + кластери ММТ) мувофиқ аст' })
    resolve(@Query('code') code?: string, @Query('cluster') cluster?: string, @Query('lang') lang?: string) {
        return this.trial.resolve(code, cluster, lang);
    }

    // Танҳо админ; пеш аз ':family' — то «stats» ҳамчун номи сенария хонда нашавад.
    @Get('stats')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Натиҷаҳои «Як рӯз дар ихтисос» (админ)' })
    stats() {
        return this.trial.stats();
    }

    // Сенарияи худи ихтисос (884). 404 — ҳанӯз тайёр нест (браузер сенарияи оиларо нишон медиҳад).
    @Get('career/:careerId')
    @ApiOperation({ summary: 'Сенарияи ихтисос + кластер ва дар куҷо хондан' })
    getCareer(@Param('careerId') careerId: string, @Query('lang') lang?: string) {
        return this.trial.getCareer(careerId, lang);
    }

    @Post('career/:careerId/check')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Санҷиши як вазифаи сенарияи ихтисос' })
    checkCareer(@Param('careerId') careerId: string, @Body() body: { taskId?: string; answer?: unknown; lang?: string }) {
        return this.trial.checkCareer(careerId, String(body?.taskId || ''), body?.answer, body?.lang);
    }

    @Post('career/:careerId/finish')
    @HttpCode(HttpStatus.OK)
    @UseGuards(OptionalJwtGuard)
    @ApiOperation({ summary: 'Анҷоми сенарияи ихтисос' })
    async finishCareer(@Param('careerId') careerId: string, @Body() body: FinishInput, @Req() req: any) {
        return this.trial.finishCareer(careerId, { ...body, family: 'career', ...(await this.who(req)) });
    }

    @Get(':family')
    @ApiOperation({ summary: 'Сенария бе ҷавобҳои дуруст' })
    get(@Param('family') family: string, @Query('lang') lang?: string) {
        return this.trial.get(family, lang);
    }

    @Post(':family/check')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Санҷиши як вазифа ва шарҳ' })
    check(@Param('family') family: string, @Body() body: { taskId?: string; answer?: unknown; lang?: string }) {
        return this.trial.check(family, String(body?.taskId || ''), body?.answer, body?.lang);
    }

    @Post(':family/finish')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Анҷом: хулоса ва нигоҳ доштани натиҷа (бе маълумоти шахсӣ)' })
    @UseGuards(OptionalJwtGuard)
    async finish(@Param('family') family: string, @Body() body: FinishInput, @Req() req: any) {
        return this.trial.finish({ ...body, family, ...(await this.who(req)) });
    }
}
