import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_DISPLAY_NAMES } from '../config/permissions';
import '../styles/dashboard.css';

const Navbar = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

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

      {/* Right side - User Profile */}
      <div className="navbar-right">
        {/* User Profile */}
        {isAuthenticated ? (
          <Link 
            to="/profile" 
            className={`user-profile ${location.pathname === '/profile' ? 'active' : ''}`}
          >
            <div className="user-avatar">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
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
