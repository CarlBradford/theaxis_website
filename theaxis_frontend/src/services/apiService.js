import api from './api';

// Authentication API
export const authAPI = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  // Get user profile
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    return response.data;
  },

  // Change password
  changePassword: async (passwordData) => {
    const response = await api.post('/auth/change-password', passwordData);
    return response.data;
  },

  // Refresh token
  refreshToken: async () => {
    const response = await api.post('/auth/refresh');
    return response.data;
  },

  // Logout (client-side)
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
};

// Articles API
export const articlesAPI = {
  // Get all articles
  getArticles: async (params = {}) => {
    const response = await api.get('/articles', { params });
    return response.data;
  },

  // Get single article by ID or slug
  getArticle: async (idOrSlug) => {
    const response = await api.get(`/articles/${idOrSlug}`);
    return response.data;
  },

  // Create new article
  createArticle: async (articleData) => {
    const response = await api.post('/articles', articleData);
    return response.data;
  },

  // Update article
  updateArticle: async (id, articleData) => {
    const response = await api.put(`/articles/${id}`, articleData);
    return response.data;
  },

  // Update article status
  updateArticleStatus: async (id, status) => {
    const response = await api.patch(`/articles/${id}/status`, { status });
    return response.data;
  },

  // Delete article
  deleteArticle: async (id) => {
    const response = await api.delete(`/articles/${id}`);
    return response.data;
  },

  // Increment view count
  incrementViewCount: async (id) => {
    const response = await api.post(`/articles/${id}/view`);
    return response.data;
  }
};

// Comments API
export const commentsAPI = {
  // Get comments for an article
  getComments: async (articleId, params = {}) => {
    const response = await api.get('/comments', { 
      params: { articleId, ...params } 
    });
    return response.data;
  },

  // Get single comment
  getComment: async (id) => {
    const response = await api.get(`/comments/${id}`);
    return response.data;
  },

  // Create new comment
  createComment: async (commentData) => {
    const response = await api.post('/comments', commentData);
    return response.data;
  },

  // Update comment
  updateComment: async (id, commentData) => {
    const response = await api.put(`/comments/${id}`, commentData);
    return response.data;
  },

  // Approve comment
  approveComment: async (id) => {
    const response = await api.post(`/comments/${id}/approve`);
    return response.data;
  },

  // Reject comment
  rejectComment: async (id) => {
    const response = await api.post(`/comments/${id}/reject`);
    return response.data;
  },

  // Delete comment
  deleteComment: async (id) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  }
};

// Tags API
export const tagsAPI = {
  // Get all tags
  getTags: async (params = {}) => {
    const response = await api.get('/tags', { params });
    return response.data;
  },

  // Get single tag
  getTag: async (id) => {
    const response = await api.get(`/tags/${id}`);
    return response.data;
  },

  // Create new tag
  createTag: async (tagData) => {
    const response = await api.post('/tags', tagData);
    return response.data;
  },

  // Update tag
  updateTag: async (id, tagData) => {
    const response = await api.put(`/tags/${id}`, tagData);
    return response.data;
  },

  // Delete tag
  deleteTag: async (id) => {
    const response = await api.delete(`/tags/${id}`);
    return response.data;
  }
};

// Categories API
export const categoriesAPI = {
  // Get all categories
  getCategories: async (params = {}) => {
    const response = await api.get('/categories', { params });
    return response.data;
  },

  // Get single category
  getCategory: async (id) => {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  },

  // Create new category
  createCategory: async (categoryData) => {
    const response = await api.post('/categories', categoryData);
    return response.data;
  },

  // Update category
  updateCategory: async (id, categoryData) => {
    const response = await api.put(`/categories/${id}`, categoryData);
    return response.data;
  },

  // Delete category
  deleteCategory: async (id) => {
    const response = await api.delete(`/categories/${id}`);
    return response.data;
  }
};

// Editorial Notes API
export const editorialNotesAPI = {
  // Get editorial notes for an article
  getNotes: async (articleId, params = {}) => {
    const response = await api.get('/editorial-notes', { 
      params: { articleId, ...params } 
    });
    return response.data;
  },

  // Create new editorial note
  createNote: async (noteData) => {
    const response = await api.post('/editorial-notes', noteData);
    return response.data;
  },

  // Update editorial note
  updateNote: async (id, noteData) => {
    const response = await api.put(`/editorial-notes/${id}`, noteData);
    return response.data;
  },

  // Delete editorial note
  deleteNote: async (id) => {
    const response = await api.delete(`/editorial-notes/${id}`);
    return response.data;
  }
};

// Analytics API
export const analyticsAPI = {
  // Get dashboard analytics
  getDashboard: async () => {
    const response = await api.get('/analytics/dashboard');
    return response.data;
  },

  // Get article analytics
  getArticleAnalytics: async (period = '30d') => {
    const response = await api.get('/analytics/articles', { 
      params: { period } 
    });
    return response.data;
  },

  // Get user analytics
  getUserAnalytics: async (period = '30d') => {
    const response = await api.get('/analytics/users', { 
      params: { period } 
    });
    return response.data;
  },

  // Get comment analytics
  getCommentAnalytics: async (period = '30d') => {
    const response = await api.get('/analytics/comments', { 
      params: { period } 
    });
    return response.data;
  }
};

// Media API
export const mediaAPI = {
  // Get all media files
  getMedia: async (params = {}) => {
    const response = await api.get('/media', { params });
    return response.data;
  },

  // Upload media file
  uploadMedia: async (file, onProgress = null) => {
    const formData = new FormData();
    formData.append('file', file);

    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    };

    if (onProgress) {
      config.onUploadProgress = onProgress;
    }

    const response = await api.post('/media', formData, config);
    return response.data;
  },

  // Delete media file
  deleteMedia: async (id) => {
    const response = await api.delete(`/media/${id}`);
    return response.data;
  }
};

// Users API (Admin only)
export const usersAPI = {
  // Get all users
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },

  // Get single user
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // Activate/deactivate user
  toggleUserStatus: async (id) => {
    const response = await api.patch(`/users/${id}/toggle-status`);
    return response.data;
  }
};

// Utility functions
export const utils = {
  // Check if user has required role
  hasRole: (userRole, requiredRole) => {
    const roleHierarchy = {
      'READER': 0,
      'STAFF': 1,
      'SECTION_HEAD': 2,
      'EDITOR_IN_CHIEF': 3
    };
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  },

  // Format API error messages
  formatError: (error) => {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unexpected error occurred';
  },

  // Get file URL for media
  getMediaUrl: (filename) => {
    return `http://localhost:3001/uploads/${filename}`;
  },

  // Format date for display
  formatDate: (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

export default {
  auth: authAPI,
  articles: articlesAPI,
  comments: commentsAPI,
  tags: tagsAPI,
  categories: categoriesAPI,
  editorialNotes: editorialNotesAPI,
  analytics: analyticsAPI,
  media: mediaAPI,
  users: usersAPI,
  utils
};
