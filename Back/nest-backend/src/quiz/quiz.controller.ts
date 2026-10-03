import { Controller, Get, Post, Body, UseGuards, Req, HttpCode, HttpStatus, Ip } from '@nestjs/common';
import { assertAiAllowed } from '../common/ai-limit';
import { QuizService } from './quiz.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';
import { QuizStatsService } from './quiz-stats.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { parseGrade } from '../common/grade';

@ApiTags('quiz')
@Controller('quiz')
export class QuizController {
    constructor(
        private readonly quizService: QuizService,
        private readonly usersService: UsersService,
        private readonly stats: QuizStatsService,
    ) { }

    // Баъди тест: «Натиҷа ба шумо мувофиқ буд? 1–5».
    @Post('feedback')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Баҳои хонанда ба натиҷаи тест (1–5)' })
    feedback(@Body() body: { attemptId?: string; rating?: number; comment?: string }) {
        return this.stats.feedback(String(body?.attemptId || ''), Number(body?.rating), body?.comment);
    }

    // «Дар ММТ кадом кластерро интихоб кардед?» — муқоисаи натиҷа бо интихоби воқеӣ.
    @Post('ntc-choice')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Кластере, ки хонанда дар ММТ интихоб кард (0–5)' })
    ntcChoice(@Body() body: { attemptId?: string; cluster?: number }) {
        return this.stats.ntcChoice(String(body?.attemptId || ''), Number(body?.cluster));
    }

    // Воронка: қадами охирини расида дар тест (бе маълумоти шахсӣ).
    @Post('progress')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Пешрафти тест барои воронка' })
    progress(@Body() body: { sessionId?: string; step?: number; total?: number; finished?: boolean }) {
        return this.stats.progress(String(body?.sessionId || ''), Number(body?.step), Number(body?.total), body?.finished === true);
    }

    // Сифати тест: равшанӣ, устуворӣ, мувофиқат бо ММТ, қаноатмандӣ, воронка (танҳо админ).
    @Get('quality')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Эътимоднокии тест ва баҳои хонандагон (админ)' })
    quality() {
        return this.stats.quality();
    }

    @Get('questions')
    @ApiOperation({ summary: 'Гирифтани ҳамаи саволҳои тести психологӣ' })
    getQuestions() {
        return this.quizService.getQuestions();
    }

    @Get('specialty-questions')
    @ApiOperation({ summary: 'Гирифтани 5 саволи махсус барои кластери интихобшуда' })
    getSpecialtyQuestions(@Req() req: any) {
        const clusterNumber = req.query.clusterNumber;
        return this.quizService.getSpecialtyQuestions(clusterNumber);
    }

    // Байни қадами 1 ва 2: танҳо холҳо, бе AI ва бе база — ҷавоб фавран.
    // Пештар дар ин ҷо «submit»-и пурра (бо маслиҳати AI) чанд сония интизор мекард.
    @Post('score')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Холҳои кластерҳо барои ҷавобҳои то ин дам (бе AI)' })
    score(@Body() dto: SubmitQuizDto) {
        return { scores: this.quizService.calculateScores(dto) };
    }

    // Ҷавоби озоди корбар (навишта ё гуфта) → варианти наздиктарин. Худи хол
    // ҳамон хол-и вариант мемонад — санҷиш одилона ва якхела ҳисоб мешавад.
    @Post('interpret')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Ҷавоби озод → варианти наздиктарин (AI)' })
    interpret(@Body() body: { question?: string; options?: string[]; text?: string; lang?: string }, @Ip() ip: string) {
        assertAiAllowed(ip);
        return this.quizService.interpretAnswer(body?.question, body?.options, body?.text, body?.lang);
    }

    @Post('submit')
    @ApiOperation({ summary: 'Фиристодани ҷавобҳо ва гирифтани TOP 12 ихтисосҳо' })
    async submitQuiz(@Body() dto: SubmitQuizDto) {
        const scores = this.quizService.calculateScores(dto);

        const result = await this.quizService.matchCareers(scores, dto.lang, dto.grade, dto.context);
        const attemptId = await this.stats.record(dto.answers, scores, result?.topCluster?.clusterNumber ? `c${result.topCluster.clusterNumber}` : null, parseGrade(dto.grade));

        return {
            scores,
            attemptId,
            ...result
        };
    }

    @Post('submit-authenticated')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Фиристодани ҷавобҳо (бо аутентификатсия) — натиҷаҳо захира мешаванд' })
    async submitQuizAuthenticated(@Body() dto: SubmitQuizDto, @Req() req: any) {
        const scores = this.quizService.calculateScores(dto);
        const result = await this.quizService.matchCareers(scores, dto.lang, dto.grade, dto.context);

        await this.usersService.saveQuizResults(req.user.userId, scores);
        const attemptId = await this.stats.record(dto.answers, scores, result?.topCluster?.clusterNumber ? `c${result.topCluster.clusterNumber}` : null, parseGrade(dto.grade), req.user.userId);

        return {
            userId: req.user.userId,
            attemptId,
            scores,
            ...result
        };
    }
}
