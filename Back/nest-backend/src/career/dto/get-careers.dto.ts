import { IsOptional, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCareersDto {
    @ApiPropertyOptional({ description: 'Search term for name or description' })
    @IsOptional()
    @IsString()
    search?: string;

    @ApiPropertyOptional({ description: 'Cluster ID to filter by' })
    @IsOptional()
    @IsString()
    clusterId?: string;

    @ApiPropertyOptional({ description: 'Maximum tuition fee' })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    maxPrice?: number;

    @ApiPropertyOptional({ description: 'University name to filter by' })
    @IsOptional()
    @IsString()
    university?: string;

    @ApiPropertyOptional({ description: 'City to filter by, e.g. "Хуҷанд"' })
    @IsOptional()
    @IsString()
    city?: string;

    @ApiPropertyOptional({ description: 'Official NTC specialty code' })
    @IsOptional()
    @IsString()
    code?: string;

    @ApiPropertyOptional({ description: 'Only specialties that have state-funded seats' })
    @IsOptional()
    @IsString()
    freeSeatsOnly?: string;

    @ApiPropertyOptional({ description: 'Page number (default: 1)', minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({ description: 'Items per page (default: 10)', minimum: 1 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    limit?: number = 10;
}
