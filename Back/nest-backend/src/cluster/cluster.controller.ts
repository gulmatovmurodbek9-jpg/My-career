import { Controller, Get, Post, Put, Delete, Body, Param, NotFoundException, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ClusterService } from './cluster.service';
import { CreateClusterDto } from './dto/create-cluster.dto';
import { ApiTags, ApiOperation, ApiParam, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('clusters')
@Controller('clusters')
export class ClusterController {
    constructor(private readonly clusterService: ClusterService) { }

    @Get()
    @ApiOperation({ summary: 'Get all clusters with their careers' })
    getAll(@Query('grade') grade?: string) {
        return this.clusterService.findAll(grade);
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

    // Тағйири кластерҳо — танҳо админ (пештар бе guard буд: ҳар кас нест ё иваз карда метавонист).
    @Post()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create a new cluster (admin)' })
    create(@Body() createClusterDto: CreateClusterDto) {
        return this.clusterService.create(createClusterDto);
    }

    @Put(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update cluster by ID (admin)' })
    @ApiParam({ name: 'id', description: 'Cluster UUID' })
    async update(@Param('id') id: string, @Body() updateDto: CreateClusterDto) {
        const cluster = await this.clusterService.findOne(id);
        if (!cluster) {
            throw new NotFoundException(`Кластер бо ID "${id}" ёфт нашуд`);
        }
        return this.clusterService.update(id, updateDto);
    }

    @Delete(':id')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete cluster by ID (admin)' })
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
