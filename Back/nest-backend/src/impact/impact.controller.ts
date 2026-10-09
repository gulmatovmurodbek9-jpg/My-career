import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { ImpactService } from './impact.service';

@ApiTags('impact')
@Controller('impact')
export class ImpactController {
    constructor(private readonly impact: ImpactService) { }

    @Get()
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('admin')
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Лавҳаи таъсир: тест, санҷиши касб, боварӣ пеш ва баъд (админ)' })
    get() {
        return this.impact.impact();
    }
}
