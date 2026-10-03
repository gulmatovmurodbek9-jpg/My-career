import { IsArray, IsNotEmpty, ValidateNested, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class QuizAnswerDto {
    @ApiProperty({ example: 'r1' })
    @IsNotEmpty()
    questionId: string;

    @ApiProperty({ example: 3 })
    @IsNotEmpty()
    selectedValue: any;
}

export class SubmitQuizDto {
    @ApiProperty({ type: [QuizAnswerDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => QuizAnswerDto)
    answers: QuizAnswerDto[];

    @ApiProperty({ example: 'tj', required: false })
    @IsOptional()
    @IsString()
    lang?: string;

    @ApiProperty({ example: 9, required: false, description: 'Синфи хатмкарда: 9 (танҳо коллеҷ) ё 11' })
    @IsOptional()
    grade?: number | string;

    // Ихтиёрӣ: фанҳои қавӣ, «танҳо ройгон», шаҳр — барои тартиби ихтисосҳо ва огоҳиҳо.
    @ApiProperty({ required: false, example: { subjects: ['math'], budget: 'free', city: 'Хуҷанд' } })
    @IsOptional()
    context?: { subjects?: string[]; budget?: 'free' | 'any'; city?: string };
}
