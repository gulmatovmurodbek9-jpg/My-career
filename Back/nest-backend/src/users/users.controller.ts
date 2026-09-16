import { Controller, Get, Post, Delete, Patch, Param, UseGuards, Req, Body, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('users')
@Controller('users')
export class UsersController {
    constructor(private readonly usersService: UsersService) { }


    @Get('specialists')
    @ApiOperation({ summary: 'Get active career specialists' })
    async getSpecialists() {
        return this.usersService.findSpecialists(true);
    }

    @Get('admin/activity')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Who is on the site right now, and how many use it (Admin only)' })
    async getActivity() {
        return this.usersService.getActivityStats();
    }

    @Get('admin/specialists')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all specialists (Admin only)' })
    async getAllSpecialists() {
        return this.usersService.findSpecialists(false);
    }

    @Post('admin/specialists')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a specialist account (Admin only)' })
    async createSpecialist(@Body() dto: CreateSpecialistDto) {
        return this.usersService.createSpecialist(dto);
    }

    @Patch('admin/specialists/:id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update specialist profile (Admin only)' })
    async updateSpecialist(@Param('id') id: string, @Body() dto: Partial<CreateSpecialistDto>) {
        return this.usersService.updateSpecialist(id, dto);
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all users (Admin only)' })
    async getAllUsers() {
        return this.usersService.findAll();
    }


    @Patch(':id/role')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Change user role (Admin only)' })
    async changeRole(@Param('id') id: string, @Body() body: { role: string }) {
        return this.usersService.changeRole(id, body.role);
    }


    @Post('save-career/:careerId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Захира/бекор кардани ихтисос (toggle)' })
    async toggleSaveCareer(@Param('careerId') careerId: string, @Req() req: any) {
        return this.usersService.toggleSaveCareer(req.user.userId, careerId);
    }

    @Get('saved-careers')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Гирифтани ихтисосҳои захирашуда' })
    async getSavedCareers(@Req() req: any) {
        return this.usersService.getSavedCareers(req.user.userId);
    }


    @Get('application-plan')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Рӯйхати ҳуҷҷатсупорӣ — аввал ҷойҳои ройгон, баъд пулакӣ' })
    async getApplicationPlan(@Req() req: any) {
        return this.usersService.getApplicationPlan(req.user.userId);
    }

    @Post('application-plan/:offeringId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Илова кардани интихоб (ҳама бояд аз як кластер бошанд)' })
    async addApplicationChoice(@Param('offeringId') offeringId: string, @Req() req: any) {
        return this.usersService.addApplicationChoice(req.user.userId, offeringId);
    }

    @Delete('application-plan/:offeringId')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Баровардани интихоб аз рӯйхат' })
    async removeApplicationChoice(@Param('offeringId') offeringId: string, @Req() req: any) {
        return this.usersService.removeApplicationChoice(req.user.userId, offeringId);
    }

    @Delete('application-plan')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Тоза кардани тамоми рӯйхат' })
    async clearApplicationPlan(@Req() req: any) {
        return this.usersService.clearApplicationPlan(req.user.userId);
    }

    @Get('liked-careers')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Гирифтани ихтисосҳои лайкшуда' })
    async getLikedCareers(@Req() req: any) {
        return this.usersService.getLikedCareers(req.user.userId);
    }

    @Post('quiz-results')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Захира кардани натиҷаи тести психологӣ' })
    async saveQuizResults(@Body() body: { logic: number; creative: number; social: number; technical: number }, @Req() req: any) {
        return this.usersService.saveQuizResults(req.user.userId, body);
    }

    @Get('profile')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Гирифтани маълумоти корбар' })
    async getProfile(@Req() req: any) {
        const user = await this.usersService.findById(req.user.userId);
        if (!user) {
            throw new NotFoundException('Корбар ёфт нашуд');
        }
        const { password, ...result } = user;
        return result;
    }

    @Get('chat-history')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Гирифтани таърихи чатҳои AI' })
    async getChatHistory(@Req() req: any) {
        return this.usersService.getChatHistory(req.user.userId);
    }

    @Get('ai-usage')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Гирифтани маълумот дар бораи истифодаи AI имрӯз' })
    async getAiUsage(@Req() req: any) {
        return this.usersService.getAiUsage(req.user.userId);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete a user (Admin only)' })
    async deleteUser(@Param('id') id: string) {
        await this.usersService.deleteUser(id);
        return { message: 'Корбар нест карда шуд' };
    }
}
