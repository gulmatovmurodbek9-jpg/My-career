import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { ParentController } from './parent.controller';
import { ParentService } from './parent.service';

@Module({
    imports: [AiModule],
    controllers: [ParentController],
    providers: [ParentService],
})
export class ParentModule { }
