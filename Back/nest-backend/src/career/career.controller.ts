import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, BadRequestException, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CareerService } from './career.service';
import { CreateCareerDto } from './dto/create-career.dto';
import { UpdateCareerDto } from './dto/update-career.dto';
import { GetCareersDto } from './dto/get-careers.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AiService } from '../ai/ai.service';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads', 'voice');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

@ApiTags('careers')
@Controller('careers')
export class CareerController {
    constructor(
        private readonly careerService: CareerService,
        private readonly aiService: AiService,
    ) { }

    @Get()
    @ApiOperation({ summary: 'Get all careers with filtering and pagination' })
    getAll(@Query() query: GetCareersDto) {
        return this.careerService.findAll(query);
    }



    @Get('/stats')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get platform analytics (Admin only)' })
    async getStats() {
        return this.careerService.getStats();
    }

    @Get(':id/offerings')
    @ApiOperation({ summary: 'List every university offering this specialty, with tuition and seats' })
    @ApiParam({ name: 'id', description: 'Career UUID' })
    async getOfferings(@Param('id') id: string) {
        const career = await this.careerService.findOne(id);
        if (!career) {
            throw new NotFoundException(`Ихтисос бо ID "${id}" ёфт нашуд`);
        }
        return this.careerService.findOfferings(id);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get career by ID' })
    @ApiParam({ name: 'id', description: 'Career UUID' })
    async getOne(@Param('id') id: string) {
        const career = await this.careerService.findOne(id);
        if (!career) {
            throw new NotFoundException(`Ихтисос бо ID "${id}" ёфт нашуд`);
        }
        return career;
    }

    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new career (Admin only)' })
    create(@Body() createCareerDto: CreateCareerDto) {
        return this.careerService.create(createCareerDto);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update career by ID (Admin only)' })
    @ApiParam({ name: 'id', description: 'Career UUID' })
    async update(@Param('id') id: string, @Body() updateCareerDto: UpdateCareerDto) {
        const career = await this.careerService.findOne(id);
        if (!career) {
            throw new NotFoundException(`Ихтисос бо ID "${id}" ёфт нашуд`);
        }
        return this.careerService.update(id, updateCareerDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete career by ID (Admin only)' })
    @ApiParam({ name: 'id', description: 'Career UUID' })
    async delete(@Param('id') id: string) {
        const career = await this.careerService.findOne(id);
        if (!career) {
            throw new NotFoundException(`Ихтисос бо ID "${id}" ёфт нашуд`);
        }
        await this.careerService.delete(id);
        return { message: `Ихтисоси "${career.name}" нест карда шуд` };
    }

    @Delete()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete all careers (Admin only)' })
    async deleteAll() {
        await this.careerService.deleteAll();
        return { message: 'Ҳамаи ихтисосҳо нест карда шуданд' };
    }

    @Post(':id/like')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Toggle like on a career' })
    @ApiParam({ name: 'id', description: 'Career UUID' })
    async toggleLike(@Param('id') id: string, @Request() req) {
        return this.careerService.toggleLike(id, req.user.userId);
    }

    @Post('recalculate-likes')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Recalculate all likes counts (Admin only)' })
    async recalculateLikes() {
        await this.careerService.recalculateAllLikes();
        return { message: 'Likes recalculated successfully' };
    }

    @Post('match')
    @ApiOperation({ summary: 'Match careers based on user quiz results' })
    match(@Body() body: { scores: any }) {
        if (!body.scores) {
            throw new BadRequestException('Натиҷаҳои санҷишро фиристед');
        }
        return this.careerService.matchCareers(body.scores);
    }

    @Post('ask')
    @UseGuards(AuthGuard('jwt'))
    @ApiOperation({ summary: 'Ask AI about a career (with optional career context)' })
    @ApiBearerAuth()
    async ask(
        @Body() body: {
            question: string;
            careerName?: string;
            lang?: string;
            userLocation?: { latitude: number; longitude: number };
        },
        @Request() req,
    ) {
        if (!body.question || body.question.trim().length === 0) {
            throw new BadRequestException('Саволро нависед');
        }
        const userId = req.user?.userId;
        const result = await this.careerService.askAi(body.question, userId, body.careerName, body.lang, body.userLocation);
        return result; // { answer, remainingToday }
    }

    @Post('voice-ask')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Send voice message, transcribe via Whisper, get AI response' })
    @UseInterceptors(FileInterceptor('audio', {
        storage: diskStorage({
            destination: uploadsDir,
            filename: (_req, file, cb) => {
                const unique = Date.now() + '-' + Math.round(Math.random() * 1e6);
                const ext = path.extname(file.originalname) || '.webm';
                cb(null, `voice-${unique}${ext}`);
            },
        }),
        limits: { fileSize: 25 * 1024 * 1024 }, // 25MB max
    }))
    async voiceAsk(
        @UploadedFile() file: Express.Multer.File,
        @Body() body: { lang?: string; careerName?: string },
        @Request() req,
    ) {
        if (!file) {
            throw new BadRequestException('Файли овозӣ фиристода нашуд');
        }

        try {
            // 1. Transcribe audio via Groq Whisper
            const transcription = await this.aiService.transcribeAudio(file.path, body.lang || 'tj');

            if (!transcription || transcription.trim().length === 0) {
                throw new BadRequestException('Овоз шинохта нашуд. Лутфан дубора кӯшиш кунед.');
            }

            // 2. Pass transcription to existing AI chat flow
            const userId = req.user?.userId;
            const result = await this.careerService.askAi(transcription.trim(), userId, body.careerName, body.lang);

            return {
                transcription: transcription.trim(),
                answer: result.answer,
                remainingToday: result.remainingToday,
            };
        } finally {
            // Clean up temp file
            try { fs.unlinkSync(file.path); } catch { }
        }
    }

    @Post('ai-advisor')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Generate structured AI career advisor report based on RIASEC profile' })
    async getAiAdvisorReport(@Body() body: { scores: any; lang?: string; quizProfile?: any }, @Request() req) {
        if (!body.scores) {
            throw new BadRequestException('Натиҷаҳои санҷишро фиристед');
        }
        return this.careerService.generateCareerAdvisorReport(body.scores, body.lang || 'tj', body.quizProfile);
    }

    @Post('compare')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Compare multiple careers based on RIASEC profile' })
    async compareCarers(
        @Body() body: { scores: any; careers: string[]; lang?: string; compareQuestion?: string },
        @Request() req,
    ) {
        if (!body.scores) {
            throw new BadRequestException('Натиҷаҳои санҷишро фиристед');
        }
        if (!body.careers || body.careers.length < 2) {
            throw new BadRequestException('Ҳадди ақал 2 ихтисосро интихоб кунед');
        }
        return this.careerService.compareCarers(body.scores, body.careers, body.lang || 'tj', body.compareQuestion);
    }
}
