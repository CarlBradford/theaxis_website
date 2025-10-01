import React from 'react';
import ReviewQueue from '../components/ReviewQueue';
import { useAuth } from '../hooks/useAuth';

const ReviewQueuePage = () => {
  const { user } = useAuth();
  
  // Determine queue type based on user role
  const getQueueType = () => {
    if (user?.role === 'ADMIN_ASSISTANT' || user?.role === 'ADMINISTRATOR' || user?.role === 'SYSTEM_ADMIN') {
      return 'eic';
    }
    return 'section-head'; // Default for SECTION_HEAD and other roles
  };

  return <ReviewQueue queueType={getQueueType()} />;
};

export default ReviewQueuePage;
