import { IsEmail, IsNotEmpty, Length } from 'class-validator';

export class VerifyEmailDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be 6 digits' })
  otp: string;
}
