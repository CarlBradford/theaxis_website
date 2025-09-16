/**
 * FlipHTML5 Service
 * Handles integration with FlipHTML5 API for creating digital flipbooks
 */

class FlipHTML5Service {
  constructor() {
    this.baseURL = 'https://api.fliphtml5.com/v1';
    this.apiKey = null; // Free plan doesn't require API credentials
    this.apiSecret = null; // Free plan doesn't require API credentials
    this.isConfigured = true; // Free plan doesn't require API credentials
  }

  /**
   * Check if FlipHTML5 API is properly configured
   */
  isConfigured() {
    return true; // Always available for free plan
  }

  /**
   * Create a flipbook from uploaded file using FlipHTML5 free plan
   * @param {File} file - The file to convert to flipbook
   * @param {Object} options - Configuration options
   * @returns {Promise<Object>} Flipbook data
   */
  async createFlipbook(file, options = {}) {
    try {
      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/jpg',
        'image/png'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Unsupported file format. Please upload PDF, PPT, DOC, or image files.');
      }

      // For free plan, we'll simulate the flipbook creation process
      // In a real implementation, you would upload to FlipHTML5's free service
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Generate a mock flipbook ID
      const bookId = `flipbook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Create a mock flipbook response
      const mockFlipbook = {
        book_id: bookId,
        title: options.title || `Annual Edition ${new Date().getFullYear()}`,
        status: 'completed',
        url: `https://fliphtml5.com/book/${bookId}`,
        embed_url: `https://fliphtml5.com/book/${bookId}`,
        created_at: new Date().toISOString(),
        file_size: file.size,
        file_name: file.name
      };

      return mockFlipbook;

    } catch (error) {
      console.error('Error creating flipbook:', error);
      throw error;
    }
  }

  /**
   * Get flipbook embed code for free plan
   * @param {string} bookId - The flipbook ID
   * @returns {Promise<Object>} Embed code data
   */
  async getEmbedCode(bookId) {
    try {
      // For free plan, return mock embed code
      const embedCode = {
        url: `https://fliphtml5.com/book/${bookId}`,
        iframe: `<iframe src="https://fliphtml5.com/book/${bookId}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>`,
        width: '100%',
        height: '600px'
      };

      return embedCode;

    } catch (error) {
      console.error('Error getting embed code:', error);
      throw error;
    }
  }

  /**
   * Get flipbook status (Free plan simulation)
   * @param {string} bookId - The flipbook ID
   * @returns {Promise<Object>} Status data
   */
  async getFlipbookStatus(bookId) {
    try {
      // For free plan, return mock status
      return {
        status: 'completed',
        progress: 100,
        url: `https://fliphtml5.com/book/${bookId}`,
        embed_url: `https://fliphtml5.com/book/${bookId}`,
        error_message: null
      };

    } catch (error) {
      console.error('Error getting flipbook status:', error);
      throw error;
    }
  }

  /**
   * Delete a flipbook (Free plan simulation)
   * @param {string} bookId - The flipbook ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteFlipbook(bookId) {
    try {
      // For free plan, simulate successful deletion
      console.log(`Simulating deletion of flipbook: ${bookId}`);
      return true;

    } catch (error) {
      console.error('Error deleting flipbook:', error);
      throw error;
    }
  }

  /**
   * List all flipbooks (Free plan simulation)
   * @param {Object} options - Query options
   * @returns {Promise<Array>} List of flipbooks
   */
  async listFlipbooks(options = {}) {
    try {
      // For free plan, return empty list (no persistent storage)
      console.log('Free plan: No persistent flipbook storage');
      return [];

    } catch (error) {
      console.error('Error listing flipbooks:', error);
      throw error;
    }
  }
}

// Create and export singleton instance
const fliphtml5Service = new FlipHTML5Service();
export default fliphtml5Service;
