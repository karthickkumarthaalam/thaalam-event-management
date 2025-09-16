import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as crypto from 'crypto';
import * as path from 'path';
import { ConfigService } from '@nestjs/config';
import { Attachment } from 'nodemailer/lib/mailer';
import { SentMessageInfo } from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('MAIL_HOST', 'smtp.zeptomail.in'),
      port: this.config.get<number>('MAIL_PORT', 587),
      secure: false,
      requireTLS: true,
      auth: {
        user: this.config.get<string>('MAIL_USER', 'emailapikey'),
        pass: this.config.get<string>('ZEPTO_API_KEY'),
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
  }

  private async sendEmail({
    toEmail,
    subject,
    htmlContent,
    attachments = [],
  }: {
    toEmail: string;
    subject: string;
    htmlContent: string;
    attachments?: Attachment[];
  }): Promise<SentMessageInfo> {
    try {
      const mailOptions = {
        from: `"Thaalam Media" <${this.config.get<string>('MAIL_FROM', 'noreply@thaalam.ch')}>`,
        to: toEmail,
        subject,
        html: htmlContent,
        attachments,
      };

      const info: SentMessageInfo =
        await this.transporter.sendMail(mailOptions);

      console.log('Email sent:', info.messageId);
      return info;
    } catch (error) {
      console.error('ZeptoMail sending error:', error);
      throw new Error('Failed to send email via ZeptoMail');
    }
  }

  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  async sendVerificationEmail(
    toEmail: string,
    toName: string,
    otp: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Hello ${toName},</h2>
        <p>Welcome to <strong>Thaalam Events Management</strong>! To complete the registration of your account, please verify your email address using the OTP below:</p>
        <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; text-align: center; border-radius: 8px;">
            <h1 style="color: #d63384; font-size: 32px; letter-spacing: 2px;">${otp}</h1>
        </div>
        <br>
        <p>Regards,<br>Thaalam Media Team</p>
        <img src="cid:logoimage" alt="Thaalam Media Logo" style="width: 150px; margin-top: 20px;" />
      </div>
    `;

    const attachments: Attachment[] = [
      {
        filename: 'thaalam-logo.png',
        path: path.join(process.cwd(), 'public/assets/thaalam-logo.png'),
        cid: 'logoimage',
      },
    ];

    return this.sendEmail({
      toEmail,
      subject: 'Verify Your Account',
      htmlContent,
      attachments,
    });
  }

  async sendPasswordResetEmail(
    toEmail: string,
    toName: string,
    otp: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const htmlContent = `
  <div style="font-family: Arial, sans-serif; color: #333;">
    <h2>Hello ${toName},</h2>
    <p>We received a request to reset your password for your <strong>Thaalam Events Management</strong> account.</p>
    <p>Use the OTP below to reset your password. This OTP is valid for 10 minutes only.</p>
    <div style="margin: 20px 0; padding: 15px; background-color: #f8f8f8; text-align: center; border-radius: 8px;">
        <h1 style="color: #d63384; font-size: 32px; letter-spacing: 2px;">${otp}</h1>
    </div>
    <p>If you did not request a password reset, please ignore this email or contact our support immediately.</p>
    <br>
    <p>Regards,<br>Thaalam Media Team</p>
    <img src="cid:logoimage" alt="Thaalam Media Logo" style="width: 150px; margin-top: 20px;" />
  </div>
`;

    const attachments: Attachment[] = [
      {
        filename: 'thaalam-logo.png',
        path: path.join(process.cwd(), 'public/assets/thaalam-logo.png'),
        cid: 'logoimage',
      },
    ];

    return this.sendEmail({
      toEmail,
      subject: 'Password Reset OTP',
      htmlContent,
      attachments,
    });
  }
}
