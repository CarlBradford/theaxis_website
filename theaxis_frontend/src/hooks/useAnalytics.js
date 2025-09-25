import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { initGA, trackPageView, trackEvent } from '../config/analytics';

// Initialize GA (can be called outside Router context)
export const useGAInit = () => {
  useEffect(() => {
    initGA();
  }, []);
};

// Custom hook for Google Analytics (requires Router context)
export const useAnalytics = () => {
  const location = useLocation();

  // Track page views on route changes
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);

  // Return tracking functions for components to use
  return {
    trackEvent,
    trackPageView: () => trackPageView(location.pathname + location.search),
  };
};

// Hook for tracking specific page analytics
export const usePageAnalytics = (pageName, additionalData = {}) => {
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    // Track page view with custom parameters
    trackEvent('page_view', {
      page_name: pageName,
      page_location: window.location.href,
      page_title: document.title,
      ...additionalData
    });
  }, [pageName, additionalData, trackEvent]);

  return { trackEvent };
};
