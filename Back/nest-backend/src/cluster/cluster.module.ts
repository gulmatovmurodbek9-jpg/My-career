import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClusterService } from './cluster.service';
import { ClusterController } from './cluster.controller';
import { Cluster } from './cluster.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Cluster])],
    providers: [ClusterService],
    controllers: [ClusterController],
    exports: [ClusterService],
})
export class ClusterModule { }
