// Google Analytics Configuration
// Replace 'GA_MEASUREMENT_ID' with your actual Google Analytics Measurement ID
// Format: G-XXXXXXXXXX

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'GA_MEASUREMENT_ID';

// Initialize Google Analytics
export const initGA = () => {
  if (typeof window !== 'undefined' && GA_MEASUREMENT_ID !== 'GA_MEASUREMENT_ID') {
    // Load Google Analytics script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', GA_MEASUREMENT_ID, {
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track page views
export const trackPageView = (url) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID !== 'GA_MEASUREMENT_ID') {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
      page_title: document.title,
      page_location: window.location.href,
    });
  }
};

// Track custom events
export const trackEvent = (eventName, parameters = {}) => {
  if (typeof window !== 'undefined' && window.gtag && GA_MEASUREMENT_ID !== 'GA_MEASUREMENT_ID') {
    window.gtag('event', eventName, parameters);
  }
};

// Track user login
export const trackLogin = (method = 'email') => {
  trackEvent('login', {
    method: method
  });
};

// Track user logout
export const trackLogout = () => {
  trackEvent('logout');
};

// Track article views
export const trackArticleView = (articleId, articleTitle, category) => {
  trackEvent('view_item', {
    item_id: articleId,
    item_name: articleTitle,
    item_category: category,
    content_type: 'article'
  });
};

// Track article creation
export const trackArticleCreate = (articleId, articleTitle, category) => {
  trackEvent('create_content', {
    item_id: articleId,
    item_name: articleTitle,
    item_category: category,
    content_type: 'article'
  });
};

// Track article edit
export const trackArticleEdit = (articleId, articleTitle, category) => {
  trackEvent('edit_content', {
    item_id: articleId,
    item_name: articleTitle,
    item_category: category,
    content_type: 'article'
  });
};

// Track article approval
export const trackArticleApproval = (articleId, articleTitle, category) => {
  trackEvent('approve_content', {
    item_id: articleId,
    item_name: articleTitle,
    item_category: category,
    content_type: 'article'
  });
};

// Track article rejection
export const trackArticleRejection = (articleId, articleTitle, category, reason) => {
  trackEvent('reject_content', {
    item_id: articleId,
    item_name: articleTitle,
    item_category: category,
    content_type: 'article',
    rejection_reason: reason
  });
};

// Track search events
export const trackSearch = (searchTerm, resultsCount) => {
  trackEvent('search', {
    search_term: searchTerm,
    results_count: resultsCount
  });
};

// Track file uploads
export const trackFileUpload = (fileType, fileSize) => {
  trackEvent('file_upload', {
    file_type: fileType,
    file_size: fileSize
  });
};

// Track user role changes
export const trackRoleChange = (userId, oldRole, newRole) => {
  trackEvent('role_change', {
    user_id: userId,
    old_role: oldRole,
    new_role: newRole
  });
};

// Track errors
export const trackError = (errorMessage, errorCode, page) => {
  trackEvent('exception', {
    description: errorMessage,
    fatal: false,
    error_code: errorCode,
    page: page
  });
};

// Track performance metrics
export const trackPerformance = (metricName, value, unit = 'ms') => {
  trackEvent('timing_complete', {
    name: metricName,
    value: value,
    unit: unit
  });
};
