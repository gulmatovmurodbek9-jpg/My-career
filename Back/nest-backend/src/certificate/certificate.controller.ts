import { Body, Controller, Get, Ip, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { OptionalJwtGuard } from '../auth/guards/optional-jwt.guard';
import { CertificateService } from './certificate.service';

@ApiTags('certificates')
@Controller('certificates')
export class CertificateController {
    constructor(private readonly certificates: CertificateService) { }

    @Post()
    @UseGuards(OptionalJwtGuard)
    @ApiOperation({ summary: 'Сертификати касбинтихобкунӣ (рамз барои QR)' })
    create(@Body() body: any, @Ip() ip: string, @Req() req: any) {
        return this.certificates.create(body, ip, req.user?.userId || null);
    }

    @Get(':code')
    @ApiOperation({ summary: 'Тасдиқи сертификат аз рӯи рамз' })
    verify(@Param('code') code: string) {
        return this.certificates.verify(code);
    }
}
