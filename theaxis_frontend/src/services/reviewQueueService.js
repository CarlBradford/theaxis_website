import api from './api';

export const reviewQueueService = {
  // Get articles for review queue
  async getReviewQueue(queueType, filters = {}) {
    const params = {
      queueType,
      ...filters
    };
    
    const response = await api.get('/articles/review-queue', { params });
    return response.data;
  },

  // Update article status through review action
  async updateArticleStatus(articleId, action, feedback = null) {
    const requestBody = {
      action,
      ...(feedback && { feedback })
    };
    
    const response = await api.patch(`/articles/${articleId}/review-action`, requestBody);
    return response.data;
  },

  // Update article status directly (for resubmit action)
  async updateArticleStatusDirect(articleId, status) {
    const requestBody = {
      status
    };
    
    const response = await api.patch(`/articles/${articleId}/status`, requestBody);
    return response.data;
  },

  // Bulk actions for multiple articles
  async bulkUpdateArticles(articleIds, action, feedback = null) {
    const promises = articleIds.map(id => 
      this.updateArticleStatus(id, action, feedback)
    );
    
    const results = await Promise.allSettled(promises);
    
    // Return summary of results
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;
    
    return {
      successful,
      failed,
      total: articleIds.length,
      results
    };
  }
};

export default reviewQueueService;
