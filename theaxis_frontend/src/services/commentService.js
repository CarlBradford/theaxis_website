import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

class CommentService {
  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      console.log('🔑 CommentService: Token from localStorage:', token ? 'Present' : 'Missing');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('✅ CommentService: Authorization header set');
      } else {
        console.log('❌ CommentService: No token found in localStorage');
      }
      return config;
    });

    // Add response interceptor to handle errors
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ CommentService: Response received:', response.status);
        return response;
      },
      (error) => {
        console.log('❌ CommentService: Response error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  // Get all comments for admin management
  async getAllComments(params = {}) {
    try {
      console.log('🚀 CommentService: Making API call to /comments/admin with params:', params);
      const response = await this.api.get('/comments/admin', { params });
      console.log('✅ CommentService: API response received:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ CommentService: Error fetching comments:', error);
      throw error;
    }
  }

  // Approve a comment
  async approveComment(commentId) {
    try {
      console.log('🚀 CommentService: Approving comment:', commentId);
      const response = await this.api.post(`/comments/${commentId}/approve`);
      console.log('✅ CommentService: Comment approved successfully');
      return response.data;
    } catch (error) {
      console.error('❌ CommentService: Error approving comment:', error);
      throw error;
    }
  }

  // Reject a comment
  async rejectComment(commentId, reason = 'Inappropriate content') {
    try {
      console.log('🚀 CommentService: Rejecting comment:', commentId, 'Reason:', reason);
      const response = await this.api.post(`/comments/${commentId}/reject`, { reason });
      console.log('✅ CommentService: Comment rejected successfully');
      return response.data;
    } catch (error) {
      console.error('❌ CommentService: Error rejecting comment:', error);
      throw error;
    }
  }

  // Delete a comment
  async deleteComment(commentId) {
    try {
      console.log('🚀 CommentService: Deleting comment:', commentId);
      const response = await this.api.delete(`/comments/${commentId}`);
      console.log('✅ CommentService: Comment deleted successfully');
      return response.data;
    } catch (error) {
      console.error('❌ CommentService: Error deleting comment:', error);
      throw error;
    }
  }

  // Update a comment
  async updateComment(commentId, data) {
    try {
      const response = await this.api.put(`/comments/${commentId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  }

  // Get comments for a specific article
  async getArticleComments(articleId, includePending = false) {
    try {
      const params = { articleId };
      if (includePending) {
        params.includePending = true;
      }
      const response = await this.api.get('/comments', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching article comments:', error);
      throw error;
    }
  }

  // Create a new comment
  async createComment(data) {
    try {
      const response = await this.api.post('/comments', data);
      return response.data;
    } catch (error) {
      console.error('Error creating comment:', error);
      throw error;
    }
  }
}

export default new CommentService();
