import { Module } from '@nestjs/common';
import { QuizService } from './quiz.service';
import { QuizStatsService } from './quiz-stats.service';
import { QuizController } from './quiz.controller';
import { AiModule } from '../ai/ai.module';
import { UsersModule } from '../users/users.module';
import { CareerModule } from '../career/career.module';
import { ClassroomModule } from '../classroom/classroom.module';

@Module({
    imports: [
        AiModule,
        UsersModule,
        CareerModule,
        ClassroomModule,
    ],
    controllers: [QuizController],
    providers: [QuizService, QuizStatsService],
    exports: [QuizService],
})
export class QuizModule { }
