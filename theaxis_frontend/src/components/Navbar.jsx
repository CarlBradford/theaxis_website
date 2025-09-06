import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bars3Icon, 
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { useState } from 'react';

const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-blue-600 rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-sm">A</span>
              </div>
              <h1 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">The AXIS</h1>
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link 
              to="/articles" 
              className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
            >
              Articles
            </Link>
            
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/dashboard" 
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <div className="relative">
                  <button className="flex items-center space-x-2 text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                    <UserCircleIcon className="h-5 w-5" />
                    <span>{user?.firstName} {user?.lastName}</span>
                  </button>
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10">
                    <Link 
                      to="/profile" 
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Profile
                    </Link>
                    <button 
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="btn-primary text-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-gray-700 hover:text-blue-600 p-2"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-gray-200">
            <Link 
              to="/articles" 
              className="block px-3 py-2 text-gray-700 hover:text-blue-600"
            >
              Articles
            </Link>
            
            {isAuthenticated ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  Dashboard
                </Link>
                <Link 
                  to="/profile" 
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  Profile
                </Link>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block px-3 py-2 text-gray-700 hover:text-blue-600"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
