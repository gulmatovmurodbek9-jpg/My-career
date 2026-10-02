import { Controller, Get, Post, Body, UseGuards, Req, HttpCode, HttpStatus } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { SubmitQuizDto } from './dto/submit-quiz.dto';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from '../users/users.service';

@ApiTags('quiz')
@Controller('quiz')
export class QuizController {
    constructor(
        private readonly quizService: QuizService,
        private readonly usersService: UsersService,
    ) { }

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
    interpret(@Body() body: { question?: string; options?: string[]; text?: string; lang?: string }) {
        return this.quizService.interpretAnswer(body?.question, body?.options, body?.text, body?.lang);
    }

    @Post('submit')
    @ApiOperation({ summary: 'Фиристодани ҷавобҳо ва гирифтани TOP 12 ихтисосҳо' })
    async submitQuiz(@Body() dto: SubmitQuizDto) {
        const scores = this.quizService.calculateScores(dto);

        const result = await this.quizService.matchCareers(scores, dto.lang, dto.grade);

        return {
            scores,
            ...result
        };
    }

    @Post('submit-authenticated')
    @UseGuards(AuthGuard('jwt'))
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Фиристодани ҷавобҳо (бо аутентификатсия) — натиҷаҳо захира мешаванд' })
    async submitQuizAuthenticated(@Body() dto: SubmitQuizDto, @Req() req: any) {
        const scores = this.quizService.calculateScores(dto);
        const result = await this.quizService.matchCareers(scores, dto.lang, dto.grade);

        await this.usersService.saveQuizResults(req.user.userId, scores);

        return {
            userId: req.user.userId,
            scores,
            ...result
        };
    }
}
