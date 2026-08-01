import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException } from '@nestjs/common';
import { ClusterService } from './cluster.service';
import { CreateClusterDto } from './dto/create-cluster.dto';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('clusters')
@Controller('clusters')
export class ClusterController {
    constructor(private readonly clusterService: ClusterService) { }

    @Get()
    @ApiOperation({ summary: 'Get all clusters with their careers' })
    getAll() {
        return this.clusterService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get cluster by ID with careers' })
    @ApiParam({ name: 'id', description: 'Cluster UUID' })
    async getOne(@Param('id') id: string) {
        const cluster = await this.clusterService.findOne(id);
        if (!cluster) {
            throw new NotFoundException(`Кластер бо ID "${id}" ёфт нашуд`);
        }
        return cluster;
    }

    @Post()
    @ApiOperation({ summary: 'Create a new cluster' })
    create(@Body() createClusterDto: CreateClusterDto) {
        return this.clusterService.create(createClusterDto);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update cluster by ID' })
    @ApiParam({ name: 'id', description: 'Cluster UUID' })
    async update(@Param('id') id: string, @Body() updateDto: CreateClusterDto) {
        const cluster = await this.clusterService.findOne(id);
        if (!cluster) {
            throw new NotFoundException(`Кластер бо ID "${id}" ёфт нашуд`);
        }
        return this.clusterService.update(id, updateDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete cluster by ID' })
    @ApiParam({ name: 'id', description: 'Cluster UUID' })
    async delete(@Param('id') id: string) {
        const cluster = await this.clusterService.findOne(id);
        if (!cluster) {
            throw new NotFoundException(`Кластер бо ID "${id}" ёфт нашуд`);
        }
        await this.clusterService.delete(id);
        return { message: `Кластери "${cluster.clusterName}" нест карда шуд` };
    }
}
