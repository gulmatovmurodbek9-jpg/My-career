import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { CareerModule } from './career/career.module';
import { ClusterModule } from './cluster/cluster.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { QuizModule } from './quiz/quiz.module';
import { AiModule } from './ai/ai.module';
import { UniversityModule } from './university/university.module';
import { AppointmentModule } from './appointment/appointment.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env',
        }),
        CacheModule.register({
            isGlobal: true,
            ttl: 60000,
            max: 100,
        }),
        TypeOrmModule.forRootAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (configService: ConfigService) => ({
                type: 'postgres',
                host: configService.get<string>('DB_HOST', 'localhost'),
                port: configService.get<number>('DB_PORT', 5432),
                username: configService.get<string>('DB_USERNAME', 'postgres'),
                password: configService.get<string>('DB_PASSWORD', 'murodbek65'),
                database: configService.get<string>('DB_NAME', 'career_db'),
                entities: [__dirname + '/**/*.entity{.ts,.js}'],
                synchronize: configService.get<string>('NODE_ENV') !== 'production',
            }),
        }),
        CareerModule,
        ClusterModule,
        AuthModule,
        UsersModule,
        QuizModule,
        AiModule,
        UniversityModule,
        AppointmentModule,
    ],
})
export class AppModule { }
