import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // Gmail SMTP configuration (500 emails/day FREE)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App Password, not regular password
      },
    });

    console.log('✅ Email service initialized (Nodemailer + Gmail SMTP)');
  }

  async sendOTP(to: string, otp: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Rozgaar360" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Password Reset OTP - Rozgaar360',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Rozgaar360</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Password Reset Request</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                You requested to reset your password. Use the OTP below to proceed:
              </p>
              <div style="background: white; border: 2px dashed #667eea; border-radius: 8px; padding: 20px; text-align: center; margin: 30px 0;">
                <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Your OTP Code</p>
                <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0;">${otp}</h1>
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                ⏰ This OTP is valid for <strong>10 minutes</strong>
              </p>
              <p style="color: #6b7280; font-size: 14px;">
                If you didn't request this, please ignore this email.
              </p>
            </div>
            <div style="background: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Rozgaar360. All rights reserved.
              </p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ OTP email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      return false;
    }
  }

  async sendWelcomeEmail(to: string, name: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Rozgaar360" <${process.env.EMAIL_USER}>`,
        to: to,
        subject: 'Welcome to Rozgaar360!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Welcome to Rozgaar360!</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Hello ${name}! 👋</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for joining Rozgaar360 - Pakistan's leading platform for skilled workers.
              </p>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                You can now connect with thousands of verified professionals or offer your services.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/login" style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  Get Started
                </a>
              </div>
            </div>
            <div style="background: #1f2937; padding: 20px; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                © ${new Date().getFullYear()} Rozgaar360. All rights reserved.
              </p>
            </div>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Welcome email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Welcome email failed:', error.message);
      return false;
    }
  }
}
