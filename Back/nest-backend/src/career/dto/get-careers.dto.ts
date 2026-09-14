import { IsOptional, IsString, IsInt, Min, IsArray } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCareersDto {
    @ApiPropertyOptional({ description: 'Search term for name or description' })
    @IsOptional()
    @IsString()
    search?: string;
    @ApiPropertyOptional({ description: 'Any of these words in the specialty name (used by AI search)', type: [String] })
    @IsOptional()
    /* Дар GET як калима ҳамчун сатр меояд, якчанд — ҳамчун массив. */
    @Transform(({ value }) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]))
    @IsArray()
    @IsString({ each: true })
    searchAny?: string[];
    @ApiPropertyOptional({ description: 'Exact official specialty names (used by AI search)', type: [String] })
    @IsOptional()
    @Transform(({ value }) => (value === undefined ? undefined : Array.isArray(value) ? value : [value]))
    @IsArray()
    @IsString({ each: true })
    names?: string[];

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
