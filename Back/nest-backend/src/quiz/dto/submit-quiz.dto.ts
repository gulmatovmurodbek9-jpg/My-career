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
}
