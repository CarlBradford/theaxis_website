import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { hasPermission } from '../config/permissions';
import { 
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import '../styles/dashboard.css';

const Settings = () => {
  const { user } = useAuth();

  // Check if user has permission to access settings
  if (!hasPermission(user?.role, 'system:config')) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-content">
          <div className="dashboard-header">
            <div className="dashboard-header-left">
              <div className="flex items-center space-x-4">
                <div>
                  <ShieldCheckIcon className="h-8 w-8 text-red-500" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-black">
                    Access Denied
                  </h1>
                  <p className="text-gray-600">You don't have permission to access site settings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header Section - Matching Dashboard Design */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <div className="flex items-center space-x-4">
              <div>
                <ShieldCheckIcon className="h-8 w-8 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">
                  Site Settings
                </h1>
                <p className="text-gray-600">Manage website configuration and settings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="dashboard-main-content">
          <div className="settings-placeholder">
            <h3>Settings Coming Soon</h3>
            <p>Additional site configuration options will be available here.</p>
            <p>Color customization is now available in your <a href="/profile" className="text-blue-600 hover:text-blue-800">Profile</a> page.</p>
          </div>
        </div>
      </div>
    </div>
  );
};


export default Settings;
