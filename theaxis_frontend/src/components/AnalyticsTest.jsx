import React from 'react';
import { useAnalytics } from '../hooks/useAnalytics';
import { 
  trackEvent, 
  trackSearch, 
  trackFileUpload, 
  trackError,
  trackPerformance 
} from '../config/analytics';

const AnalyticsTest = () => {
  const { trackEvent: trackEventHook } = useAnalytics();

  const testEvents = [
    {
      name: 'Test Custom Event',
      action: () => trackEvent('test_custom_event', { test_param: 'test_value' })
    },
    {
      name: 'Test Search',
      action: () => trackSearch('test search query', 5)
    },
    {
      name: 'Test File Upload',
      action: () => trackFileUpload('image/jpeg', '1024KB')
    },
    {
      name: 'Test Error',
      action: () => trackError('Test error message', 'TEST_ERROR', 'analytics-test')
    },
    {
      name: 'Test Performance',
      action: () => trackPerformance('page_load', 1500, 'ms')
    },
    {
      name: 'Test Hook Event',
      action: () => trackEventHook('test_hook_event', { hook_test: true })
    }
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Google Analytics Test</h1>
      <p className="mb-6 text-gray-600">
        This component tests the Google Analytics integration. 
        Check your browser's developer tools Network tab for requests to google-analytics.com
        and your Google Analytics Real-time reports to see the events.
      </p>
      
      <div className="space-y-4">
        {testEvents.map((event, index) => (
          <button
            key={index}
            onClick={event.action}
            className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            {event.name}
          </button>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Instructions:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Set your Google Analytics Measurement ID in the environment variables</li>
          <li>Open browser developer tools (F12)</li>
          <li>Go to the Network tab</li>
          <li>Click the test buttons above</li>
          <li>Look for requests to google-analytics.com</li>
          <li>Check Google Analytics Real-time reports</li>
        </ol>
      </div>
    </div>
  );
};

export default AnalyticsTest;
