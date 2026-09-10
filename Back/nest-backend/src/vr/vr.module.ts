import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VrController } from './vr.controller';
import { VrService } from './vr.service';
import { AiModule } from '../ai/ai.module';
import { CareerModule } from '../career/career.module';
import { QuizModule } from '../quiz/quiz.module';
import { Career } from '../career/career.entity';
import { University } from '../university/university.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Career, University]),
        AiModule,
        CareerModule,
        QuizModule,
    ],
    controllers: [VrController],
    providers: [VrService],
    exports: [VrService],
})
export class VrModule { }
