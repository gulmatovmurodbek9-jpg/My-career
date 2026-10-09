import { Body, Controller, Delete, Get, Header, HttpCode, HttpException, HttpStatus, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { ClassroomInput, ClassroomService, TeacherRequestInput } from './classroom.service';

// Рамзро ба таври тасодуфӣ ҷустуҷӯ кардан нашавад: аз як IP то 20 кӯшиш дар як дақиқа.
const WINDOW_MS = 60_000;
const LIMIT = 20;
const hits = new Map<string, { count: number; until: number }>();
function limit(req: any) {
    const key = String(req.headers?.['x-forwarded-for'] || req.ip || '').split(',')[0].trim();
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.until < now) {
        hits.set(key, { count: 1, until: now + WINDOW_MS });
        if (hits.size > 5000) hits.clear();
        return;
    }
    entry.count += 1;
    if (entry.count > LIMIT) throw new HttpException('Кӯшиш зиёд шуд. Як дақиқа интизор шавед.', HttpStatus.TOO_MANY_REQUESTS);
}

const guestHeader = (req: any) => req.headers?.['x-class-guest'];

@ApiTags('classrooms')
@Controller('classrooms')
export class ClassroomController {
    constructor(private readonly classrooms: ClassroomService) { }

    // ---------- Хонанда (бе ҳисоб ҳам) ----------

    @Get('code/:code')
    @ApiOperation({ summary: 'Маълумоти синф аз рӯи рамз (барои саҳифаи ҳамроҳшавӣ)' })
    info(@Param('code') code: string, @Req() req: any) {
        limit(req);
        return this.classrooms.publicInfo(code);
    }

    @Post('join')
    @HttpCode(HttpStatus.OK)
    @UseGuards(OptionalJwtGuard)
    @ApiOperation({ summary: 'Ҳамроҳ шудан ба синф: бо ҳисоб ё бе почта (танҳо ном)' })
    join(@Body() body: { code?: string; displayName?: string }, @Req() req: any) {
        limit(req);
        return this.classrooms.join(String(body?.code || ''), body, req.user || null, guestHeader(req));
    }

    @Get('joined')
    @UseGuards(OptionalJwtGuard)
    @ApiOperation({ summary: 'Синфҳое, ки хонанда дар онҳост' })
    joined(@Req() req: any) {
        return this.classrooms.joined(req.user || null, guestHeader(req));
    }

    @Delete('joined/:memberId')
    @UseGuards(OptionalJwtGuard)
    @ApiOperation({ summary: 'Аз синф баромадан' })
    leave(@Param('memberId') memberId: string, @Req() req: any) {
        return this.classrooms.leave(req.user || null, guestHeader(req), memberId);
    }

    // ---------- Дархости «Ман омӯзгор ҳастам» ----------

    @Post('teacher-request')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Дархост барои нақши омӯзгор' })
    requestTeacher(@Body() body: TeacherRequestInput, @Req() req: any) {
        return this.classrooms.requestTeacher(req.user, body);
    }

    @Get('teacher-request')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Ҳолати дархости ман' })
    myRequest(@Req() req: any) {
        return this.classrooms.myRequest(req.user);
    }

    // ---------- Админ ----------

    @Get('admin/requests')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Дархостҳои омӯзгорон (админ)' })
    adminRequests() {
        return this.classrooms.adminRequests();
    }

    @Post('admin/requests/:id/:decision')
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Тасдиқ (approve) ё рад (reject) кардани дархост (админ)' })
    decide(@Param('id') id: string, @Param('decision') decision: string) {
        return this.classrooms.decide(id, decision === 'approve');
    }

    @Get('admin/all')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Ҳамаи синфҳо (админ)' })
    adminAll() {
        return this.classrooms.adminClassrooms();
    }

    // ---------- Омӯзгор (нақш аз база санҷида мешавад) ----------

    @Get('mine')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Синфҳои ман (омӯзгор)' })
    mine(@Req() req: any) {
        return this.classrooms.mine(req.user);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Синф сохтан (омӯзгор)' })
    create(@Body() body: ClassroomInput, @Req() req: any) {
        return this.classrooms.create(req.user, body);
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Синф: ҷамъбаст ва хонандагон (омӯзгор)' })
    detail(@Param('id') id: string, @Req() req: any) {
        return this.classrooms.detail(req.user, id);
    }

    @Get(':id/export.csv')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @Header('Content-Type', 'text/csv; charset=utf-8')
    @Header('Content-Disposition', 'attachment; filename="sinf.csv"')
    @ApiOperation({ summary: 'Натиҷаҳои синф барои Excel (омӯзгор)' })
    csv(@Param('id') id: string, @Req() req: any) {
        return this.classrooms.csv(req.user, id);
    }

    @Patch(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Иваз кардани синф ё бойгонӣ (омӯзгор)' })
    update(@Param('id') id: string, @Body() body: ClassroomInput, @Req() req: any) {
        return this.classrooms.update(req.user, id, body);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Нест кардани синф (омӯзгор)' })
    remove(@Param('id') id: string, @Req() req: any) {
        return this.classrooms.remove(req.user, id);
    }

    @Delete(':id/members/:memberId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Хориҷ кардани хонанда аз синф (омӯзгор)' })
    removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @Req() req: any) {
        return this.classrooms.removeMember(req.user, id, memberId);
    }
}
