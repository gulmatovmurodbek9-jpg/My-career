import { IsArray, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { QuizAnswerDto } from '../../quiz/dto/submit-quiz.dto';

/**
 * Холи панҷ кластер, ки барномаи VR ХУДАШ бо код ҳисоб кардааст.
 *
 * Талаби ТЗ: профил бо код ҳисоб мешавад, на бо AI. Барномаи Unity ҳамон
 * формулаи `QuizService.calculateScores()`-ро дар C# такрор мекунад, то дар
 * фестивал бе интернет ҳам кор кунад, ва ба ин ҷо натиҷаи тайёрро мефиристад.
 */
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

/** `POST /vr/explain` — холҳо аз Unity, шарҳ аз AI. */
export class VrExplainDto {
    @ApiProperty({ type: VrScoresDto })
    @ValidateNested()
    @Type(() => VrScoresDto)
    scores: VrScoresDto;

    @ApiPropertyOptional({ example: 'tj', description: 'tj | ru | en' })
    @IsOptional()
    @IsString()
    lang?: string;

    /**
     * Калидвожаҳои ҷавобҳои корбар (агар VR саволҳои ихтисосро пурсида бошад).
     * Бе онҳо низ кор мекунад — интихоб танҳо аз рӯи кластер меравад.
     */
    @ApiPropertyOptional({ type: [String], example: ['барномасозӣ', 'AI'] })
    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    keywords?: string[];
}

/** `POST /vr/session` — ҷавобҳои хом аз Unity, ҳамаи натиҷа дар як дархост. */
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

/** `POST /vr/ask` — сӯҳбати озод бо Сино (пардаи 9). */
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

/** `GET /vr/map` — нуқтаҳои харитаи Тоҷикистон (пардаи 7). */
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
