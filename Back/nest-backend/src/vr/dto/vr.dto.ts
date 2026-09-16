import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizAnswerDto } from '../../quiz/dto/submit-quiz.dto';

export class VrScoresDto {
    @ApiProperty({ example: 8 })
    @IsNumber()
    @Min(0)
    @Max(100)
    c1: number;

    @ApiProperty({ example: 3 })
    @IsNumber()
    @Min(0)
    @Max(100)
    c2: number;

    @ApiProperty({ example: 5 })
    @IsNumber()
    @Min(0)
    @Max(100)
    c3: number;

    @ApiProperty({ example: 2 })
    @IsNumber()
    @Min(0)
    @Max(100)
    c4: number;

    @ApiProperty({ example: 6 })
    @IsNumber()
    @Min(0)
    @Max(100)
    c5: number;
}

export class VrExplainDto {
    @ApiProperty({ type: VrScoresDto })
    @ValidateNested()
    @Type(() => VrScoresDto)
    scores: VrScoresDto;

    @ApiPropertyOptional({ example: 'tj', description: 'tj | ru | en' })
    @IsOptional()
    @IsString()
    lang?: string;

    @ApiPropertyOptional({ type: [String], example: ['барномасозӣ', 'AI'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keywords?: string[];
}

export class VrSessionDto {
    @ApiProperty({ type: [QuizAnswerDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuizAnswerDto)
    answers: QuizAnswerDto[];

    @ApiPropertyOptional({ example: 'tj' })
    @IsOptional()
    @IsString()
    lang?: string;
}

export class VrAskDto {
    @ApiProperty({ example: 'Барои дохил шудан чӣ лозим аст?' })
    @IsNotEmpty()
    @IsString()
    @MaxLength(300)
    question: string;

    @ApiPropertyOptional({ description: 'Ихтисосе, ки корбар дар VR интихоб кардааст' })
    @IsOptional()
    @IsUUID()
    careerId?: string;

    @ApiPropertyOptional({ example: 'tj' })
    @IsOptional()
    @IsString()
    lang?: string;
}

export class VrMapQueryDto {
    @ApiPropertyOptional({ description: 'Донишгоҳҳои маҳз ҳамин ихтисос' })
    @IsOptional()
    @IsUUID()
    careerId?: string;

    @ApiPropertyOptional({ example: 40.2833, description: 'Ҷои корбар — барои "наздиктарин"' })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    lat?: number;

    @ApiPropertyOptional({ example: 69.6333 })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    lon?: number;

    @ApiPropertyOptional({ example: 20 })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number;
}
