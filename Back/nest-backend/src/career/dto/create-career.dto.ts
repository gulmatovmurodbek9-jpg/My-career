import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsNumber, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class SkillsDto {
    @ApiPropertyOptional({ example: ['JavaScript', 'React'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    technical?: string[];

    @ApiPropertyOptional({ example: ['Teamwork', 'Communication'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    soft?: string[];
}

class LearningResourcesDto {
    @ApiPropertyOptional({ example: ['Clean Code'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    books?: string[];

    @ApiPropertyOptional({ example: ['Udemy React'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    courses?: string[];

    @ApiPropertyOptional({ example: ['dev.to'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    blogs?: string[];
}

class SalaryAndMarketDto {
    @ApiPropertyOptional({ example: '$500-800' })
    @IsString()
    @IsOptional()
    junior?: string;

    @ApiPropertyOptional({ example: '$1000-2000' })
    @IsString()
    @IsOptional()
    mid?: string;

    @ApiPropertyOptional({ example: '$2000-5000' })
    @IsString()
    @IsOptional()
    senior?: string;
}

class MmtClusterDto {
    @ApiPropertyOptional({ example: 1 })
    @IsNumber()
    @IsOptional()
    clusterId?: number;
}

export class CreateCareerDto {
    @ApiPropertyOptional({ example: 'frontend-developer', description: 'Custom slug ID (optional)' })
    @IsString()
    @IsOptional()
    id?: string;

    @ApiProperty({ example: 'Frontend Developer', description: 'Career name' })
    @IsString()
    @IsNotEmpty({ message: 'Номи ихтисос бояд нависта шавад' })
    name: string;

    @ApiPropertyOptional({ example: 'Build web interfaces' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ example: 'Create beautiful UIs' })
    @IsString()
    @IsOptional()
    purpose?: string;

    @ApiPropertyOptional()
    @ValidateNested()
    @Type(() => SkillsDto)
    @IsOptional()
    skills?: SkillsDto;

    @ApiPropertyOptional({ example: ['React', 'Vue', 'Angular'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    technologies?: string[];

    @ApiPropertyOptional({
        example: ['Learn HTML', 'Learn CSS', 'Learn JavaScript'],
        description: 'Roadmap as array of strings',
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    roadmap?: string[];

    @ApiPropertyOptional({ example: ['Portfolio site', 'E-commerce app'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    projectsExamples?: string[];

    @ApiPropertyOptional()
    @ValidateNested()
    @Type(() => LearningResourcesDto)
    @IsOptional()
    learningResources?: LearningResourcesDto;

    @ApiPropertyOptional({ example: ['Team Lead', 'CTO'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    careerOpportunities?: string[];

    @ApiPropertyOptional()
    @ValidateNested()
    @Type(() => SalaryAndMarketDto)
    @IsOptional()
    salaryAndMarket?: SalaryAndMarketDto;

    @ApiPropertyOptional({ example: ['Backend Developer', 'Full-stack'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    relatedSpecializations?: string[];

    @ApiPropertyOptional({ example: 'Start with HTML/CSS' })
    @IsString()
    @IsOptional()
    advice?: string;

    @ApiPropertyOptional({ example: ['AWS Certified', 'Google Cloud'] })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    certification?: string[];

    @ApiPropertyOptional({
        example: ['TNU', 'TTU'],
        description: 'Universities as array of strings',
    })
    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    universities?: string[];

    @ApiPropertyOptional({ example: 1 })
    @IsNumber()
    @IsOptional()
    mmtCluster?: number;

    @ApiPropertyOptional({ example: 'uuid-of-cluster' })
    @IsString()
    @IsOptional()
    clusterId?: string;
}
