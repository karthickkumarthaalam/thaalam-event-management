import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConfigService } from '@nestjs/config';
import { UserService } from './user.service';
import { OtpService } from './otp.service';
import { OtpPurpose } from 'src/entities/otp.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from 'src/entities/refersh-token.entity';
import { v4 as uuid } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly userService: UserService,
    private readonly otpService: OtpService,

    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
  ) {}

  async register(
    email: string,
    password: string,
    tenantName: string,
    name: string,
    phone: string,
  ) {
    const user = await this.userService.createUser(
      email,
      password,
      tenantName,
      name,
      phone,
    );
    await this.otpService.sendEmailVerificationOtp(user);
    return { message: 'User registered. Please check your email for OTP.' };
  }

  async verifyEmail(email: string, otp: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');
    if (user.isEmailVerified)
      throw new BadRequestException('Email already verified');

    await this.otpService.validateOtp(user, otp, OtpPurpose.EMAIL_VERIFICATION);
    await this.userService.markEmailVerified(user);

    return { message: 'Email verified successfully' };
  }

  async resendOtp(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');
    if (user.isEmailVerified)
      throw new BadRequestException('Email already verified');

    await this.otpService.sendEmailVerificationOtp(user);
    return { message: 'A new OTP has been sent to your email.' };
  }

  async login(email: string, password: string, tenantName: string) {
    const user = await this.userService.findByEmail(email);
    if (!user || user.tenant.name !== tenantName)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isEmailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, tenant_id: user.tenant.id };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '30m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    const hashedRefreshToken = await bcrypt.hash(refreshToken, 10);
    const deviceId = uuid();
    await this.refreshTokenRepo.save(
      this.refreshTokenRepo.create({
        userId: user.id,
        deviceId,
        token: hashedRefreshToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      }),
    );

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      device_id: deviceId,
      user: {
        email: user.email,
        name: user.name,
        tenantName: user.tenant.name,
      },
    };
  }

  async forgotPassword(email: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');

    if (!user.isEmailVerified) {
      throw new BadRequestException(
        'Please verify your email before resetting password',
      );
    }

    await this.otpService.sendPasswordResetOtp(user);
    return { message: 'OTP sent to email' };
  }

  async resetPassword(email: string, otp: string, newPassword: string) {
    const user = await this.userService.findByEmail(email);
    if (!user) throw new BadRequestException('User not found');
    await this.otpService.validateOtp(user, otp, OtpPurpose.PASSWORD_RESET);
    await this.userService.updatePassword(user, newPassword);
    return { message: 'Password reset successfully' };
  }

  async refreshTokens(userId: string, deviceId: string, refreshToken: string) {
    const tokenEntry = await this.refreshTokenRepo.findOne({
      where: { userId, deviceId },
    });
    if (!tokenEntry) throw new UnauthorizedException('Refresh token not found');

    const isValid = await bcrypt.compare(refreshToken, tokenEntry.token);
    if (!isValid) throw new UnauthorizedException('Invalid refresh token');

    if (tokenEntry.expiresAt < new Date())
      throw new UnauthorizedException('Refresh token expired');

    const user = await this.userService.findById(userId);
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('Email not verified');
    }

    const payload = {
      sub: user.id,
      tenant_id: user.tenant.id,
      email: user.email,
    };

    const access_token = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_SECRET'),
      expiresIn: '30m',
    });

    const newRefreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
    });

    tokenEntry.token = await bcrypt.hash(newRefreshToken, 10);
    tokenEntry.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await this.refreshTokenRepo.save(tokenEntry);

    return {
      access_token,
      refresh_token: newRefreshToken,
      device_id: deviceId,
    };
  }

  decodeToken(token: string): {
    sub: string;
    tenant_id?: string;
    email?: string;
  } {
    const payload = this.jwtService.decode(token);

    if (!payload || typeof payload === 'string') {
      throw new UnauthorizedException('Invalid token');
    }

    return payload as { sub: string; tenant_id?: string; email?: string };
  }

  async logout(userId: string) {
    await this.refreshTokenRepo.delete({ userId });
    return { message: 'Logged out successfully' };
  }

  isProduction() {
    return this.config.get<string>('NODE_ENV') === 'production';
  }
}
