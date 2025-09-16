import {
  Controller,
  Post,
  Body,
  Res,
  Req,
  UnauthorizedException,
  UseGuards,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import type { Response, Request } from 'express';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ------------------- REGISTER -------------------
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.register(
      createUserDto.email,
      createUserDto.password,
      createUserDto.tenantName,
      createUserDto.name,
      createUserDto.phone,
    );
  }

  // ------------------- VERIFY EMAIL -------------------
  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto.email, dto.otp);
  }

  // ------------------- RESEND OTP -------------------
  @Post('resend-otp')
  async resendOtp(@Body() dto: ResendOtpDto) {
    return this.authService.resendOtp(dto.email);
  }

  // ------------------- LOGIN -------------------
  @Post('login')
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.login(
      loginDto.email,
      loginDto.password,
      loginDto.tenantName,
    );

    // Set refresh token in HttpOnly cookie
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: this.authService.isProduction(),
      sameSite: this.authService.isProduction() ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.cookie('device_id', tokens.device_id, {
      httpOnly: true,
      secure: this.authService.isProduction(),
      sameSite: this.authService.isProduction() ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { access_token: tokens.access_token, user: tokens.user };
  }

  //-------------------- GETTING USER DETAILS -------------------
  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  getCurrentUser(@Req() req: Request) {
    return { user: req.user };
  }

  // ------------------- FORGOT PASSWORD -------------------
  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  // ------------------- RESET PASSWORD -------------------
  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.email, dto.otp, dto.newPassword);
  }

  // ------------------- REFRESH TOKEN -------------------
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const cookie = req.cookies as Record<string, string> | undefined;

    const refreshToken = cookie?.['refresh_token'];
    const deviceId = cookie?.['device_id'];
    if (!refreshToken || !deviceId)
      throw new UnauthorizedException('No refresh token or device id');

    const decoded = this.authService.decodeToken(refreshToken);
    const tokens = await this.authService.refreshTokens(
      decoded.sub,
      deviceId,
      refreshToken,
    );

    // Update refresh token cookie
    res.cookie('refresh_token', tokens.refresh_token, {
      httpOnly: true,
      secure: this.authService.isProduction(),
      sameSite: this.authService.isProduction() ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.cookie('device_id', deviceId, {
      httpOnly: true,
      secure: this.authService.isProduction(),
      sameSite: this.authService.isProduction() ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return { access_token: tokens.access_token };
  }

  // ------------------- LOGOUT -------------------
  @Post('logout')
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const cookies = req.cookies as Record<string, string> | undefined;
    const refreshToken = cookies?.['refresh_token'];

    if (!refreshToken) return { message: 'Already logged out' };

    const decoded = this.authService.decodeToken(refreshToken);
    await this.authService.logout(decoded.sub);

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: this.authService.isProduction(),
      sameSite: this.authService.isProduction() ? 'none' : 'lax',
    });

    return { message: 'Logged out successfully' };
  }
}
