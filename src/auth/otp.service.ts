import { Injectable, BadRequestException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OTP, OtpPurpose } from 'src/entities/otp.entity';
import { User } from 'src/entities/user.entity';
import { MailerService } from 'src/mail/mailer.service';

@Injectable()
export class OtpService {
  constructor(
    @InjectRepository(OTP) private readonly otpRepo: Repository<OTP>,
    private readonly mailerService: MailerService,
  ) {}

  private OTP_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  async generateOtp(user: User, purpose: OtpPurpose): Promise<OTP> {
    // Invalidate previous OTPs
    await this.otpRepo.update(
      { user: { id: user.id }, purpose, isUsed: false },
      { isUsed: true },
    );

    const code = this.mailerService.generateOTP();
    const expiryAt = new Date(Date.now() + this.OTP_EXPIRY_MS);

    const otpEntity = this.otpRepo.create({
      user,
      code,
      purpose,
      expiryAt,
      isUsed: false,
    });
    return this.otpRepo.save(otpEntity);
  }

  async validateOtp(
    user: User,
    code: string,
    purpose: OtpPurpose,
  ): Promise<OTP> {
    const otpEntity = await this.otpRepo.findOne({
      where: { user: { id: user.id }, code, purpose, isUsed: false },
      relations: ['user'],
    });

    if (!otpEntity || otpEntity.expiryAt < new Date()) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    otpEntity.isUsed = true;
    await this.otpRepo.save(otpEntity);

    return otpEntity;
  }

  async sendEmailVerificationOtp(user: User) {
    const otp = await this.generateOtp(user, OtpPurpose.EMAIL_VERIFICATION);
    await this.mailerService.sendVerificationEmail(
      user.email,
      user.name,
      otp.code,
    );
  }

  async sendPasswordResetOtp(user: User) {
    const otp = await this.generateOtp(user, OtpPurpose.PASSWORD_RESET);
    await this.mailerService.sendPasswordResetEmail(
      user.email,
      user.name,
      otp.code,
    );
  }
}
