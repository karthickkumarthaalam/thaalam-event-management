import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/entities/user.entity';
import { JwtStrategy } from './jwt.strategy';
import { RefreshToken } from 'src/entities/refersh-token.entity';
import { Tenant } from 'src/entities/tenant.entity';
import { MailerService } from 'src/mail/mailer.service';
import { OTP } from 'src/entities/otp.entity';
import { OtpService } from './otp.service';
import { UserService } from './user.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, RefreshToken, Tenant, OTP]),
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: '30m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, MailerService, OtpService, UserService],
})
export class AuthModule {}
