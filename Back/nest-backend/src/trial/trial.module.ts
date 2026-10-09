import { Module } from '@nestjs/common';
import { TrialController } from './trial.controller';
import { TrialService } from './trial.service';
import { ClassroomModule } from '../classroom/classroom.module';

@Module({
    imports: [ClassroomModule],
    controllers: [TrialController],
    providers: [TrialService],
})
export class TrialModule { }
