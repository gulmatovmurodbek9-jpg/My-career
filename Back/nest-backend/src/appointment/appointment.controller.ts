import { Controller, Post, Get, Patch, Delete, Body, Param, UseGuards, Request, BadRequestException, Query } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { RateAppointmentDto } from './dto/rate-appointment.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { AppointmentType, AppointmentStatus } from './appointment.entity';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('appointments')
@Controller('appointments')
export class AppointmentController {
    constructor(private readonly appointmentService: AppointmentService) { }

    @Get('availability/:specialistId')
    @ApiOperation({ summary: 'Get free/busy slots for a specialist on a date' })
    async getAvailability(
        @Param('specialistId') specialistId: string,
        @Query('date') date: string,
    ) {
        return this.appointmentService.getSpecialistAvailability(specialistId, date);
    }

    @Post()
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create appointment (AI, Online, or Offline consultation)' })
    async create(@Body() dto: CreateAppointmentDto, @Request() req) {
        return this.appointmentService.create(req.user.userId, dto);
    }

    @Get('my')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user appointments' })
    async getMyAppointments(@Request() req) {
        return this.appointmentService.getUserAppointments(req.user.userId);
    }

    @Get('specialist/my')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('specialist')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get appointments assigned to current specialist' })
    async getMySpecialistAppointments(@Request() req) {
        return this.appointmentService.getSpecialistAppointments(req.user.userId);
    }

    @Get('stats/:type')
    @ApiOperation({ summary: 'Get queue statistics' })
    async getQueueStats(@Param('type') type: AppointmentType) {
        return this.appointmentService.getQueueStats(type);
    }

    @Get(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get appointment by ID' })
    async getById(@Param('id') id: string, @Request() req) {
        const appointment = await this.appointmentService.getById(id);
        const isOwner = appointment.userId === req.user.userId;
        const isAssignedSpecialist = appointment.specialistId === req.user.userId;
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAssignedSpecialist && !isAdmin) {
            throw new BadRequestException('Шумо ба ин дархост дастрасӣ надоред');
        }
        return appointment;
    }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin', 'specialist')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all appointments (Admin/Specialist only)' })
    async getAll(
        @Request() req,
        @Query('type') type?: AppointmentType,
        @Query('status') status?: AppointmentStatus,
    ) {
        if (req.user.role === 'specialist') {
            return this.appointmentService.getSpecialistAppointments(req.user.userId);
        }
        return this.appointmentService.getAll(type, status);
    }

    @Patch(':id/status')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin', 'specialist')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update appointment status' })
    async updateStatus(@Param('id') id: string, @Body('status') status: AppointmentStatus) {
        return this.appointmentService.updateStatus(id, status);
    }

    @Post(':id/rating')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Rate completed appointment' })
    async rate(@Param('id') id: string, @Body() dto: RateAppointmentDto, @Request() req) {
        return this.appointmentService.rate(id, req.user.userId, dto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Cancel appointment' })
    async cancel(@Param('id') id: string, @Request() req) {
        const appointment = await this.appointmentService.getById(id);
        const isOwner = appointment.userId === req.user.userId;
        const isAssignedSpecialist = appointment.specialistId === req.user.userId;
        const isAdmin = req.user.role === 'admin';
        if (!isOwner && !isAssignedSpecialist && !isAdmin) {
            throw new BadRequestException('Шумо ба ин амал дастрасӣ надоред');
        }
        return this.appointmentService.cancel(id);
    }
}
