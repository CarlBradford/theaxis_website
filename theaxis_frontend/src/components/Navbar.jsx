import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROLE_DISPLAY_NAMES } from '../config/permissions';
import { 
  Bars3Icon, 
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';
import '../styles/dashboard.css';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location = useLocation();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuOpen && !event.target.closest('.user-profile') && !event.target.closest('.dropdown-menu')) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [userMenuOpen]);

  const handleLogout = () => {
    logout();
  };

  // Get current page title based on location
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/users') return 'Users';
    if (path === '/articles') return 'Content Management';
    if (path === '/articles/my') return 'My Content';
    if (path === '/articles/pending') return 'Review Queue';
    if (path === '/comments') return 'Comments';
    if (path === '/analytics') return 'Analytics';
    if (path === '/settings') return 'Site Settings';
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
          <div className="relative">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setUserMenuOpen(!userMenuOpen);
              }}
              className="user-profile"
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
              <ChevronDownIcon className={`user-dropdown-arrow ${userMenuOpen ? 'open' : ''}`} />
            </button>
            
            {userMenuOpen && (
              <div className="dropdown-menu">
                <Link 
                  to="/profile" 
                  className="dropdown-item"
                  onClick={() => setUserMenuOpen(false)}
                >
                  Profile
                </Link>
                <button 
                  onClick={() => {
                    handleLogout();
                    setUserMenuOpen(false);
                  }}
                  className="dropdown-item"
                >
                  Logout
                </button>
              </div>
            )}
          </div>
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
