import { Body, Controller, Get, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
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

    // Як бор дар сессияи браузер: «аз корти натиҷа омад» (?ref=card). Бе маълумоти шахсӣ.
    @Post('ref')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Ҳисоби ташрифҳо аз корти натиҷа (?ref=card)' })
    ref(@Body() body: { ref?: string }) {
        return this.impact.visit(body?.ref);
    }
}
