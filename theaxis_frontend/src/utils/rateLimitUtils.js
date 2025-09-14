// Rate limiting utilities and status tracking

export const RATE_LIMIT_STATUS = {
  NORMAL: 'normal',
  APPROACHING_LIMIT: 'approaching_limit', 
  RATE_LIMITED: 'rate_limited',
  RETRYING: 'retrying'
};

// Get current rate limit status
export const getRateLimitStatus = () => {
  // This would be implemented based on your rate limiting logic
  // For now, return a simple status
  return RATE_LIMIT_STATUS.NORMAL;
};

// Format rate limit error messages
export const formatRateLimitError = (error) => {
  if (error.message?.includes('Rate limit')) {
    return 'Too many requests. Please wait a moment before trying again.';
  }
  
  if (error.response?.status === 429) {
    const retryAfter = error.response.headers['retry-after'];
    if (retryAfter) {
      return `Rate limited. Please wait ${retryAfter} seconds before trying again.`;
    }
    return 'Too many requests. Please wait a moment before trying again.';
  }
  
  return error.message || 'An unexpected error occurred.';
};

// Check if error is rate limit related
export const isRateLimitError = (error) => {
  return error.response?.status === 429 || 
         error.message?.includes('Rate limit') ||
         error.message?.includes('Too many');
};

// Get retry delay for exponential backoff
export const getRetryDelay = (attemptNumber, baseDelay = 1000) => {
  return Math.min(baseDelay * Math.pow(2, attemptNumber), 30000); // Max 30 seconds
};

// Create a user-friendly rate limit message
export const createRateLimitMessage = (error, retryCount = 0) => {
  if (isRateLimitError(error)) {
    if (retryCount > 0) {
      return `Still rate limited. Retrying in ${getRetryDelay(retryCount) / 1000} seconds...`;
    }
    return 'Too many requests. Please wait a moment before trying again.';
  }
  return 'An unexpected error occurred. Please try again.';
};
