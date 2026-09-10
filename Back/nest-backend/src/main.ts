import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // Set global prefix
    app.setGlobalPrefix('api');

    // CORS.
    //
    // Дар production рӯйхати CORS_ORIGIN қатъӣ риоя мешавад.
    //
    // Дар development ҳар порти localhost иҷозат дода мешавад. Сабаб: Vite
    // ҳангоми банд будани 5173 худаш ба 5174, 5175 мегузарад, ва рӯйхати
    // қатъӣ ҳамаи дархостҳои APIро бесадо мебаст. Аломати он душворфаҳм буд:
    // саҳифа кор мекард, вале ҳама ҷо маълумот намеомад.
    const allowList = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
    const isProduction = process.env.NODE_ENV === 'production';

    // Дар production рӯйхати пештара нигоҳ дошта мешавад, то деплойи ҷорӣ
    // нашиканад. Барои домени воқеӣ CORS_ORIGIN-ро гузоштан лозим аст.
    const productionFallback = ['http://localhost:5173', 'http://localhost:3000'];

    /*
     * Дар development ба ғайр аз localhost суроғаҳои шабакаи дохилӣ низ
     * иҷозат дода мешаванд: 192.168.x.x, 10.x.x.x ва 172.16–31.x.x.
     *
     * Ҳангоми намоиш аз телефони ҳамон Wi-Fi origin дигар localhost нест,
     * балки 192.168.x.x — ва бе ин ҳамаи дархостҳои API бесадо баста
     * мешаванд. Аломаташ маҳз ҳамон аст, ки дар боло навишта шудааст:
     * саҳифа мекушояд, вале ҳеҷ ҷо маълумот намеояд.
     */
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
