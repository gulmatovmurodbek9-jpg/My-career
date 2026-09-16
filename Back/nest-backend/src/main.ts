import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    app.setGlobalPrefix('api');

    const allowList = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
    const isProduction = process.env.NODE_ENV === 'production';

    const productionFallback = ['http://localhost:5173', 'http://localhost:3000'];

    const devOrigin =
        /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3})(?::\d+)?$/;

    app.enableCors({
        origin: allowList ?? (isProduction ? productionFallback : devOrigin),
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        credentials: true,
    });

    app.useGlobalPipes(new ValidationPipe({
        transform: true,
        whitelist: true,
    }));

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
