import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      global: true,
      secret: 'SECRET_KEY_YANG_SANGAT_RAHASIA', // Nanti ganti dengan environment variable
      signOptions: { expiresIn: '60m' }, // Token berlaku selama 60 menit
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}