/**
 * Flipbook API Service
 * Handles API calls for flipbook management
 */

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

class FlipbookService {
  constructor() {
    this.api = axios.create({
      baseURL: `${API_BASE_URL}/flipbooks`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Add response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/admin-portal';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all flipbooks with optional filtering
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Response data
   */
  async getFlipbooks(params = {}) {
    try {
      const response = await this.api.get('/', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching flipbooks:', error);
      throw error;
    }
  }

  /**
   * Get a specific flipbook by ID
   * @param {string} id - Flipbook ID
   * @returns {Promise<Object>} Response data
   */
  async getFlipbook(id) {
    try {
      const response = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching flipbook:', error);
      throw error;
    }
  }

  /**
   * Create a new flipbook
   * @param {Object} flipbookData - Flipbook data
   * @returns {Promise<Object>} Response data
   */
  async createFlipbook(flipbookData) {
    try {
      console.log('🔍 FlipbookService Debug:');
      console.log('   Request data:', flipbookData);
      console.log('   Token:', localStorage.getItem('token'));
      console.log('   API base URL:', this.api.defaults.baseURL);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('name', flipbookData.name);
      formData.append('embedUrl', flipbookData.embedUrl);
      formData.append('type', flipbookData.type);
      formData.append('releaseDate', flipbookData.releaseDate);
      
      // Add image file if present
      if (flipbookData.thumbnailImage) {
        formData.append('thumbnailImage', flipbookData.thumbnailImage);
        console.log('   Image file added to FormData:', flipbookData.thumbnailImage.name);
      }
      
      // Create a new axios instance for this request with multipart headers
      const response = await axios.post(`${this.api.defaults.baseURL}/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('   Response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating flipbook:', error);
      console.error('   Error response:', error.response?.data);
      console.error('   Error status:', error.response?.status);
      throw error;
    }
  }

  /**
   * Update a flipbook
   * @param {string} id - Flipbook ID
   * @param {Object} flipbookData - Updated flipbook data
   * @returns {Promise<Object>} Response data
   */
  async updateFlipbook(id, flipbookData) {
    try {
      console.log('🔍 FlipbookService - Updating flipbook:', id);
      console.log('   Update data:', flipbookData);
      
      const formData = new FormData();
      formData.append('name', flipbookData.name);
      formData.append('embedUrl', flipbookData.embedUrl);
      formData.append('type', flipbookData.type);
      formData.append('releaseDate', flipbookData.releaseDate);
      
      if (flipbookData.thumbnailImage) {
        formData.append('thumbnailImage', flipbookData.thumbnailImage);
        console.log('   Image file added to FormData:', flipbookData.thumbnailImage.name);
      }
      
      const response = await this.api.put(`/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('   Update successful:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating flipbook:', error);
      throw error;
    }
  }

  /**
   * Delete a flipbook
   * @param {string} id - Flipbook ID
   * @returns {Promise<Object>} Response data
   */
  async deleteFlipbook(id) {
    try {
      const response = await this.api.delete(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting flipbook:', error);
      throw error;
    }
  }

  /**
   * Toggle flipbook active status
   * @param {string} id - Flipbook ID
   * @returns {Promise<Object>} Response data
   */
  async toggleFlipbookStatus(id) {
    try {
      const response = await this.api.patch(`/${id}/toggle`);
      return response.data;
    } catch (error) {
      console.error('Error toggling flipbook status:', error);
      throw error;
    }
  }

  /**
   * Get flipbooks by type
   * @param {string} type - Publication type
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Object>} Response data
   */
  async getFlipbooksByType(type, params = {}) {
    try {
      const response = await this.api.get('/', {
        params: { ...params, type }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching flipbooks by type:', error);
      throw error;
    }
  }

  /**
   * Get active flipbooks only
   * @param {Object} params - Additional query parameters
   * @returns {Promise<Object>} Response data
   */
  async getActiveFlipbooks(params = {}) {
    try {
      const response = await this.api.get('/', {
        params: { ...params, isActive: true }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching active flipbooks:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const flipbookService = new FlipbookService();
export default flipbookService;
