import nodemailer from 'nodemailer';

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Test email configuration on startup
export const testEmailConnection = async () => {
  try {
    await transporter.verify();
    console.log('✉️  Email service ready');
    return true;
  } catch (error) {
    console.error('❌ Email service error:', error);
    return false;
  }
};

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: SendEmailOptions): Promise<boolean> => {
  try {
    const mailOptions = {
      from: process.env.SMTP_FROM || '"Void Vendor" <noreply@voidvendor.com>',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text || options.html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✉️  Email sent:', info.messageId);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    return false;
  }
};

export const sendPasswordResetEmail = async (email: string, resetToken: string, userName: string) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'https://www.voidvendor.com'}/reset-password?token=${resetToken}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          font-family: 'Courier New', monospace;
          background: #0a0a0a;
          color: #00ffff;
          padding: 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #1a1a1a;
          border: 2px solid #00ffff;
          padding: 30px;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }
        .header {
          text-align: center;
          font-size: 28px;
          font-weight: bold;
          background: linear-gradient(to right, #00ffff, #a855f7, #ec4899);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 20px;
        }
        .button {
          display: inline-block;
          padding: 15px 30px;
          background: linear-gradient(to right, #00ffff, #a855f7);
          color: white;
          text-decoration: none;
          font-weight: bold;
          border-radius: 5px;
          margin: 20px 0;
        }
        .footer {
          margin-top: 30px;
          font-size: 12px;
          color: #666;
          text-align: center;
        }
        .warning {
          color: #ec4899;
          margin-top: 15px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">VOID VENDOR</div>
        <p>Hello ${userName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="text-align: center;">
          <a href="${resetUrl}" class="button">RESET PASSWORD</a>
        </p>
        <p>Or copy and paste this link into your browser:</p>
        <p style="word-break: break-all; color: #00ffff;">${resetUrl}</p>
        <p class="warning">⚠️ This link will expire in 1 hour.</p>
        <p>If you didn't request a password reset, you can safely ignore this email. Your password will not be changed.</p>
        <div class="footer">
          <p>虚空販売 ・ ボイドベンダー</p>
          <p>VOID VENDOR™ - Transmissions from the Digital Abyss</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: '🔐 Void Vendor - Password Reset Request',
    html,
  });
};
