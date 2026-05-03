// Test Email Service
// Run with: node test-email.js

require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('🧪 Testing Email Service...\n');
  
  // Check environment variables
  console.log('📋 Configuration:');
  console.log(`EMAIL_USER: ${process.env.EMAIL_USER || '❌ NOT SET'}`);
  console.log(`EMAIL_PASSWORD: ${process.env.EMAIL_PASSWORD ? '✅ SET' : '❌ NOT SET'}\n`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email credentials not configured!');
    console.log('\n💡 Add these to backend/.env:');
    console.log('EMAIL_USER=your-email@gmail.com');
    console.log('EMAIL_PASSWORD=your-app-password');
    process.exit(1);
  }
  
  // Create transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  
  // Test connection
  console.log('🔌 Testing SMTP connection...');
  try {
    await transporter.verify();
    console.log('✅ SMTP connection successful!\n');
  } catch (error) {
    console.error('❌ SMTP connection failed:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('1. Wrong EMAIL_PASSWORD (use App Password, not regular password)');
    console.log('2. Gmail 2FA not enabled');
    console.log('3. App Password not generated');
    process.exit(1);
  }
  
  // Send test email
  console.log('📧 Sending test email...');
  const testEmail = process.env.EMAIL_USER; // Send to self
  
  try {
    const info = await transporter.sendMail({
      from: `"Rozgaar360 Test" <${process.env.EMAIL_USER}>`,
      to: testEmail,
      subject: '✅ Email Service Test - Rozgaar360',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">✅ Email Service Working!</h1>
          </div>
          <div style="padding: 40px; background: #f9fafb;">
            <h2 style="color: #1f2937;">Test Successful</h2>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Your email service is configured correctly and working!
            </p>
            <div style="background: white; border: 2px solid #10b981; border-radius: 12px; padding: 25px; margin: 30px 0; text-align: center;">
              <h3 style="color: #10b981; margin: 0;">Configuration Verified</h3>
              <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">
                Email: ${process.env.EMAIL_USER}
              </p>
            </div>
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Worker verification emails will now be sent automatically when admin approves or rejects verification.
            </p>
          </div>
          <div style="background: #1f2937; padding: 20px; text-align: center;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} Rozgaar360. All rights reserved.
            </p>
          </div>
        </div>
      `,
    });
    
    console.log('✅ Test email sent successfully!');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`📧 Sent to: ${testEmail}\n`);
    console.log('🎉 Email service is working correctly!');
    console.log('\n💡 Next steps:');
    console.log('1. Check your inbox for the test email');
    console.log('2. If not in inbox, check spam/junk folder');
    console.log('3. Restart your backend server');
    console.log('4. Test worker verification approval/rejection');
    
  } catch (error) {
    console.error('❌ Failed to send test email:', error.message);
    console.log('\n💡 Possible issues:');
    console.log('1. Gmail blocked the email (check security settings)');
    console.log('2. Daily sending limit reached (500 emails/day)');
    console.log('3. Network connection issue');
  }
}

testEmail();
