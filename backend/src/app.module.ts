import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MissionsModule } from './missions/missions.module';
import { DigitalTwinModule } from './digital-twin/digital-twin.module';
import { UsersModule } from './users/users.module';
import { PolyhouseModule } from './polyhouse/polyhouse.module';
import { SessionModule } from './session/session.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://127.0.0.1:27017/kissanvikas'),
        serverSelectionTimeoutMS: 5000,
      }),
      inject: [ConfigService],
    }),
    UsersModule,
    PolyhouseModule,
    MissionsModule,
    DigitalTwinModule,
    SessionModule,
  ],

  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
