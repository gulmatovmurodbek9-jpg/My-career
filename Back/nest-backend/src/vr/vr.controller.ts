import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { VrService } from './vr.service';
import { VrAskDto, VrExplainDto, VrMapQueryDto, VrSessionDto } from './dto/vr.dto';

@ApiTags('vr')
@Controller('vr')
export class VrController {
    constructor(private readonly vrService: VrService) { }

    @Post('session')
    @ApiOperation({
        summary: 'Ҷавобҳои хом аз VR → профил, касбҳо ва шарҳ дар як дархост',
        description: 'Барои ҳолате ки барномаи VR ҳисобро ба сервер вогузор мекунад.',
    })
    session(@Body() dto: VrSessionDto) {
        return this.vrService.session(dto);
    }

    @Post('explain')
    @ApiOperation({
        summary: 'Холҳои дар Unity ҳисобшуда → касбҳо ва шарҳи AI',
        description: 'Роҳи асосии VR: айнак худаш ҳисоб мекунад, сервер танҳо мефаҳмонад.',
    })
    explain(@Body() dto: VrExplainDto) {
        return this.vrService.explain(dto);
    }

    @Get('map')
    @ApiOperation({
        summary: 'Нуқтаҳои харитаи Тоҷикистон — донишгоҳҳо бо координатҳои воқеӣ',
        description: 'Барои пардаи 7. Бо lat/lon масофа ҳисоб ва наздиктарин муайян мешавад.',
    })
    map(@Query() query: VrMapQueryDto) {
        return this.vrService.map(query);
    }

    @Post('ask')
    @ApiOperation({
        summary: 'Сӯҳбати озод бо Сино — ҷавоб танҳо аз базаи маълумот',
        description: 'Агар ҷавоб дар база набошад, Сино рӯйрост мегӯяд, ки намедонад.',
    })
    ask(@Body() dto: VrAskDto) {
        return this.vrService.ask(dto);
    }
}
