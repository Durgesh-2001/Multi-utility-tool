import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Creates a test account with Ethereal for development
const createTestAccount = async () => {
  try {
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
      },
    });
  } catch (error) {
    console.error('Failed to create Ethereal test account:', error);
    return null;
  }
};

// Creates a transporter for a real email service like Gmail for production
const createGmailTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Use an "App Password" for Gmail
    },
  });
};

export const sendPasswordResetEmail = async (email, resetToken, resetUrl) => {
  try {
    let transporter;

    if (process.env.NODE_ENV === 'production' && process.env.EMAIL_USER) {
      transporter = createGmailTransporter();
    } else {
      transporter = await createTestAccount();
    }

    if (!transporter) {
      throw new Error('Failed to create email transporter');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || '"Multi-Tool.io" <noreply@multitool.io>',
      to: email,
      subject: 'Password Reset Request - Multi-Tool.io',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>You requested a password reset for your Multi-Tool.io account.</p>
          <p>Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #ec5b00; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">
            Multi-Tool.io - Smarter Tools. Simpler Life.
          </p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    let previewUrl = null;

    // In development, get the Ethereal preview URL
    if (process.env.NODE_ENV !== 'production' && nodemailer.getTestMessageUrl) {
      previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('Ethereal email preview URL:', previewUrl);
    }
    
    // --- MODIFICATION ---
    // Return an object that includes the previewUrl
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: previewUrl, // This will be the URL in dev, and null in prod
    };

  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send password reset email');
  }
};

export const generateResetToken = () => {
  return crypto.randomBytes(32).toString('hex');
};