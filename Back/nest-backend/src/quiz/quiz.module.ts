import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QuizService } from './quiz.service';
import { QuizController } from './quiz.controller';
import { Career } from '../career/career.entity';
import { Cluster } from '../cluster/cluster.entity';
import { AiModule } from '../ai/ai.module';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Career, Cluster]),
        AiModule,
        UsersModule,
    ],
    controllers: [QuizController],
    providers: [QuizService],
    exports: [QuizService],
})
export class QuizModule { }
