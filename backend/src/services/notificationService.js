const { PrismaClient } = require('@prisma/client');
const emailService = require('./emailService');
const { logger } = require('../utils/logger');

const prisma = new PrismaClient();

// Import real-time notification functions
let realtimeNotifications = null;

// Initialize real-time notifications (will be set by the main app)
const setRealtimeNotifications = (realtimeModule) => {
  realtimeNotifications = realtimeModule;
};

class NotificationService {
  constructor() {
    this.emailService = emailService;
  }

  // Helper method to send real-time notification
  async sendRealtimeNotification(userId, notification) {
    if (realtimeNotifications) {
      try {
        realtimeNotifications.sendNotificationToUser(userId, notification);
        logger.info(`Real-time notification sent to user ${userId}: ${notification.title}`);
      } catch (error) {
        logger.error(`Failed to send real-time notification to user ${userId}:`, error);
      }
    }
  }

  // Helper method to broadcast real-time notification to multiple users
  async broadcastRealtimeNotification(userIds, notification) {
    if (realtimeNotifications) {
      try {
        realtimeNotifications.broadcastNotification(userIds, notification);
        logger.info(`Real-time notification broadcasted to ${userIds.length} users: ${notification.title}`);
      } catch (error) {
        logger.error(`Failed to broadcast real-time notification:`, error);
      }
    }
  }

  // Send notification to Section Head when article is submitted for review
  async notifySectionHeadArticleSubmitted(articleId, authorInfo) {
    try {
      // Find Section Head users
      const sectionHeads = await prisma.user.findMany({
        where: {
          role: 'SECTION_HEAD'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });

      if (sectionHeads.length === 0) {
        logger.warn('No Section Head found to notify about article submission');
        return;
      }

      // Get article details
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!article) {
        logger.error('Article not found for notification:', articleId);
        return;
      }

      // Send email notifications to all Section Heads
      for (const sectionHead of sectionHeads) {
        await this.emailService.sendSectionHeadStaffSubmissionNotification(
          sectionHead.email,
          sectionHead.firstName,
          article.title,
          article.author.firstName,
          article.author.lastName
        );
      }

      // Create in-app notifications for all Section Heads
      const notificationData = {
        title: 'New Article Submitted for Review',
        message: `${article.author.firstName} ${article.author.lastName} has submitted "${article.title}" for your review.`,
        type: 'ARTICLE_SUBMITTED',
        data: {
          articleId: article.id,
          articleTitle: article.title,
          authorName: `${article.author.firstName} ${article.author.lastName}`,
          authorId: article.author.id
        }
      };

      // Create notifications for each section head
      const notifications = sectionHeads.map(sectionHead => ({
        ...notificationData,
        userId: sectionHead.id
      }));

      await prisma.notification.createMany({
        data: notifications
      });

      // Send real-time notifications to connected Section Heads
      const sectionHeadIds = sectionHeads.map(sh => sh.id);
      await this.broadcastRealtimeNotification(sectionHeadIds, notificationData);

      logger.info('Section Head notification sent for article submission', {
        articleId,
        articleTitle: article.title,
        sectionHeadCount: sectionHeads.length,
        emailNotifications: sectionHeads.length,
        inAppNotifications: notifications.length,
        realtimeNotifications: sectionHeadIds.length
      });

    } catch (error) {
      logger.error('Failed to send Section Head notification for article submission', {
        articleId,
        error: error.message
      });
    }
  }

