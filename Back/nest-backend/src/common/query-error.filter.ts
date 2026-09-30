import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import type { Response } from 'express';

// Хатои базаро ба ҷавоби фаҳмо табдил медиҳад. Пештар id-и нодуруст
// (/api/universities/abc) 500 медод — ҳоло 400; «ёфт нашуд» дар контроллерҳо 404 аст.
// Кодҳои PostgreSQL: 22P02 — формати нодуруст (uuid, рақам), 22003 — адад аз ҳад берун.
@Catch(QueryFailedError)
export class QueryErrorFilter implements ExceptionFilter {
    private readonly logger = new Logger('Database');

    catch(error: QueryFailedError & { code?: string; driverError?: { code?: string } }, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse<Response>();
        const code = error.driverError?.code || error.code;
        if (code === '22P02' || code === '22003' || code === '22007') {
            response.status(400).json({ statusCode: 400, message: 'Параметри нодуруст', error: 'Bad Request' });
            return;
        }
        this.logger.error(error.message);
        response.status(500).json({ statusCode: 500, message: 'Хатои сервер' });
    }
}
