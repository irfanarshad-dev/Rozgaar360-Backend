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

  async sendChatNotification(to: string, name: string, senderName: string, messageText: string): Promise<boolean> {
    try {
      const preview = messageText.length > 100 ? `${messageText.slice(0, 100)}...` : messageText;
      const mailOptions = {
        from: `"Rozgaar360" <${process.env.EMAIL_USER}>`,
        to,
        subject: `New message from ${senderName} on Rozgaar360`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #22c55e 0%, #14b8a6 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">New Message Alert</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Hello ${name},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                You have a new message from <strong>${senderName}</strong> on Rozgaar360.
              </p>
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">Message preview:</p>
                <p style="color: #111827; font-size: 16px; line-height: 1.7; margin: 0;">${preview || 'No text content.'}</p>
              </div>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Open the chat in your Rozgaar360 dashboard to reply and continue the conversation.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/customer/chat" style="background: #22c55e; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  View Message
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
      console.log(`✅ Chat notification email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Chat notification email failed:', error.message);
      return false;
    }
  }

  async sendVerificationApproved(to: string, name: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Rozgaar360" <${process.env.EMAIL_USER}>`,
        to,
        subject: '🎉 Your Verification has been Approved - Rozgaar360',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Verification Approved!</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Congratulations ${name}! 🎉</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Great news! Your worker verification has been <strong style="color: #10b981;">approved</strong> by our admin team.
              </p>
              <div style="background: white; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 30px;">✓</span>
                </div>
                <h3 style="color: #10b981; margin: 0 0 10px 0;">Verification Status: Approved</h3>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  You can now receive job requests from customers
                </p>
              </div>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>What's next?</strong>
              </p>
              <ul style="color: #4b5563; font-size: 15px; line-height: 1.8;">
                <li>Complete your profile with skills and experience</li>
                <li>Set your availability schedule</li>
                <li>Start receiving job requests from customers</li>
                <li>Build your reputation with great service</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/worker/dashboard" style="background: #10b981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Go to Dashboard
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
      console.log(`✅ Verification approved email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Verification approved email failed:', error.message);
      return false;
    }
  }

  async sendVerificationRejected(to: string, name: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Rozgaar360" <${process.env.EMAIL_USER}>`,
        to,
        subject: 'Verification Status Update - Rozgaar360',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">Verification Status Update</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Hello ${name},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Thank you for submitting your verification documents. After careful review, we were unable to approve your verification at this time.
              </p>
              <div style="background: white; border: 2px solid #ef4444; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                <div style="width: 60px; height: 60px; background: #ef4444; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 30px;">✕</span>
                </div>
                <h3 style="color: #ef4444; margin: 0 0 10px 0;">Verification Status: Not Approved</h3>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Please review and resubmit your documents
                </p>
              </div>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>Common reasons for rejection:</strong>
              </p>
              <ul style="color: #4b5563; font-size: 15px; line-height: 1.8;">
                <li>Unclear or blurry CNIC images</li>
                <li>Incomplete CNIC information visible</li>
                <li>Documents do not match profile information</li>
                <li>Expired or invalid CNIC</li>
              </ul>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                <strong>What to do next:</strong><br>
                Please upload clear, high-quality images of your CNIC (front and back) and ensure all information is clearly visible.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/worker/dashboard" style="background: #ef4444; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Resubmit Documents
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
      console.log(`✅ Verification rejected email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Verification rejected email failed:', error.message);
      return false;
    }
  }

  async sendBookingCreated(to: string, customerName: string, workerName: string, service: string, date: string, bookingId: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Rozgaar360" <${process.env.EMAIL_USER}>`,
        to,
        subject: '📦 New Booking Request - Rozgaar360',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">📦 New Booking Request</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Hello ${workerName}!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                You have received a new booking request from <strong>${customerName}</strong>.
              </p>
              <div style="background: white; border: 2px solid #3b82f6; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #3b82f6; margin: 0 0 15px 0;">Booking Details</h3>
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 14px;">${service}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Customer:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 14px;">${customerName}</td>
                  </tr>
                  <tr>
                    <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Date:</td>
                    <td style="padding: 8px 0; color: #1f2937; font-weight: bold; font-size: 14px;">${date}</td>
                  </tr>
                </table>
              </div>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Please review the booking details and respond to the customer as soon as possible.
              </p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/worker/bookings/${bookingId}" style="background: #3b82f6; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  View Booking
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
      console.log(`✅ Booking created email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Booking created email failed:', error.message);
      return false;
    }
  }

  async sendBookingConfirmed(to: string, customerName: string, service: string, bookingId: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Rozgaar360" <${process.env.EMAIL_USER}>`,
        to,
        subject: '✅ Booking Confirmed - Rozgaar360',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">✅ Booking Confirmed!</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Great news, ${customerName}!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your booking for <strong>${service}</strong> has been confirmed by the worker.
              </p>
              <div style="background: white; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                <div style="width: 60px; height: 60px; background: #10b981; border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                  <span style="color: white; font-size: 30px;">✓</span>
                </div>
                <h3 style="color: #10b981; margin: 0 0 10px 0;">Booking Confirmed</h3>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  The worker will arrive at the scheduled time
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/customer/bookings/${bookingId}" style="background: #10b981; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  View Booking
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
      console.log(`✅ Booking confirmed email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Booking confirmed email failed:', error.message);
      return false;
    }
  }

  async sendBookingCompleted(to: string, customerName: string, service: string, bookingId: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"Rozgaar360" <${process.env.EMAIL_USER}>`,
        to,
        subject: '🎉 Work Completed - Rozgaar360',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Work Completed!</h1>
            </div>
            <div style="padding: 40px; background: #f9fafb;">
              <h2 style="color: #1f2937;">Hello ${customerName}!</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                Your <strong>${service}</strong> booking has been marked as completed by the worker.
              </p>
              <div style="background: white; border: 2px solid #8b5cf6; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
                <h3 style="color: #8b5cf6; margin: 0 0 10px 0;">Please Leave a Review</h3>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">
                  Help other customers by sharing your experience
                </p>
              </div>
              <div style="text-align: center; margin: 30px 0;">
                <a href="http://localhost:3000/customer/reviews/new/${bookingId}" style="background: #8b5cf6; color: white; padding: 14px 35px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                  Leave a Review
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
      console.log(`✅ Booking completed email sent to ${to}`);
      return true;
    } catch (error) {
      console.error('❌ Booking completed email failed:', error.message);
      return false;
    }
  }
}
