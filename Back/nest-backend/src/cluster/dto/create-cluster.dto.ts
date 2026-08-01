import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateClusterDto {
    @ApiProperty({ example: 'IT', description: 'The name of the cluster' })
    @IsString()
    @IsNotEmpty()
    clusterName: string;

    @ApiProperty({ example: 'computer', description: 'The icon of the cluster' })
    @IsString()
    @IsNotEmpty()
    clusterIcon: string;
}
