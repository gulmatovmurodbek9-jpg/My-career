import { Controller, Get, Header, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

// Барои мониторинг (UptimeRobot ва ғ.): 200 — сервер ва база кор мекунанд, 503 — не.
@ApiTags('health')
@Controller('health')
export class HealthController {
    constructor(private readonly dataSource: DataSource) { }

    @Get()
    @Header('Cache-Control', 'no-store')
    @ApiOperation({ summary: 'Ҳолати сервер ва база' })
    async check() {
        const started = Date.now();
        try {
            await this.dataSource.query('SELECT 1');
        } catch {
            throw new ServiceUnavailableException({ status: 'down', db: false });
        }
        return { status: 'ok', db: true, dbMs: Date.now() - started, uptimeSec: Math.round(process.uptime()) };
    }
}