  // Send notification to author when article status changes
  async notifyAuthorStatusChange(articleId, oldStatus, newStatus, feedback = null) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!article) {
        logger.error('Article not found for status change notification:', articleId);
        return;
      }

      // Create in-app notification immediately (fast operation)
      const notificationType = this.getNotificationTypeForStatus(newStatus);
      const notificationTitle = this.getNotificationTitleForStatus(newStatus);
      const notificationMessage = this.getNotificationMessageForStatus(newStatus, article.title, feedback);

      await prisma.notification.create({
        data: {
          title: notificationTitle,
          message: notificationMessage,
          type: notificationType,
          userId: article.author.id,
          data: {
            articleId: article.id,
            articleTitle: article.title,
            oldStatus,
            newStatus,
            feedback
          }
        }
      });

      // Send real-time notification to the author
      const realtimeNotification = {
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        data: {
          articleId: article.id,
          articleTitle: article.title,
          oldStatus,
          newStatus,
          feedback
        }
      };
      await this.sendRealtimeNotification(article.author.id, realtimeNotification);

      // Send email notification in background (non-blocking)
      this.emailService.sendArticleStatusNotification(
        article.author.email,
        article.author.firstName,
        article.title,
        newStatus,
        feedback
      ).then(() => {
        logger.info('Email notification sent for status change', {
          articleId,
          articleTitle: article.title,
          authorEmail: article.author.email
        });
      }).catch(error => {
        logger.error('Failed to send email notification for status change', {
          articleId,
          authorEmail: article.author.email,
          error: error.message
        });
      });

      logger.info('Author notification initiated for status change', {
        articleId,
        articleTitle: article.title,
        oldStatus,
        newStatus,
        authorEmail: article.author.email,
        inAppNotification: true
      });

    } catch (error) {
      logger.error('Failed to send author notification for status change', {
        articleId,
        oldStatus,
        newStatus,
        error: error.message
      });
    }
  }

  // Helper method to get notification type for status
  getNotificationTypeForStatus(status) {
    switch (status) {
      case 'NEEDS_REVISION':
        return 'ARTICLE_REJECTED';
      case 'APPROVED':
        return 'ARTICLE_APPROVED';
      case 'PUBLISHED':
        return 'ARTICLE_PUBLISHED';
      case 'IN_REVIEW':
        return 'ARTICLE_SUBMITTED';
      default:
        return 'INFO';
    }
  }

  // Helper method to get notification title for status
  getNotificationTitleForStatus(status) {
    switch (status) {
      case 'NEEDS_REVISION':
        return 'Article Needs Revision';
      case 'APPROVED':
        return 'Article Approved';
      case 'PUBLISHED':
        return 'Article Published';
      case 'IN_REVIEW':
        return 'Article Under Review';
      default:
        return 'Article Status Updated';
    }
  }

  // Helper method to get notification message for status
  getNotificationMessageForStatus(status, articleTitle, feedback) {
    switch (status) {
      case 'NEEDS_REVISION':
        return `Your article "${articleTitle}" needs revision. ${feedback ? `Feedback: ${feedback}` : 'Please check the feedback section for details.'}`;
      case 'APPROVED':
        return `Your article "${articleTitle}" has been approved and forwarded to the Editor-in-Chief for final review.`;
      case 'PUBLISHED':
        return `Congratulations! Your article "${articleTitle}" has been published and is now live.`;
      case 'IN_REVIEW':
        return `Your article "${articleTitle}" is now under review by the editorial team.`;
      default:
        return `The status of your article "${articleTitle}" has been updated to ${status}.`;
    }
  }

  // Send notification to EIC when article is approved by Section Head
  async notifyEICArticleApproved(articleId) {
    try {
      // Find EIC users
      const eics = await prisma.user.findMany({
        where: {
          role: 'EDITOR_IN_CHIEF'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });

      if (eics.length === 0) {
        logger.warn('No Editor-in-Chief found to notify about article approval');
        return;
      }

      // Get article details
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          author: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!article) {
        logger.error('Article not found for EIC notification:', articleId);
        return;
      }

      // Create in-app notifications for all EICs
      const notificationPromises = eics.map(eic => 
        prisma.notification.create({
          data: {
            userId: eic.id,
            title: 'Article Approved by Section Head',
            message: `Article "${article.title}" by ${article.author.firstName} ${article.author.lastName} has been approved by Section Head and requires your final review.`,
            type: 'ARTICLE_APPROVED',
            data: {
              articleId: article.id,
              articleTitle: article.title,
              authorName: `${article.author.firstName} ${article.author.lastName}`
            }
          }
        })
      );

      // Execute all notification creations in parallel
      await Promise.all(notificationPromises);

      // Send email notifications to all EICs (non-blocking)
      for (const eic of eics) {
        this.emailService.sendEICArticleApprovedNotification(
          eic.email,
          eic.firstName,
          article.title,
          article.author.firstName,
          article.author.lastName
        ).catch(error => {
          logger.error('Failed to send EIC email notification:', error);
        });
      }

      logger.info('EIC notification sent for article approval', {
        articleId,
        articleTitle: article.title,
        eicCount: eics.length
      });

    } catch (error) {
      logger.error('Failed to send EIC notification for article approval', {
        articleId,
        error: error.message
      });
    }
  }

  // Send notification to Section Head when article is returned by EIC
  async notifySectionHeadArticleReturned(articleId, feedback = null) {
    try {
      // Find Section Head users
      const sectionHeads = await prisma.user.findMany({
        where: {
          role: 'SECTION_HEAD'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });

      if (sectionHeads.length === 0) {
        logger.warn('No Section Head found to notify about article return');
        return;
      }

      // Get article details
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          author: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!article) {
        logger.error('Article not found for Section Head return notification:', articleId);
        return;
      }

      // Create in-app notifications for all Section Heads
      const notificationPromises = sectionHeads.map(sectionHead => 
        prisma.notification.create({
          data: {
            userId: sectionHead.id,
            title: 'Article Returned by Editor-in-Chief',
            message: `Article "${article.title}" by ${article.author.firstName} ${article.author.lastName} has been returned by Editor-in-Chief for further review.${feedback ? ` Feedback: ${feedback}` : ''}`,
            type: 'WARNING',
            data: {
              articleId: article.id,
              articleTitle: article.title,
              authorName: `${article.author.firstName} ${article.author.lastName}`,
              feedback: feedback
            }
          }
        })
      );

      // Execute all notification creations in parallel
      await Promise.all(notificationPromises);

      // Send email notifications to all Section Heads (non-blocking)
      for (const sectionHead of sectionHeads) {
        this.emailService.sendSectionHeadArticleReturnedNotification(
          sectionHead.email,
          sectionHead.firstName,
          article.title,
          article.author.firstName,
          article.author.lastName,
          feedback
        ).catch(error => {
          logger.error('Failed to send Section Head email notification:', error);
        });
      }

      logger.info('Section Head notification sent for article return', {
        articleId,
        articleTitle: article.title,
        sectionHeadCount: sectionHeads.length
      });

    } catch (error) {
      logger.error('Failed to send Section Head notification for article return', {
        articleId,
        error: error.message
      });
    }
  }

  // Send notification to reviewers when article is updated during review
  async notifyReviewersArticleUpdated(articleId, updaterInfo) {
    try {
      // Get article details
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          status: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!article) {
        logger.error('Article not found for update notification:', articleId);
        return;
      }

      // Only notify if article is in review
      if (article.status !== 'IN_REVIEW') {
        return;
      }

      // Find Section Head users to notify
      const sectionHeads = await prisma.user.findMany({
        where: {
          role: 'SECTION_HEAD'
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true
        }
      });

      // Create in-app notifications for all Section Heads
      const notificationPromises = sectionHeads.map(sectionHead => 
        prisma.notification.create({
          data: {
            userId: sectionHead.id,
            title: 'Article Updated',
            message: `Article "${article.title}" by ${article.author.firstName} ${article.author.lastName} has been updated by ${updaterInfo.firstName} ${updaterInfo.lastName}.`,
            type: 'INFO',
            data: {
              articleId: article.id,
              articleTitle: article.title,
              authorName: `${article.author.firstName} ${article.author.lastName}`,
              updaterName: `${updaterInfo.firstName} ${updaterInfo.lastName}`
            }
          }
        })
      );

      // Execute all notification creations in parallel
      await Promise.all(notificationPromises);

      // Send email notifications to Section Heads (non-blocking)
      for (const sectionHead of sectionHeads) {
        this.emailService.sendArticleUpdateNotification(
          sectionHead.email,
          sectionHead.firstName,
          article.title,
          article.author.firstName,
          article.author.lastName,
          updaterInfo.firstName,
          updaterInfo.lastName
        ).catch(error => {
          logger.error('Failed to send Section Head email notification for article update:', error);
        });
      }

      logger.info('Reviewer notification sent for article update', {
        articleId,
        articleTitle: article.title,
        sectionHeadCount: sectionHeads.length,
        updater: `${updaterInfo.firstName} ${updaterInfo.lastName}`
      });

    } catch (error) {
      logger.error('Failed to send reviewer notification for article update', {
        articleId,
        error: error.message
      });
    }
  }

  // Send notification to article author when new comment is posted
  async notifyArticleAuthorNewComment(articleId, commentId) {
    try {
      // Get article and comment details
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          content: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
              username: true
            }
          }
        }
      });

      if (!article || !comment) {
        logger.error('Article or comment not found for comment notification:', { articleId, commentId });
        return;
      }

      // Create in-app notification for article author
      await prisma.notification.create({
        data: {
          userId: article.author.id,
          title: 'New Comment on Your Article',
          message: `${comment.author.firstName} ${comment.author.lastName} commented on your article "${article.title}".`,
          type: 'INFO',
          data: {
            articleId: article.id,
            articleTitle: article.title,
            commentId: comment.id,
            commentAuthor: `${comment.author.firstName} ${comment.author.lastName}`,
            commentContent: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : '')
          }
        }
      });

      // Send email notification to article author (non-blocking)
      this.emailService.sendNewCommentNotification(
        article.author.email,
        article.author.firstName,
        article.title,
        comment.author.firstName,
        comment.author.lastName,
        comment.content
      ).catch(error => {
        logger.error('Failed to send article author email notification for new comment:', error);
      });

      logger.info('Article author notification sent for new comment', {
        articleId,
        articleTitle: article.title,
        commentId,
        authorEmail: article.author.email
      });

    } catch (error) {
      logger.error('Failed to send article author notification for new comment', {
        articleId,
        commentId,
        error: error.message
      });
    }
  }

  // Send notification to comment author when comment status changes
  async notifyCommentAuthorStatusChange(commentId, status, feedback = null) {
    try {
      const comment = await prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          id: true,
          content: true,
          author: {
            select: {
              firstName: true,
              lastName: true,
              email: true
            }
          },
          article: {
            select: {
              id: true,
              title: true
            }
          }
        }
      });

      if (!comment) {
        logger.error('Comment not found for status change notification:', commentId);
        return;
      }

      // Create in-app notification for comment author
      await prisma.notification.create({
        data: {
          userId: comment.author.id,
          title: `Comment ${status === 'APPROVED' ? 'Approved' : status === 'REJECTED' ? 'Rejected' : 'Status Changed'}`,
          message: `Your comment on article "${comment.article.title}" has been ${status.toLowerCase()}.${feedback ? ` Feedback: ${feedback}` : ''}`,
          type: status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'ERROR' : 'INFO',
          data: {
            articleId: comment.article.id,
            articleTitle: comment.article.title,
            commentId: comment.id,
            commentContent: comment.content.substring(0, 100) + (comment.content.length > 100 ? '...' : ''),
            status: status,
            feedback: feedback
          }
        }
      });

      // Send email notification to comment author (non-blocking)
      this.emailService.sendCommentStatusNotification(
        comment.author.email,
        comment.author.firstName,
        comment.article.title,
        status,
        feedback
      ).catch(error => {
        logger.error('Failed to send comment author email notification for status change:', error);
      });

      logger.info('Comment author notification sent for status change', {
        commentId,
        articleTitle: comment.article.title,
        status,
        authorEmail: comment.author.email
      });

    } catch (error) {
      logger.error('Failed to send comment author notification for status change', {
        commentId,
        status,
        error: error.message
      });
    }
  }

  // NEW COMPREHENSIVE NOTIFICATION METHODS

  // Notify staff when Section Head returns their article for revision
  async notifyStaffArticleReturnedForRevision(articleId, feedback = null) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!article) {
        logger.error('Article not found for staff revision notification:', articleId);
        return;
      }

      // Create in-app notification immediately (fast operation)
      await prisma.notification.create({
        data: {
          title: 'Article Needs Revision',
          message: `Your article "${article.title}" needs revision. ${feedback ? `Feedback: ${feedback}` : 'Please check the feedback section for details.'}`,
          type: 'ARTICLE_REJECTED',
          userId: article.author.id,
          data: {
            articleId: article.id,
            articleTitle: article.title,
            feedback,
            status: 'NEEDS_REVISION'
          }
        }
      });

      // Send email notification in background (non-blocking)
      this.emailService.sendStaffRevisionRequestNotification(
        article.author.email,
        article.author.firstName,
        article.title,
        feedback
      ).then(() => {
        logger.info('Staff revision email sent', {
        articleId,
        articleTitle: article.title,
        authorEmail: article.author.email
        });
      }).catch(error => {
        logger.error('Failed to send staff revision email', {
          articleId,
          authorEmail: article.author.email,
          error: error.message
        });
      });

      logger.info('Staff revision notification initiated', {
        articleId,
        articleTitle: article.title,
        authorEmail: article.author.email,
        inAppNotification: true
      });

    } catch (error) {
      logger.error('Failed to send staff revision notification', {
        articleId,
        error: error.message
      });
    }
  }

  // Notify EIC when they publish their own article
  async notifyEICOwnArticlePublished(articleId) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!article) {
        logger.error('Article not found for EIC own article notification:', articleId);
        return;
      }

      // Create in-app notification for EIC author
      await prisma.notification.create({
        data: {
          userId: article.author.id,
          title: 'Your Article Published',
          message: `Congratulations! Your article "${article.title}" has been published and is now live.`,
          type: 'SUCCESS',
          data: {
            articleId: article.id,
            articleTitle: article.title,
            authorName: `${article.author.firstName} ${article.author.lastName}`
          }
        }
      });

      // Send email notification to EIC author (non-blocking)
      this.emailService.sendEICOwnArticlePublishedNotification(
        article.author.email,
        article.author.firstName,
        article.title
      ).catch(error => {
        logger.error('Failed to send EIC own article published email notification:', error);
      });

      logger.info('EIC own article published notification sent', {
        articleId,
        articleTitle: article.title,
        authorEmail: article.author.email
      });

    } catch (error) {
      logger.error('Failed to send EIC own article published notification', {
        articleId,
        error: error.message
      });
    }
  }

  // Notify Section Head when their own article is published
  async notifySectionHeadOwnArticlePublished(articleId) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!article) {
        logger.error('Article not found for Section Head own article notification:', articleId);
        return;
      }

      // Create in-app notification for Section Head author
      await prisma.notification.create({
        data: {
          userId: article.author.id,
          title: 'Your Article Published',
          message: `Congratulations! Your article "${article.title}" has been published and is now live.`,
          type: 'SUCCESS',
          data: {
            articleId: article.id,
            articleTitle: article.title,
            authorName: `${article.author.firstName} ${article.author.lastName}`
          }
        }
      });

      // Send email notification to Section Head author (non-blocking)
      this.emailService.sendSectionHeadOwnArticlePublishedNotification(
        article.author.email,
        article.author.firstName,
        article.title
      ).catch(error => {
        logger.error('Failed to send Section Head own article published email notification:', error);
      });

      logger.info('Section Head own article published notification sent', {
        articleId,
        articleTitle: article.title,
        authorEmail: article.author.email
      });

    } catch (error) {
      logger.error('Failed to send Section Head own article published notification', {
        articleId,
        error: error.message
      });
    }
  }

  // Comprehensive notification method for role-based status changes
  async notifyRoleBasedStatusChange(articleId, oldStatus, newStatus, feedback = null, actorRole = null) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        select: {
          id: true,
          title: true,
          status: true,
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true
            }
          }
        }
      });

      if (!article) {
        logger.error('Article not found for role-based notification:', articleId);
        return;
      }

      const authorRole = article.author.role;

      // Create in-app notification immediately (fast operation)
      const notificationPromises = [];

      // EIC notifications
      if (newStatus === 'APPROVED' && oldStatus === 'IN_REVIEW' && actorRole === 'SECTION_HEAD') {
        // Section Head approved article - notify EIC
        notificationPromises.push(this.notifyEICArticleApproved(articleId));
      }

      // Section Head notifications
      if (newStatus === 'IN_REVIEW' && oldStatus === 'APPROVED' && actorRole === 'EDITOR_IN_CHIEF') {
        // EIC returned article to Section Head
        notificationPromises.push(this.notifySectionHeadArticleReturned(articleId, feedback));
      }

      if (newStatus === 'IN_REVIEW' && oldStatus === 'DRAFT' && authorRole === 'STAFF') {
        // Staff submitted article - notify Section Head
        notificationPromises.push(this.notifySectionHeadArticleSubmitted(articleId, article.author));
      }

      // Staff notifications
      if (newStatus === 'NEEDS_REVISION' && oldStatus === 'IN_REVIEW' && actorRole === 'SECTION_HEAD') {
        // Section Head returned article for revision - notify staff
        notificationPromises.push(this.notifyStaffArticleReturnedForRevision(articleId, feedback));
      }

      // Own article published notifications
      if (newStatus === 'PUBLISHED') {
        if (authorRole === 'EDITOR_IN_CHIEF') {
          notificationPromises.push(this.notifyEICOwnArticlePublished(articleId));
        } else if (authorRole === 'SECTION_HEAD') {
          notificationPromises.push(this.notifySectionHeadOwnArticlePublished(articleId));
          // Also notify EIC when Section Head publishes their own article
          notificationPromises.push(this.notifyEICSectionHeadPublishedArticle(articleId));
        }
        
        // Notify ADMINISTRATOR when any article is published
        notificationPromises.push(this.notifyAdviserArticlePublished(articleId));
      }

      // General author status change notifications
      if (newStatus !== oldStatus) {
        notificationPromises.push(this.notifyAuthorStatusChange(articleId, oldStatus, newStatus, feedback));
      }

      // Execute all notifications in parallel for better performance
      if (notificationPromises.length > 0) {
        // Don't await - let notifications run in background
        Promise.allSettled(notificationPromises).then(results => {
          const successful = results.filter(r => r.status === 'fulfilled').length;
          const failed = results.filter(r => r.status === 'rejected').length;
          
          logger.info('Role-based notifications completed', {
            articleId,
            articleTitle: article.title,
            oldStatus,
            newStatus,
            authorRole,
            actorRole,
            successful,
            failed
          });
        }).catch(error => {
          logger.error('Background notification error', {
            articleId,
            error: error.message
          });
        });
      }

      logger.info('Role-based notification initiated', {
        articleId,
        articleTitle: article.title,
        oldStatus,
        newStatus,
        authorRole,
        actorRole
      });

    } catch (error) {
      logger.error('Failed to initiate role-based notification', {
        articleId,
        oldStatus,
        newStatus,
        error: error.message
      });
    }
  }

  // Published Content Notifications

  /**
   * Notify EIC when Section Head updates and publishes an article
   */
  async notifyEICArticleUpdatedAndPublished(articleId, updatedByUserId) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true
            }
          },
          categories: {
            select: {
              name: true
            }
          }
        }
      });

      if (!article) {
        logger.warn('Article not found for EIC update notification', { articleId });
        return;
      }

      // Get all EIC users
      const eicUsers = await prisma.user.findMany({
        where: {
          role: 'EDITOR_IN_CHIEF'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });

      if (eicUsers.length === 0) {
        logger.warn('No EIC users found for article update notification', { articleId });
        return;
      }

      // Get the user who updated the article
      const updatedByUser = await prisma.user.findUnique({
        where: { id: updatedByUserId },
        select: {
          firstName: true,
          lastName: true,
          username: true
        }
      });

      const updatedByName = updatedByUser ? 
        `${updatedByUser.firstName} ${updatedByUser.lastName}`.trim() || updatedByUser.username :
        'A Section Head';

      // Create in-app notifications for all EIC users
      const notificationPromises = eicUsers.map(eicUser => 
        prisma.notification.create({
          data: {
            title: 'Article Updated and Published',
            message: `${updatedByName} has updated and republished "${article.title}" by ${article.author.firstName} ${article.author.lastName}`,
            type: 'ARTICLE_PUBLISHED',
            userId: eicUser.id,
            data: {
              articleId: article.id,
              articleTitle: article.title,
              authorName: `${article.author.firstName} ${article.author.lastName}`,
              updatedByName: updatedByName,
              category: article.categories?.[0]?.name || 'Uncategorized'
            }
          }
        })
      );

      // Execute all notification creations in parallel
      await Promise.allSettled(notificationPromises);

      // Send email notifications to all EIC users (non-blocking)
      const emailPromises = eicUsers.map(eicUser => 
        this.emailService.sendEICArticleUpdatedNotification(
          eicUser.email,
          eicUser.firstName,
          article.title,
          article.author.firstName,
          article.author.lastName,
          updatedByName
        )
      );

      // Execute email sending in background (non-blocking)
      Promise.allSettled(emailPromises).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            logger.info('EIC article update email sent successfully', { 
              email: eicUsers[index].email, 
              articleId, 
              articleTitle: article.title 
            });
          } else {
            logger.error('Failed to send EIC article update email', { 
              email: eicUsers[index].email, 
              articleId, 
              articleTitle: article.title, 
              error: result.reason?.message 
            });
          }
        });
      });

      logger.info('EIC article update notifications initiated', { 
        articleId, 
        articleTitle: article.title, 
        eicCount: eicUsers.length 
      });

    } catch (error) {
      logger.error('Failed to notify EIC of article update', {
        articleId,
        updatedByUserId,
        error: error.message
      });
    }
  }

  /**
   * Notify EIC when Section Head archives an article
   */
  async notifyEICArticleArchived(articleId, archivedByUserId) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true
            }
          },
          categories: {
            select: {
              name: true
            }
          }
        }
      });

      if (!article) {
        logger.warn('Article not found for EIC archive notification', { articleId });
        return;
      }

      // Get all EIC users
      const eicUsers = await prisma.user.findMany({
        where: {
          role: 'EDITOR_IN_CHIEF'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });

      if (eicUsers.length === 0) {
        logger.warn('No EIC users found for article archive notification', { articleId });
        return;
      }

      // Get the user who archived the article
      const archivedByUser = await prisma.user.findUnique({
        where: { id: archivedByUserId },
        select: {
          firstName: true,
          lastName: true,
          username: true
        }
      });

      const archivedByName = archivedByUser ? 
        `${archivedByUser.firstName} ${archivedByUser.lastName}`.trim() || archivedByUser.username :
        'A Section Head';

      // Create in-app notifications for all EIC users
      const notificationPromises = eicUsers.map(eicUser => 
        prisma.notification.create({
          data: {
            title: 'Article Archived',
            message: `${archivedByName} has archived "${article.title}" by ${article.author.firstName} ${article.author.lastName}`,
            type: 'WARNING',
            userId: eicUser.id,
            data: {
              articleId: article.id,
              articleTitle: article.title,
              authorName: `${article.author.firstName} ${article.author.lastName}`,
              archivedByName: archivedByName,
              category: article.categories?.[0]?.name || 'Uncategorized'
            }
          }
        })
      );

      // Execute all notification creations in parallel
      await Promise.allSettled(notificationPromises);

      // Send email notifications to all EIC users (non-blocking)
      const emailPromises = eicUsers.map(eicUser => 
        this.emailService.sendEICArticleArchivedNotification(
          eicUser.email,
          eicUser.firstName,
          article.title,
          article.author.firstName,
          article.author.lastName,
          archivedByName
        )
      );

      // Execute email sending in background (non-blocking)
      Promise.allSettled(emailPromises).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            logger.info('EIC article archive email sent successfully', { 
              email: eicUsers[index].email, 
              articleId, 
              articleTitle: article.title 
            });
          } else {
            logger.error('Failed to send EIC article archive email', { 
              email: eicUsers[index].email, 
              articleId, 
              articleTitle: article.title, 
              error: result.reason?.message 
            });
          }
        });
      });

      logger.info('EIC article archive notifications initiated', { 
        articleId, 
        articleTitle: article.title, 
        eicCount: eicUsers.length 
      });

    } catch (error) {
      logger.error('Failed to notify EIC of article archive', {
        articleId,
        archivedByUserId,
        error: error.message
      });
    }
  }

  /**
   * Notify Section Heads when EIC restores an article
   */
  async notifySectionHeadsArticleRestored(articleId, restoredByUserId) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true
            }
          },
          categories: {
            select: {
              name: true
            }
          }
        }
      });

      if (!article) {
        logger.warn('Article not found for Section Head restore notification', { articleId });
        return;
      }

      // Get all Section Head users
      const sectionHeadUsers = await prisma.user.findMany({
        where: {
          role: 'SECTION_HEAD'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });

      if (sectionHeadUsers.length === 0) {
        logger.warn('No Section Head users found for article restore notification', { articleId });
        return;
      }

      // Get the user who restored the article
      const restoredByUser = await prisma.user.findUnique({
        where: { id: restoredByUserId },
        select: {
          firstName: true,
          lastName: true,
          username: true
        }
      });

      const restoredByName = restoredByUser ? 
        `${restoredByUser.firstName} ${restoredByUser.lastName}`.trim() || restoredByUser.username :
        'The Editor-in-Chief';

      // Create in-app notifications for all Section Head users
      const notificationPromises = sectionHeadUsers.map(sectionHeadUser => 
        prisma.notification.create({
          data: {
            title: 'Article Restored to Review',
            message: `${restoredByName} has restored "${article.title}" by ${article.author.firstName} ${article.author.lastName} back to review queue`,
            type: 'INFO',
            userId: sectionHeadUser.id,
            data: {
              articleId: article.id,
              articleTitle: article.title,
              authorName: `${article.author.firstName} ${article.author.lastName}`,
              restoredByName: restoredByName,
              category: article.categories?.[0]?.name || 'Uncategorized'
            }
          }
        })
      );

      // Execute all notification creations in parallel
      await Promise.allSettled(notificationPromises);

      // Send email notifications to all Section Head users (non-blocking)
      const emailPromises = sectionHeadUsers.map(sectionHeadUser => 
        this.emailService.sendSectionHeadArticleRestoredNotification(
          sectionHeadUser.email,
          sectionHeadUser.firstName,
          article.title,
          article.author.firstName,
          article.author.lastName,
          restoredByName
        )
      );

      // Execute email sending in background (non-blocking)
      Promise.allSettled(emailPromises).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            logger.info('Section Head article restore email sent successfully', { 
              email: sectionHeadUsers[index].email, 
              articleId, 
              articleTitle: article.title 
            });
          } else {
            logger.error('Failed to send Section Head article restore email', { 
              email: sectionHeadUsers[index].email, 
              articleId, 
              articleTitle: article.title, 
              error: result.reason?.message 
            });
          }
        });
      });

      logger.info('Section Head article restore notifications initiated', { 
        articleId, 
        articleTitle: article.title, 
        sectionHeadCount: sectionHeadUsers.length 
      });

    } catch (error) {
      logger.error('Failed to notify Section Heads of article restore', {
        articleId,
        restoredByUserId,
        error: error.message
      });
    }
  }

  /**
   * Notify EIC when Section Head creates a new online issue (flipbook)
   */
  async notifyEICFlipbookCreated(flipbookId, createdByUserId) {
    try {
      const flipbook = await prisma.flipbook.findUnique({
        where: { id: flipbookId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true
            }
          }
        }
      });

      if (!flipbook) {
        logger.warn('Flipbook not found for EIC creation notification', { flipbookId });
        return;
      }

      // Get all EIC users
      const eicUsers = await prisma.user.findMany({
        where: {
          role: 'EDITOR_IN_CHIEF'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });

      if (eicUsers.length === 0) {
        logger.warn('No EIC users found for flipbook creation notification', { flipbookId });
        return;
      }

      // Get the user who created the flipbook
      const createdByUser = await prisma.user.findUnique({
        where: { id: createdByUserId },
        select: {
          firstName: true,
          lastName: true,
          username: true
        }
      });

      const createdByName = createdByUser ? 
        `${createdByUser.firstName} ${createdByUser.lastName}`.trim() || createdByUser.username :
        'A Section Head';

      // Create in-app notifications for all EIC users
      const notificationPromises = eicUsers.map(eicUser => 
        prisma.notification.create({
          data: {
            title: 'New Online Issue Created',
            message: `${createdByName} has created a new online issue "${flipbook.name}"`,
            type: 'ARTICLE_PUBLISHED',
            userId: eicUser.id,
            data: {
              flipbookId: flipbook.id,
              flipbookName: flipbook.name,
              flipbookType: flipbook.type,
              createdByName: createdByName,
              creatorName: `${flipbook.user.firstName} ${flipbook.user.lastName}`
            }
          }
        })
      );

      // Execute all notification creations in parallel
      await Promise.allSettled(notificationPromises);

      // Send email notifications to all EIC users (non-blocking)
      const emailPromises = eicUsers.map(eicUser => 
        this.emailService.sendEICFlipbookCreatedNotification(
          eicUser.email,
          eicUser.firstName,
          flipbook.name,
          flipbook.type,
          createdByName,
          `${flipbook.user.firstName} ${flipbook.user.lastName}`
        )
      );

      // Execute email sending in background (non-blocking)
      Promise.allSettled(emailPromises).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            logger.info('EIC flipbook creation email sent successfully', { 
              email: eicUsers[index].email, 
              flipbookId, 
              flipbookName: flipbook.name 
            });
          } else {
            logger.error('Failed to send EIC flipbook creation email', { 
              email: eicUsers[index].email, 
              flipbookId, 
              flipbookName: flipbook.name, 
              error: result.reason?.message 
            });
          }
        });
      });

      logger.info('EIC flipbook creation notifications initiated', { 
        flipbookId, 
        flipbookName: flipbook.name, 
        eicCount: eicUsers.length 
      });

    } catch (error) {
      logger.error('Failed to notify EIC of flipbook creation', {
        flipbookId,
        createdByUserId,
        error: error.message
      });
    }
  }

  /**
   * Notify ADMINISTRATOR when any article is published
   */
  async notifyAdviserArticlePublished(articleId) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
              role: true
            }
          },
          categories: {
            select: {
              name: true
            }
          }
        }
      });

      if (!article) {
        logger.warn('Article not found for ADMINISTRATOR publish notification', { articleId });
        return;
      }

      // Get all ADMINISTRATOR users
      const advisers = await prisma.user.findMany({
        where: { 
          role: 'ADMINISTRATOR',
          isActive: true 
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          username: true
        }
      });

      if (advisers.length === 0) {
        logger.info('No ADMINISTRATOR users found for publish notification', { articleId });
        return;
      }

      const authorName = `${article.author.firstName} ${article.author.lastName}`;
      const categoryNames = article.categories.map(cat => cat.name).join(', ');

      // Create in-app notifications for all ADMINISTRATOR users
      const notificationPromises = advisers.map(adviser => 
        prisma.notification.create({
          data: {
            userId: adviser.id,
            type: 'ARTICLE_PUBLISHED',
            title: 'Article Published',
            message: `"${article.title}" by ${authorName} (${article.author.role}) has been published.`,
            data: {
              articleId: article.id,
              articleTitle: article.title,
              authorName,
              authorRole: article.author.role,
              categories: categoryNames,
              publishedAt: article.publishedAt
            },
            isRead: false
          }
        })
      );

      // Send email notifications to all ADMINISTRATOR users
      const emailPromises = advisers.map(adviser => 
        emailService.sendAdviserArticlePublishedNotification(
          adviser.email,
          adviser.firstName,
          article.title,
          authorName,
          article.author.role,
          categoryNames
        )
      );

      // Execute all notifications
      await Promise.allSettled([...notificationPromises, ...emailPromises]);

      logger.info('ADMINISTRATOR publish notifications sent', {
        articleId,
        articleTitle: article.title,
        authorName,
        authorRole: article.author.role,
        adviserCount: advisers.length
      });

    } catch (error) {
      logger.error('Error sending ADMINISTRATOR publish notifications', {
        articleId,
        error: error.message,
        stack: error.stack
      });
    }
  }

  /**
   * Notify EIC when Section Head publishes their own article
   */
  async notifyEICSectionHeadPublishedArticle(articleId) {
    try {
      const article = await prisma.article.findUnique({
        where: { id: articleId },
        include: {
          author: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true
            }
          },
          categories: {
            select: {
              name: true
            }
          }
        }
      });

      if (!article) {
        logger.warn('Article not found for EIC Section Head publish notification', { articleId });
        return;
      }

      // Get all EIC users
      const eicUsers = await prisma.user.findMany({
        where: {
          role: 'EDITOR_IN_CHIEF'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });

      if (eicUsers.length === 0) {
        logger.warn('No EIC users found for Section Head publish notification', { articleId });
        return;
      }

      const authorName = `${article.author.firstName} ${article.author.lastName}`.trim() || article.author.username;

      // Create in-app notifications for all EIC users
      const notificationPromises = eicUsers.map(eicUser => 
        prisma.notification.create({
          data: {
            title: 'Article Published by Section Head',
            message: `${authorName} (Section Head) has published "${article.title}"`,
            type: 'ARTICLE_PUBLISHED',
            userId: eicUser.id,
            data: {
              articleId: article.id,
              articleTitle: article.title,
              authorName: authorName,
              authorRole: 'SECTION_HEAD',
              category: article.categories?.[0]?.name || 'Uncategorized'
            }
          }
        })
      );

      // Execute all notification creations in parallel
      await Promise.allSettled(notificationPromises);

      // Send email notifications to all EIC users (non-blocking)
      const emailPromises = eicUsers.map(eicUser => 
        this.emailService.sendEICSectionHeadPublishedNotification(
          eicUser.email,
          eicUser.firstName,
          article.title,
          authorName
        )
      );

      // Execute email sending in background (non-blocking)
      Promise.allSettled(emailPromises).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            logger.info('EIC Section Head publish email sent successfully', { 
              email: eicUsers[index].email, 
              articleId, 
              articleTitle: article.title 
            });
          } else {
            logger.error('Failed to send EIC Section Head publish email', { 
              email: eicUsers[index].email, 
              articleId, 
              articleTitle: article.title, 
              error: result.reason?.message 
            });
          }
        });
      });

      logger.info('EIC Section Head publish notifications initiated', { 
        articleId, 
        articleTitle: article.title, 
        eicCount: eicUsers.length 
      });

    } catch (error) {
      logger.error('Failed to notify EIC of Section Head article publication', {
        articleId,
        error: error.message
      });
    }
  }

  /**
   * Notify EIC when Section Head updates an online issue (flipbook)
   */
  async notifyEICFlipbookUpdated(flipbookId, updatedByUserId) {
    try {
      const flipbook = await prisma.flipbook.findUnique({
        where: { id: flipbookId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true
            }
          }
        }
      });

      if (!flipbook) {
        logger.warn('Flipbook not found for EIC update notification', { flipbookId });
        return;
      }

      // Get all EIC users
      const eicUsers = await prisma.user.findMany({
        where: {
          role: 'EDITOR_IN_CHIEF'
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true
        }
      });

      if (eicUsers.length === 0) {
        logger.warn('No EIC users found for flipbook update notification', { flipbookId });
        return;
      }

      // Get the user who updated the flipbook
      const updatedByUser = await prisma.user.findUnique({
        where: { id: updatedByUserId },
        select: {
          firstName: true,
          lastName: true,
          username: true
        }
      });

      const updatedByName = updatedByUser ? 
        `${updatedByUser.firstName} ${updatedByUser.lastName}`.trim() || updatedByUser.username :
        'A Section Head';

      // Create in-app notifications for all EIC users
      const notificationPromises = eicUsers.map(eicUser => 
        prisma.notification.create({
          data: {
            title: 'Online Issue Updated',
            message: `${updatedByName} has updated the online issue "${flipbook.name}"`,
            type: 'INFO',
            userId: eicUser.id,
            data: {
              flipbookId: flipbook.id,
              flipbookName: flipbook.name,
              flipbookType: flipbook.type,
              updatedByName: updatedByName,
              creatorName: `${flipbook.user.firstName} ${flipbook.user.lastName}`
            }
          }
        })
      );

      // Execute all notification creations in parallel
      await Promise.allSettled(notificationPromises);

      // Send email notifications to all EIC users (non-blocking)
      const emailPromises = eicUsers.map(eicUser => 
        this.emailService.sendEICFlipbookUpdatedNotification(
          eicUser.email,
          eicUser.firstName,
          flipbook.name,
          flipbook.type,
          updatedByName,
          `${flipbook.user.firstName} ${flipbook.user.lastName}`
        )
      );

      // Execute email sending in background (non-blocking)
      Promise.allSettled(emailPromises).then(results => {
        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            logger.info('EIC flipbook update email sent successfully', { 
              email: eicUsers[index].email, 
              flipbookId, 
              flipbookName: flipbook.name 
            });
          } else {
            logger.error('Failed to send EIC flipbook update email', { 
              email: eicUsers[index].email, 
              flipbookId, 
              flipbookName: flipbook.name, 
              error: result.reason?.message 
            });
          }
        });
      });

      logger.info('EIC flipbook update notifications initiated', { 
        flipbookId, 
        flipbookName: flipbook.name, 
        eicCount: eicUsers.length 
      });

    } catch (error) {
      logger.error('Failed to notify EIC of flipbook update', {
        flipbookId,
        updatedByUserId,
        error: error.message
      });
    }
  }
}

module.exports = {
  NotificationService: new NotificationService(),
  setRealtimeNotifications
};