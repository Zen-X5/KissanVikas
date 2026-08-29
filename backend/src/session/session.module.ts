import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { Session, SessionSchema } from './schemas/session.schema';
import { UsersModule } from '../users/users.module';
import { AuthGuard } from './guards/auth.guard';
import { RolesGuard } from './guards/roles.guard';

@Module({
  imports: [
    UsersModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'kissanvikas-super-secret-key-2026',
      signOptions: { expiresIn: '30d' },
    }),
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
  ],
  controllers: [SessionController],
  providers: [SessionService, AuthGuard, RolesGuard],
  exports: [SessionService, AuthGuard, RolesGuard, JwtModule],
})
export class SessionModule {}
