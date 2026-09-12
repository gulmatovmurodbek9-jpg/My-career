import { Controller, Get, Param, Query } from '@nestjs/common';
import { UniversityService } from './university.service';
import { ApiTags, ApiOperation, ApiParam } from '@nestjs/swagger';

@ApiTags('universities')
@Controller('universities')
export class UniversityController {
    constructor(private readonly universityService: UniversityService) {}

    @Get()
    @ApiOperation({ summary: 'Get all universities with mapped career counts' })
    async findAll(@Query('lang') lang?: string) {
        return this.universityService.findAll(lang);
    }

    @Get('cities')
    @ApiOperation({ summary: 'List cities that have institutions, with counts' })
    async findCities(@Query('lang') lang?: string) {
        return this.universityService.findCities(lang);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get details of a single university' })
    @ApiParam({ name: 'id', description: 'UUID of the university' })
    async findOne(@Param('id') id: string, @Query('lang') lang?: string) {
        return this.universityService.findOne(id, lang);
    }

    @Get(':id/specialties')
    @ApiOperation({ summary: 'Get specialties of a university' })
    @ApiParam({ name: 'id', description: 'UUID of the university' })
    async findSpecialties(@Param('id') id: string) {
        return this.universityService.findSpecialties(id);
    }
}
