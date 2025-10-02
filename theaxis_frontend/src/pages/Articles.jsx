import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import usePageTitle from '../hooks/usePageTitle';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { 
  DocumentTextIcon as DocumentTextIconSolid,
} from '@heroicons/react/24/solid';

const Articles = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  // Set page title
  usePageTitle('Articles');

  useEffect(() => {
    // Redirect to My Articles if user has STAFF role, otherwise show empty state
    if (hasRole('STAFF')) {
      navigate('/content/mycontent', { replace: true });
    }
  }, [navigate, hasRole]);

  // If user doesn't have STAFF role, show empty state
  return (
      <div className="flex flex-col items-center justify-center h-96">
      <div className="flex items-center space-x-4 mb-6">
        <div>
          <DocumentTextIconSolid className="h-8 w-8 text-black" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-black">Content Management</h1>
          <p className="text-gray-600">Select a content option from the sidebar to manage your articles</p>
        </div>
      </div>
      <div className="space-y-2 text-sm text-gray-500">
        <p>• My Content - View and manage your articles</p>
        <p>• Review Queue - Review pending articles</p>
      </div>
    </div>
  );
};

export default Articles;
