import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { University } from './university.entity';
import { CareerOffering } from '../career/career-offering.entity';
import { UniversityService } from './university.service';
import { UniversityController } from './university.controller';

@Module({
    imports: [TypeOrmModule.forFeature([University, CareerOffering])],
    controllers: [UniversityController],
    providers: [UniversityService],
    exports: [UniversityService],
})
export class UniversityModule {}
