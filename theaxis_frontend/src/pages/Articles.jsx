import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Articles = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  useEffect(() => {
    // Redirect to My Articles if user has STAFF role, otherwise show empty state
    if (hasRole('STAFF')) {
      navigate('/content/mycontent', { replace: true });
    }
  }, [navigate, hasRole]);

  // If user doesn't have STAFF role, show empty state
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Management</h1>
        <p className="text-gray-600 mb-6">
          Select a content option from the sidebar to manage your articles.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>• My Content - View and manage your articles</p>
          <p>• Review Queue - Review pending articles</p>
        </div>
      </div>
    </div>
  );
};

export default Articles;
