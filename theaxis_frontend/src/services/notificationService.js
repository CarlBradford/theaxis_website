// Notification Service for Article Status Changes
import { useNotifications } from '../components/NotificationBell';

class NotificationService {
  static instance = null;

  constructor() {
    if (NotificationService.instance) {
      return NotificationService.instance;
    }
    NotificationService.instance = this;
  }

  // Helper method to get notification service instance
  static getInstance() {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Add notification for article status changes
  addArticleStatusNotification(articleData, action, feedback = null) {
    const { addNotification } = useNotifications();
    
    let notification = {
      type: 'status_change',
      title: '',
      message: '',
      articleTitle: articleData.title,
      articleId: articleData.id
    };

    switch (action) {
      case 'approve-to-eic':
        notification.title = 'Article Approved';
        notification.message = `Your article "${articleData.title}" has been approved by Section Head and forwarded to Editor-in-Chief for final review.`;
        break;
      
      case 'request-revision':
        notification.title = 'Revision Required';
        notification.message = `Your article "${articleData.title}" needs revision. ${feedback ? `Feedback: ${feedback}` : 'Please check the feedback section for details.'}`;
        notification.type = 'rejection';
        break;
      
      case 'publish':
        notification.title = 'Article Published';
        notification.message = `Congratulations! Your article "${articleData.title}" has been published and is now live.`;
        notification.type = 'approval';
        break;
      
      case 'return-to-section':
        notification.title = 'Article Returned';
        notification.message = `Your article "${articleData.title}" has been returned to Section Head for further review. ${feedback ? `Feedback: ${feedback}` : ''}`;
        notification.type = 'return';
        break;
      
      default:
        notification.title = 'Article Status Updated';
        notification.message = `The status of your article "${articleData.title}" has been updated.`;
    }

    addNotification(notification);
  }

  // Add notification for feedback from EIC to Section Head
  addEICFeedbackNotification(articleData, feedback) {
    const { addNotification } = useNotifications();
    
    addNotification({
      type: 'feedback',
      title: 'Feedback from Editor-in-Chief',
      message: `You have received feedback from the Editor-in-Chief regarding article "${articleData.title}". ${feedback ? `Feedback: ${feedback}` : 'Please check the article for details.'}`,
      articleTitle: articleData.title,
      articleId: articleData.id
    });
  }

  // Add notification for feedback from Section Head to Staff
  addSectionHeadFeedbackNotification(articleData, feedback) {
    const { addNotification } = useNotifications();
    
    addNotification({
      type: 'feedback',
      title: 'Feedback from Section Head',
      message: `You have received feedback from your Section Head regarding article "${articleData.title}". ${feedback ? `Feedback: ${feedback}` : 'Please check the article for details.'}`,
      articleTitle: articleData.title,
      articleId: articleData.id
    });
  }

  // Add notification for general article status changes
  addGeneralStatusNotification(articleData, oldStatus, newStatus) {
    const { addNotification } = useNotifications();
    
    const statusMessages = {
      'DRAFT': 'draft',
      'IN_REVIEW': 'submitted for review',
      'NEEDS_REVISION': 'returned for revision',
      'APPROVED': 'approved',
      'SCHEDULED': 'scheduled for publication',
      'PUBLISHED': 'published',
      'ARCHIVED': 'archived'
    };

    addNotification({
      type: 'status_change',
      title: 'Article Status Updated',
      message: `Your article "${articleData.title}" status has changed from ${statusMessages[oldStatus] || oldStatus.toLowerCase()} to ${statusMessages[newStatus] || newStatus.toLowerCase()}.`,
      articleTitle: articleData.title,
      articleId: articleData.id
    });
  }
}

export default NotificationService;


