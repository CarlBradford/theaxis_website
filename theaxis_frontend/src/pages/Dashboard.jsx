import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { ROLE_DISPLAY_NAMES, ROLE_DESCRIPTIONS } from '../config/permissions';

// System Admin Dashboard
const SystemAdminDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">System Administration</h2>
        <p className="text-red-100">Full system control and configuration access</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
          <p className="text-gray-600 text-sm mb-4">Manage all user accounts and roles</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Manage Users
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
          <p className="text-gray-600 text-sm mb-4">Configure system-wide settings</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            System Config
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Audit Logs</h3>
          <p className="text-gray-600 text-sm mb-4">View system activity and logs</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            View Logs
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Backup & Restore</h3>
          <p className="text-gray-600 text-sm mb-4">Manage system backups</p>
          <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
            Backup System
          </button>
        </div>
      </div>
    </div>
  );
};

// Adviser Dashboard
const AdviserDashboard = () => {
    return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Adviser Dashboard</h2>
        <p className="text-blue-100">Oversight and strategic guidance for the publication</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
          <p className="text-gray-600 text-sm mb-4">Create and manage user accounts</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Manage Users
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Article Review</h3>
          <p className="text-gray-600 text-sm mb-4">Review and provide feedback on articles</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Review Articles
          </button>
            </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-gray-600 text-sm mb-4">View publication analytics and insights</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            View Analytics
          </button>
        </div>
        </div>
      </div>
    );
};

// Editor-in-Chief Dashboard
const EditorInChiefDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Editor-in-Chief Dashboard</h2>
        <p className="text-green-100">Full editorial control and content management</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Content Management</h3>
          <p className="text-gray-600 text-sm mb-4">Create, edit, and publish articles</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Manage Content
          </button>
            </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
          <p className="text-gray-600 text-sm mb-4">Manage editorial team members</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Manage Users
          </button>
            </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Categories & Tags</h3>
          <p className="text-gray-600 text-sm mb-4">Organize content structure</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Manage Categories
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Announcements</h3>
          <p className="text-gray-600 text-sm mb-4">Create and manage announcements</p>
          <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
            Manage Announcements
          </button>
            </div>
            </div>
          </div>
  );
};

// Section Head Dashboard
const SectionHeadDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Section Head Dashboard</h2>
        <p className="text-purple-100">Manage your section and review submissions</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Staff Management</h3>
          <p className="text-gray-600 text-sm mb-4">Manage publication staff accounts</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Manage Staff
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Article Review</h3>
          <p className="text-gray-600 text-sm mb-4">Review and approve staff submissions</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Review Articles
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
          <p className="text-gray-600 text-sm mb-4">View section performance metrics</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            View Analytics
          </button>
            </div>
            </div>
          </div>
  );
};

// Publication Staff Dashboard
const PublicationStaffDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Publication Staff Dashboard</h2>
        <p className="text-indigo-100">Create content and manage your submissions</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Create Article</h3>
          <p className="text-gray-600 text-sm mb-4">Write and submit new articles</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            New Article
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">My Articles</h3>
          <p className="text-gray-600 text-sm mb-4">View and edit your submissions</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            View Articles
          </button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Media Library</h3>
          <p className="text-gray-600 text-sm mb-4">Upload and manage media files</p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Manage Media
          </button>
            </div>
          </div>
        </div>
  );
};

// Reader Dashboard
const ReaderDashboard = () => {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-gray-500 to-gray-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">Reader Dashboard</h2>
        <p className="text-gray-100">Access articles and announcements</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Latest Articles</h3>
          <p className="text-gray-600 text-sm mb-4">Read the newest publications</p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Browse Articles
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Announcements</h3>
          <p className="text-gray-600 text-sm mb-4">View important announcements</p>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            View Announcements
          </button>
        </div>
      </div>
    </div>
  );
};

// Main Dashboard Component
const Dashboard = () => {
  const { user } = useAuth();

  const renderDashboard = () => {
    switch (user?.role) {
      case 'SYSTEM_ADMIN':
        return <SystemAdminDashboard />;
      case 'ADVISER':
        return <AdviserDashboard />;
      case 'EDITOR_IN_CHIEF':
        return <EditorInChiefDashboard />;
      case 'SECTION_HEAD':
        return <SectionHeadDashboard />;
      case 'STAFF':
        return <PublicationStaffDashboard />;
      case 'READER':
        return <ReaderDashboard />;
      default:
        return <ReaderDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {user?.firstName}!
            </h1>
            <p className="mt-2 text-gray-600">
              {ROLE_DESCRIPTIONS[user?.role] || 'Access your dashboard'}
            </p>
          </div>
          
          {renderDashboard()}
          </div>
      </div>
    </div>
  );
};

export default Dashboard;