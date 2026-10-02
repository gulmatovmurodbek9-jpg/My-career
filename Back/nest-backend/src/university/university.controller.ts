import { Controller, Get, Header, Param, Query } from '@nestjs/common';

// 138: маълумоти муассисаҳо кам иваз мешавад — браузер 5 дақиқа аз кеш мегирад.
const CACHE = 'public, max-age=300';
import { UniversityService } from './university.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('universities')
@Controller('universities')
export class UniversityController {
    constructor(private readonly universityService: UniversityService) {}

    @Get()
    @Header('Cache-Control', CACHE)
    @ApiOperation({ summary: 'Get all universities with mapped career counts' })
    async findAll(@Query('lang') lang?: string, @Query('grade') grade?: string) {
        return this.universityService.findAll(lang, grade);
    }

    @Get('summary')
    @Header('Cache-Control', CACHE)
    @ApiOperation({ summary: 'Counts: colleges, higher-education institutions, grade-9 options' })
    async summary() {
        return this.universityService.summary();
    }

    @Get('cities')
    @Header('Cache-Control', CACHE)
    @ApiOperation({ summary: 'List cities that have institutions, with counts' })
    async findCities(@Query('lang') lang?: string) {
        return this.universityService.findCities(lang);
    }

    @Get(':id')
    @Header('Cache-Control', CACHE)
    @ApiOperation({ summary: 'Get details of a single university' })
    @ApiParam({ name: 'id', description: 'UUID of the university' })
    async findOne(@Param('id') id: string, @Query('lang') lang?: string) {
        return this.universityService.findOne(id, lang);
    }

    @Get(':id/specialties')
    @Header('Cache-Control', CACHE)
    @ApiOperation({ summary: 'Get specialties of a university' })
    @ApiParam({ name: 'id', description: 'UUID of the university' })
    async findSpecialties(@Param('id') id: string, @Query('lang') lang?: string, @Query('grade') grade?: string) {
        return this.universityService.findSpecialties(id, lang, grade);
    }
}
