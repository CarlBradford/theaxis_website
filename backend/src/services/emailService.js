const nodemailer = require('nodemailer');
const { logger } = require('../utils/logger');
const config = require('../config');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  initializeTransporter() {
    if (!config.email.smtp.host || !config.email.smtp.user || !config.email.smtp.pass) {
      logger.warn('Email configuration incomplete. Email service will not be available.');
      return;
    }

    this.transporter = nodemailer.createTransporter({
      host: config.email.smtp.host,
      port: config.email.smtp.port,
      secure: config.email.smtp.port === 465, // true for 465, false for other ports
      auth: {
        user: config.email.smtp.user,
        pass: config.email.smtp.pass,
      },
    });

    // Verify connection configuration
    this.transporter.verify((error, success) => {
      if (error) {
        logger.error('Email service verification failed:', error);
      } else {
        logger.info('Email service is ready to send messages');
      }
    });
  }

  async sendPasswordResetEmail(email, resetToken, firstName) {
    if (!this.transporter) {
      logger.warn('Email service not available. Password reset email not sent.');
      return false;
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Password Reset - The AXIS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello ${firstName},</p>
          <p>You have requested to reset your password for The AXIS platform.</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${resetUrl}</p>
          <p><strong>This link will expire in 1 hour.</strong></p>
          <p>If you didn't request this password reset, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent successfully', { email, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send password reset email', { email, error: error.message });
      return false;
    }
  }

  async sendEmailVerification(email, verificationToken, firstName) {
    if (!this.transporter) {
      logger.warn('Email service not available. Verification email not sent.');
      return false;
    }

    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Email Verification - The AXIS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to The AXIS!</h2>
          <p>Hello ${firstName},</p>
          <p>Thank you for registering with The AXIS platform. Please verify your email address to complete your registration.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Verify Email</a>
          </div>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">${verificationUrl}</p>
          <p>If you didn't create an account, please ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Email verification sent successfully', { email, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send email verification', { email, error: error.message });
      return false;
    }
  }

  async sendWelcomeEmail(email, firstName, role) {
    if (!this.transporter) {
      logger.warn('Email service not available. Welcome email not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: 'Welcome to The AXIS Platform',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Welcome to The AXIS!</h2>
          <p>Hello ${firstName},</p>
          <p>Welcome to The AXIS student publication platform! Your account has been created successfully.</p>
          <p><strong>Your Role:</strong> ${role}</p>
          <p>You can now access the platform and start contributing to our publication.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Access Platform</a>
          </div>
          <p>If you have any questions, please contact the editorial team.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Welcome email sent successfully', { email, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send welcome email', { email, error: error.message });
      return false;
    }
  }

  async sendArticleStatusNotification(email, firstName, articleTitle, status) {
    if (!this.transporter) {
      logger.warn('Email service not available. Article notification not sent.');
      return false;
    }

    const statusMessages = {
      'IN_REVIEW': 'Your article is now under review by the editorial team.',
      'NEEDS_REVISION': 'Your article needs some revisions before it can be published.',
      'APPROVED': 'Congratulations! Your article has been approved for publication.',
      'PUBLISHED': 'Your article has been published and is now live on the platform.',
    };

    const message = statusMessages[status] || 'Your article status has been updated.';

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Update: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Status Update</h2>
          <p>Hello ${firstName},</p>
          <p><strong>Article:</strong> ${articleTitle}</p>
          <p><strong>Status:</strong> ${status}</p>
          <p>${message}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/articles" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Articles</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Article status notification sent successfully', { email, articleTitle, status, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send article status notification', { email, articleTitle, status, error: error.message });
      return false;
    }
  }
}

module.exports = new EmailService();
