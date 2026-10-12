import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { InsightController } from './insight.controller';
import { InsightService } from './insight.service';

@Module({
    imports: [AiModule],
    controllers: [InsightController],
    providers: [InsightService],
})
export class InsightModule { }
