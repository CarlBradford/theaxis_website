import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { ROLE_DISPLAY_NAMES } from '../config/permissions';
import { NotificationBell } from './NotificationBell';
import api from '../services/api';
import '../styles/navbar-sidebar.css';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();
  const [profileImage, setProfileImage] = useState(null);

  // Fetch user profile image
  useEffect(() => {
    if (isAuthenticated && user) {
      fetchProfileImage();
    }
  }, [isAuthenticated, user]);

  const fetchProfileImage = async () => {
    try {
      const response = await api.get('/users/profile');
      const userData = response.data.data;
      if (userData.profileImage) {
        const imageUrl = userData.profileImage.startsWith('http') 
          ? userData.profileImage 
          : `${import.meta.env.VITE_API_URL || 'http://localhost:3001'}${userData.profileImage}`;
        setProfileImage(imageUrl);
      }
    } catch (error) {
      console.error('Failed to fetch profile image:', error);
    }
  };

  // Get current page title based on location
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/users') return 'Users';
    if (path === '/content') return 'Content Management';
    if (path === '/content/mycontent') return 'My Content';
    if (path === '/content/status') return 'Content Status';
    if (path === '/comments') return 'Comments';
    if (path === '/analytics') return 'Analytics';
    if (path === '/settings') return 'Site Settings';
    if (path === '/profile') return 'Profile';
    return 'Dashboard';
  };

  return (
    <nav className="navbar-container">
      {/* Page Title */}
      <h1 className="navbar-title">
        {getPageTitle()}
      </h1>

      {/* Right side - Notifications and User Profile */}
      <div className="navbar-right">
        {/* Notifications */}
        {isAuthenticated && <NotificationBell />}
        
        {/* User Profile */}
        {isAuthenticated ? (
          <Link 
            to="/profile" 
            className={`user-profile ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            <div className="user-avatar">
              {profileImage ? (
                <img 
                  src={profileImage} 
                  alt={`${user?.firstName} ${user?.lastName}`}
                  className="user-avatar-image"
                />
              ) : (
                <span className="user-avatar-initials">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              )}
            </div>
            <div className="user-info">
              <p className="user-name">{user?.firstName} {user?.lastName}</p>
              <p className="user-role">
                {ROLE_DISPLAY_NAMES[user?.role] || user?.role}
              </p>
            </div>
          </Link>
        ) : (
          <Link 
            to="/login" 
            className="dropdown-item"
          >
            Login
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
