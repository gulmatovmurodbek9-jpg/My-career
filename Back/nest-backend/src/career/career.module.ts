import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CareerService } from './career.service';
import { CareerController } from './career.controller';
import { Career } from './career.entity';
import { CareerOffering } from './career-offering.entity';
import { Cluster } from '../cluster/cluster.entity';
import { AiModule } from '../ai/ai.module';
import { User } from '../users/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Career, CareerOffering, Cluster, User]),
        AiModule,
    ],
    controllers: [CareerController],
    providers: [CareerService],
    exports: [CareerService],
})
export class CareerModule { }
