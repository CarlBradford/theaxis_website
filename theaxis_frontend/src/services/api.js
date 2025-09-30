import axios from 'axios';

// Rate limiting configuration - Development settings
const RATE_LIMIT_CONFIG = {
  maxRequests: 100, // Increased from 10 to 100 requests per window
  windowMs: 60000, // 1 minute window
  retryAfterMs: 1000, // Reduced from 5000ms to 1000ms (1 second)
  enabled: import.meta.env.MODE === 'production', // Disable in development
};

// Request tracking
let requestCount = 0;
let windowStart = Date.now();
let isRateLimited = false;
let retryCount = 0;
const MAX_RETRIES = 3;

// Reset rate limit window
const resetRateLimitWindow = () => {
  const now = Date.now();
  if (now - windowStart >= RATE_LIMIT_CONFIG.windowMs) {
    requestCount = 0;
    windowStart = now;
    isRateLimited = false;
  }
};

// Check if we're within rate limits
const checkRateLimit = () => {
  // Skip rate limiting in development
  if (!RATE_LIMIT_CONFIG.enabled) {
    return true;
  }
  
  resetRateLimitWindow();
  
  if (requestCount >= RATE_LIMIT_CONFIG.maxRequests) {
    isRateLimited = true;
    return false;
  }
  
  requestCount++;
  return true;
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Check rate limit before making request
    if (!checkRateLimit()) {
      console.warn('Rate limit exceeded. Request blocked.');
      return Promise.reject(new Error('Rate limit exceeded. Please wait before making another request.'));
    }

    // Log rate limiting status in development
    if (import.meta.env.MODE === 'development') {
      console.log(`Rate limiting: ${RATE_LIMIT_CONFIG.enabled ? 'ENABLED' : 'DISABLED'} | Requests: ${requestCount}/${RATE_LIMIT_CONFIG.maxRequests}`);
    }

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

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    // Handle 429 (Too Many Requests) with limited retry
    if (error.response?.status === 429) {
      if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.warn(`Rate limited by server. Retry ${retryCount}/${MAX_RETRIES}...`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_CONFIG.retryAfterMs));
        
        // Reset our local rate limit to allow retry
        isRateLimited = false;
        requestCount = Math.max(0, requestCount - 1);
        
        // Retry the original request
        try {
          return await api.request(error.config);
        } catch (retryError) {
          return Promise.reject(retryError);
        }
      } else {
        console.error('Max retries exceeded for rate limited request');
        retryCount = 0; // Reset for future requests
        return Promise.reject(error);
      }
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Let the AuthContext handle the navigation through React Router
      // This prevents double navigation issues
    }
    return Promise.reject(error);
  }
);

export default api;
