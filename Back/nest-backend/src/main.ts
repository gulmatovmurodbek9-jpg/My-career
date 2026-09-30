import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { QueryErrorFilter } from './common/query-error.filter';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Технологияи серверро ошкор намекунем (X-Powered-By: Express).
    app.getHttpAdapter().getInstance().disable('x-powered-by');
    // Пас аз nginx/Cloudflare — IP-и воқеии корбар барои лимитҳо (voice, auth).
    app.getHttpAdapter().getInstance().set('trust proxy', 1);

    // Ҳамаи роҳҳои API бо /api сар мешаванд.
    app.setGlobalPrefix('api');

    const allowList = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
    const isProduction = process.env.NODE_ENV === 'production';

    const productionFallback = ['http://localhost:5173', 'http://localhost:3000'];

    const devOrigin =
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?$/;

    // CORS: кадом сайтҳо ҳақ доранд ба ин API дархост фиристанд.
    app.enableCors({
        origin: allowList ?? (isProduction ? productionFallback : devOrigin),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
    });

    // Ҳар дархост пеш аз расидан ба контроллер аз рӯи DTO санҷида мешавад.
    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
    }));
    // id-и нодуруст → 400, на 500.
    app.useGlobalFilters(new QueryErrorFilter());

    // Swagger танҳо дар таҳия: дар production ҳамаи 62 эндпоинт (админӣ ҳам)
    // ба ҳама кушода буд. Барои кушодан: SWAGGER=1 дар .env.
    if (isProduction && process.env.SWAGGER !== '1') {
        const port = process.env.PORT || 3005;
        await app.listen(port);
        console.log(`Application is running on: http://localhost:${port}`);
        return;
    }

    const config = new DocumentBuilder()
        .setTitle('Career API')
        .setDescription('The Career API description')
        .setVersion('1.0')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'Authorization',
                description: 'Enter your JWT access token',
                in: 'header',
            },
        )
        .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3005;
    await app.listen(port);
    console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
