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

  async sendPaymentLinkEmail(
    eventName: string,
    toEmail: string,
    toName: string,
    orderId: string,
    checkoutUrl: string,
  ): Promise<nodemailer.SentMessageInfo> {
    const htmlContent = `
  <div style="font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; background-color: #f5f5f7; padding: 40px 0;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 16px rgba(0,0,0,0.08); overflow: hidden;">

      <!-- Header -->
      <div style="background-color: #4f46e5; padding: 20px; text-align: center; color: #ffffff;">
        <h1 style="margin:0; font-size: 24px;">${eventName}</h1>
      </div>

      <!-- Body -->
      <div style="padding: 30px;">
        <h2 style="color: #111827; font-size: 20px; margin-bottom: 10px;">Hello ${toName},</h2>

        <p style="font-size: 16px; line-height: 1.5;">
          Your order <strong>#${orderId}</strong> has been created successfully.
          To complete your booking, please proceed with the secure payment link below:
        </p>

        <div style="margin: 30px 0; text-align: center;">
          <a href="${checkoutUrl}" 
             style="background: linear-gradient(90deg, #6366f1, #4f46e5); color: #fff; padding: 16px 32px; 
                    font-size: 16px; font-weight: bold; text-decoration: none; border-radius: 8px;
                    display: inline-block; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: all 0.2s ease;">
            Pay Now
          </a>
        </div>

        <p style="font-size: 14px; color: #6b7280; text-align: center;">
          Or copy and paste the link below into your browser:
        </p>
        <p style="word-break: break-all; text-align: center;">
          <a href="${checkoutUrl}" style="color: #4f46e5; font-size: 14px;">${checkoutUrl}</a>
        </p>

        <p style="font-size: 14px; color: #6b7280; margin-top: 20px;">
          This payment link will remain valid until the session expires. Please complete your payment at the earliest to confirm your order.
        </p>

        <div style="text-align: center; margin-top: 40px;">
          <p style="margin:0; font-size: 16px; color: #111827;">Regards,</p>
          <p style="margin:0; font-weight: bold; font-size: 16px; color: #111827;">Thaalam Media Team</p>
          <img src="cid:logoimage" alt="Thaalam Media Logo" 
               style="width: 120px; margin-top: 20px;" />
        </div>
      </div>

      <!-- Footer -->
      <div style="background-color: #f3f4f6; text-align: center; padding: 15px; font-size: 12px; color: #9ca3af;">
        &copy; ${new Date().getFullYear()} Thaalam Media. All rights reserved.
      </div>

    </div>
  </div>
  `;

    // const attachments: Attachment[] = [
    //   {
    //     filename: 'thaalam-logo.png',
    //     path: path.join(process.cwd(), 'public/assets/thaalam-logo.png'),
    //     cid: 'logoimage',
    //   },
    // ];

    return this.sendEmail({
      toEmail,
      subject: `Complete Your Payment - Order #${orderId}`,
      htmlContent,
    });
  }
}
