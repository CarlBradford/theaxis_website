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

    this.transporter = nodemailer.createTransport({
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

  async sendArticleSubmissionNotification(email, firstName, articleTitle, authorFirstName, authorLastName) {
    if (!this.transporter) {
      logger.warn('Email service not available. Article submission notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `New Article Submitted for Review: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Article Submitted for Review</h2>
          <p>Hello ${firstName},</p>
          <p>A new article has been submitted for your review:</p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorFirstName} ${authorLastName}</p>
            <p><strong>Status:</strong> In Review</p>
          </div>
          <p>Please review the article and take appropriate action (approve, request revision, etc.).</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/review-queue" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Article submission notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send article submission notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  async sendEICApprovalNotification(email, firstName, articleTitle, authorFirstName, authorLastName) {
    if (!this.transporter) {
      logger.warn('Email service not available. EIC approval notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Approved by Section Head: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Approved for Final Review</h2>
          <p>Hello ${firstName},</p>
          <p>An article has been approved by a Section Head and is ready for your final review:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorFirstName} ${authorLastName}</p>
            <p><strong>Status:</strong> Approved (Ready for Publication)</p>
          </div>
          <p>Please review the article and decide whether to publish it or return it for further revision.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/review-queue" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('EIC approval notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send EIC approval notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  async sendSectionHeadReturnNotification(email, firstName, articleTitle, authorFirstName, authorLastName, feedback = null) {
    if (!this.transporter) {
      logger.warn('Email service not available. Section Head return notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Returned for Review: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Returned for Further Review</h2>
          <p>Hello ${firstName},</p>
          <p>An article has been returned by the Admin Assistant for further review:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorFirstName} ${authorLastName}</p>
            <p><strong>Status:</strong> Returned for Review</p>
            ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
          </div>
          <p>Please review the feedback and work with the author to address any concerns.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/review-queue" style="background-color: #ffc107; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Section Head return notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send Section Head return notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  async sendArticleUpdateNotification(email, firstName, articleTitle, authorFirstName, authorLastName, updaterFirstName, updaterLastName) {
    if (!this.transporter) {
      logger.warn('Email service not available. Article update notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Updated During Review: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Updated During Review</h2>
          <p>Hello ${firstName},</p>
          <p>An article that is currently under review has been updated:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorFirstName} ${authorLastName}</p>
            <p><strong>Updated By:</strong> ${updaterFirstName} ${updaterLastName}</p>
            <p><strong>Status:</strong> In Review</p>
          </div>
          <p>Please review the updated content and take appropriate action if needed.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/review-queue" style="background-color: #ffc107; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Updated Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Article update notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send article update notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  async sendNewCommentNotification(email, firstName, articleTitle, commenterFirstName, commenterLastName, commentContent) {
    if (!this.transporter) {
      logger.warn('Email service not available. New comment notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `New Comment on Your Article: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Comment on Your Article</h2>
          <p>Hello ${firstName},</p>
          <p>Someone has commented on your article:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Article:</strong> ${articleTitle}</p>
            <p><strong>Commenter:</strong> ${commenterFirstName} ${commenterLastName}</p>
            <p><strong>Comment:</strong></p>
            <div style="background-color: #ffffff; padding: 15px; border-left: 4px solid #007bff; margin: 10px 0;">
              <p style="margin: 0; font-style: italic;">"${commentContent}"</p>
            </div>
          </div>
          <p>You can view and respond to the comment on the article page.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/articles" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('New comment notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send new comment notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  async sendCommentStatusNotification(email, firstName, articleTitle, status, feedback = null) {
    if (!this.transporter) {
      logger.warn('Email service not available. Comment status notification not sent.');
      return false;
    }

    const statusMessages = {
      'APPROVED': 'Your comment has been approved and is now visible on the article.',
      'REJECTED': 'Your comment has been rejected and will not be displayed.',
      'PENDING': 'Your comment is pending approval and will be reviewed soon.',
    };

    const message = statusMessages[status] || 'Your comment status has been updated.';
    const feedbackSection = feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : '';

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Comment Status Update: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Comment Status Update</h2>
          <p>Hello ${firstName},</p>
          <p><strong>Article:</strong> ${articleTitle}</p>
          <p><strong>Status:</strong> ${status}</p>
          <p>${message}</p>
          ${feedbackSection}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/articles" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Comment status notification sent successfully', { email, articleTitle, status, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send comment status notification', { email, articleTitle, status, error: error.message });
      return false;
    }
  }

  async sendArticleStatusNotification(email, firstName, articleTitle, status, feedback = null) {
    if (!this.transporter) {
      logger.warn('Email service not available. Article notification not sent.');
      return false;
    }

    const statusMessages = {
      'IN_REVIEW': 'Your article is now under review by the editorial team.',
      'NEEDS_REVISION': 'Your article needs some revisions before it can be published.',
      'APPROVED': 'Congratulations! Your article has been approved for publication.',
      'PUBLISHED': 'Your article has been published and is now live on the platform.',
      'ARCHIVED': 'Your article has been archived.',
    };

    const message = statusMessages[status] || 'Your article status has been updated.';
    const feedbackSection = feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : '';

    // Choose colors based on status
    let backgroundColor, borderColor, buttonColor;
    switch (status) {
      case 'PUBLISHED':
      case 'APPROVED':
        backgroundColor = '#e8f5e8';
        borderColor = '#4caf50';
        buttonColor = '#4caf50';
        break;
      case 'NEEDS_REVISION':
        backgroundColor = '#ffebee';
        borderColor = '#f44336';
        buttonColor = '#f44336';
        break;
      case 'IN_REVIEW':
        backgroundColor = '#e3f2fd';
        borderColor = '#2196f3';
        buttonColor = '#2196f3';
        break;
      default:
        backgroundColor = '#f5f5f5';
        borderColor = '#9e9e9e';
        buttonColor = '#9e9e9e';
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Update: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Status Update</h2>
          <p>Hello ${firstName},</p>
          <p><strong>Article:</strong> ${articleTitle}</p>
          <div style="background-color: ${backgroundColor}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${borderColor};">
            <p><strong>Status:</strong> ${status}</p>
            <p>${message}</p>
            ${feedbackSection}
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/articles" style="background-color: ${buttonColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Articles</a>
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

  // New email template for EIC when Section Head approves article
  async sendEICArticleApprovedNotification(email, firstName, articleTitle, authorFirstName, authorLastName) {
    if (!this.transporter) {
      logger.warn('Email service not available. EIC approval notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Approved by Section Head: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Approved for Final Review</h2>
          <p>Hello ${firstName},</p>
          <p>An article has been approved by a Section Head and is ready for your final review:</p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorFirstName} ${authorLastName}</p>
            <p><strong>Status:</strong> Approved (Ready for Publication)</p>
          </div>
          <p>Please review the article and decide whether to publish it or return it for further revision.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/review-queue" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('EIC approval notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send EIC approval notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  // New email template for Section Head when EIC returns article
  async sendSectionHeadArticleReturnedNotification(email, firstName, articleTitle, authorFirstName, authorLastName, feedback = null) {
    if (!this.transporter) {
      logger.warn('Email service not available. Section Head return notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Returned for Review: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Returned for Further Review</h2>
          <p>Hello ${firstName},</p>
          <p>An article has been returned by the Admin Assistant for further review:</p>
          <div style="background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff9800;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorFirstName} ${authorLastName}</p>
            <p><strong>Status:</strong> Returned for Review</p>
            ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
          </div>
          <p>Please review the feedback and work with the author to address any concerns.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/review-queue" style="background-color: #ff9800; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Section Head return notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send Section Head return notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  // New email template for Section Head when staff submits article
  async sendSectionHeadStaffSubmissionNotification(email, firstName, articleTitle, authorFirstName, authorLastName) {
    if (!this.transporter) {
      logger.warn('Email service not available. Staff submission notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `New Article Submitted by Staff: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Article Submitted for Review</h2>
          <p>Hello ${firstName},</p>
          <p>A staff member has submitted an article for your review:</p>
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorFirstName} ${authorLastName}</p>
            <p><strong>Status:</strong> In Review</p>
          </div>
          <p>Please review the article and take appropriate action (approve, request revision, etc.).</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/review-queue" style="background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Staff submission notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send staff submission notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  // New email template for staff when Section Head returns article for revision
  async sendStaffRevisionRequestNotification(email, firstName, articleTitle, feedback = null) {
    if (!this.transporter) {
      logger.warn('Email service not available. Staff revision notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Needs Revision: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Needs Revision</h2>
          <p>Hello ${firstName},</p>
          <p>Your article has been reviewed and needs some revisions:</p>
          <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f44336;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Status:</strong> Needs Revision</p>
            ${feedback ? `<p><strong>Feedback:</strong> ${feedback}</p>` : ''}
          </div>
          <p>Please review the feedback and make the necessary changes before resubmitting.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/my-content" style="background-color: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Edit Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Staff revision notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send staff revision notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  // New email template for EIC when they publish their own article
  async sendEICOwnArticlePublishedNotification(email, firstName, articleTitle) {
    if (!this.transporter) {
      logger.warn('Email service not available. EIC own article notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Your Article Published: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Article Has Been Published!</h2>
          <p>Hello ${firstName},</p>
          <p>Congratulations! Your article has been published and is now live on the platform:</p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Status:</strong> Published</p>
            <p><strong>Published At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Your article is now available for readers to view and engage with.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/articles" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Published Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('EIC own article published notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send EIC own article published notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  // New email template for Section Head when their own article is published
  async sendSectionHeadOwnArticlePublishedNotification(email, firstName, articleTitle) {
    if (!this.transporter) {
      logger.warn('Email service not available. Section Head own article notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Your Article Published: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Your Article Has Been Published!</h2>
          <p>Hello ${firstName},</p>
          <p>Congratulations! Your article has been published and is now live on the platform:</p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Status:</strong> Published</p>
            <p><strong>Published At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Your article is now available for readers to view and engage with.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/articles" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Published Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Section Head own article published notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send Section Head own article published notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  // Published Content Email Templates

  /**
   * Send email to EIC when Section Head updates and publishes an article
   */
  async sendEICArticleUpdatedNotification(email, firstName, articleTitle, authorFirstName, authorLastName, updatedByName) {
    if (!this.transporter) {
      logger.warn('Email service not available. EIC article update notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Updated and Republished: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Updated and Republished</h2>
          <p>Hello ${firstName},</p>
          <p>An article has been updated and republished by a Section Head:</p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorFirstName} ${authorLastName}</p>
            <p><strong>Updated By:</strong> ${updatedByName}</p>
            <p><strong>Status:</strong> Published (Updated)</p>
          </div>
          <p>This article has been updated and is now live on the platform with the latest changes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/published-content" style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Published Content</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('EIC article update notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send EIC article update notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  /**
   * Send email to EIC when Section Head archives an article
   */
  async sendEICArticleArchivedNotification(email, firstName, articleTitle, authorFirstName, authorLastName, archivedByName) {
    if (!this.transporter) {
      logger.warn('Email service not available. EIC article archive notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Archived: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Archived</h2>
          <p>Hello ${firstName},</p>
          <p>An article has been archived by a Section Head:</p>
          <div style="background-color: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorFirstName} ${authorLastName}</p>
            <p><strong>Archived By:</strong> ${archivedByName}</p>
            <p><strong>Status:</strong> Archived</p>
          </div>
          <p>This article has been removed from the published content and is no longer visible to readers. You can restore it if needed.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/published-content?filter=archived" style="background-color: #ffc107; color: #212529; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Archived Content</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('EIC article archive notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send EIC article archive notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  /**
   * Send email to Section Heads when EIC restores an article
   */
  async sendSectionHeadArticleRestoredNotification(email, firstName, articleTitle, authorFirstName, authorLastName, restoredByName) {
    if (!this.transporter) {
      logger.warn('Email service not available. Section Head article restore notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Restored to Review: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Restored to Review Queue</h2>
          <p>Hello ${firstName},</p>
          <p>An article has been restored to the review queue by the Admin Assistant:</p>
          <div style="background-color: #d1ecf1; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #17a2b8;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorFirstName} ${authorLastName}</p>
            <p><strong>Restored By:</strong> ${restoredByName}</p>
            <p><strong>Status:</strong> In Review (Restored)</p>
          </div>
          <p>This article has been restored from the archived state and is now back in the review queue for further processing.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/review-queue" style="background-color: #17a2b8; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Review Article</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('Section Head article restore notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send Section Head article restore notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  /**
   * Send email to EIC when Section Head creates a new online issue (flipbook)
   */
  async sendEICFlipbookCreatedNotification(email, firstName, flipbookName, flipbookType, createdByName, creatorName) {
    if (!this.transporter) {
      logger.warn('Email service not available. EIC flipbook creation notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `New Online Issue Created: ${flipbookName} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">New Online Issue Created</h2>
          <p>Hello ${firstName},</p>
          <p>A new online issue has been created by a Section Head:</p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p><strong>Issue Name:</strong> ${flipbookName}</p>
            <p><strong>Type:</strong> ${flipbookType || 'Not specified'}</p>
            <p><strong>Created By:</strong> ${createdByName}</p>
            <p><strong>Original Creator:</strong> ${creatorName}</p>
            <p><strong>Status:</strong> New Issue</p>
          </div>
          <p>This new online issue is now available and ready for review.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/published-content?filter=online_issues" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Online Issues</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('EIC flipbook creation notification sent successfully', { email, flipbookName, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send EIC flipbook creation notification', { email, flipbookName, error: error.message });
      return false;
    }
  }

  /**
   * Send email to ADMINISTRATOR when any article is published
   */
  async sendAdministratorArticlePublishedNotification(email, firstName, articleTitle, authorName, authorRole, categories) {
    if (!this.transporter) {
      logger.warn('Email service not available. ADMINISTRATOR publish notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Published: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Published</h2>
          <p>Hello ${firstName},</p>
          <p>A new article has been published on The AXIS website:</p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorName} (${authorRole})</p>
            <p><strong>Categories:</strong> ${categories}</p>
            <p><strong>Status:</strong> Published</p>
            <p><strong>Published At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>This article is now live on the platform and available to readers.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/published-content" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Published Content</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info('ADMINISTRATOR publish notification email sent', {
        to: email,
        articleTitle,
        authorName,
        authorRole,
        messageId: info.messageId
      });
      return true;
    } catch (error) {
      logger.error('Failed to send ADMINISTRATOR publish notification email', {
        to: email,
        articleTitle,
        authorName,
        authorRole,
        error: error.message
      });
      return false;
    }
  }

  /**
   * Send email to EIC when Section Head publishes their own article
   */
  async sendEICSectionHeadPublishedNotification(email, firstName, articleTitle, authorName) {
    if (!this.transporter) {
      logger.warn('Email service not available. EIC Section Head publish notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Article Published by Section Head: ${articleTitle} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Article Published by Section Head</h2>
          <p>Hello ${firstName},</p>
          <p>A Section Head has published their own article:</p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <p><strong>Article Title:</strong> ${articleTitle}</p>
            <p><strong>Author:</strong> ${authorName} (Section Head)</p>
            <p><strong>Status:</strong> Published</p>
            <p><strong>Published At:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>This article has been published directly by a Section Head and is now live on the platform.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/published-content" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Published Content</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('EIC Section Head publish notification sent successfully', { email, articleTitle, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send EIC Section Head publish notification', { email, articleTitle, error: error.message });
      return false;
    }
  }

  /**
   * Send email to EIC when Section Head updates an online issue (flipbook)
   */
  async sendEICFlipbookUpdatedNotification(email, firstName, flipbookName, flipbookType, updatedByName, creatorName) {
    if (!this.transporter) {
      logger.warn('Email service not available. EIC flipbook update notification not sent.');
      return false;
    }

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Online Issue Updated: ${flipbookName} - The AXIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Online Issue Updated</h2>
          <p>Hello ${firstName},</p>
          <p>An online issue has been updated by a Section Head:</p>
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3;">
            <p><strong>Issue Name:</strong> ${flipbookName}</p>
            <p><strong>Type:</strong> ${flipbookType || 'Not specified'}</p>
            <p><strong>Updated By:</strong> ${updatedByName}</p>
            <p><strong>Original Creator:</strong> ${creatorName}</p>
            <p><strong>Status:</strong> Updated</p>
          </div>
          <p>This online issue has been updated and is now available with the latest changes.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/published-content?filter=online_issues" style="background-color: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">View Online Issues</a>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #666; font-size: 12px;">The AXIS - Student Publication Platform</p>
        </div>
      `,
    };

    try {
      const result = await this.transporter.sendMail(mailOptions);
      logger.info('EIC flipbook update notification sent successfully', { email, flipbookName, messageId: result.messageId });
      return true;
    } catch (error) {
      logger.error('Failed to send EIC flipbook update notification', { email, flipbookName, error: error.message });
      return false;
    }
  }
}

module.exports = new EmailService();
