import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';

@Module({
    imports: [AiModule],
    controllers: [InterviewController],
    providers: [InterviewService],
})
export class InterviewModule { }
