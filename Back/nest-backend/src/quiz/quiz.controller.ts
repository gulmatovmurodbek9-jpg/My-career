import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
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

    @Post('submit')
    @ApiOperation({ summary: 'Фиристодани ҷавобҳо ва гирифтани TOP 12 ихтисосҳо' })
    async submitQuiz(@Body() dto: SubmitQuizDto) {
        // Calculate raw scores from answers
        const scores = this.quizService.calculateScores(dto);

        // Match against all careers
        const result = await this.quizService.matchCareers(scores, dto.lang);

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
        const result = await this.quizService.matchCareers(scores, dto.lang);

        await this.usersService.saveQuizResults(req.user.userId, scores);

        return {
            userId: req.user.userId,
            scores,
            ...result
        };
    }
}
