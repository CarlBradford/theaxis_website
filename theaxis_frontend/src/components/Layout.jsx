import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../styles/navbar-sidebar.css';
import React from 'react';

const Layout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Define public/reader routes where navbar and sidebar should be hidden
  const publicRoutes = [
    '/',
    '/admin-portal',
    '/forgot-password',
    '/reset-password',
    '/login-debug', 
    '/health-check'
  ];
  
  // Check if current route is a public route
  const isPublicRoute = publicRoutes.includes(location.pathname);
  
  // Hide navbar and sidebar on public routes
  const hideNavbar = isPublicRoute;
  const hideSidebar = isPublicRoute;

  // Detect mobile viewport to conditionally adjust padding for specific pages
  const [isMobile, setIsMobile] = React.useState(false);
  React.useEffect(() => {
    const updateIsMobile = () => setIsMobile(window.innerWidth <= 768);
    updateIsMobile();
    window.addEventListener('resize', updateIsMobile);
    return () => window.removeEventListener('resize', updateIsMobile);
  }, []);

  const isFeaturedPage = location.pathname.toLowerCase().includes('featured');
  const isProfilePage = location.pathname.toLowerCase().startsWith('/profile');
  const isUserManagementPage = location.pathname.toLowerCase().startsWith('/users');
  const isCommentManagementPage = location.pathname.toLowerCase().startsWith('/comments');
  const isSettingsPage = location.pathname.toLowerCase().startsWith('/settings');

  return (
    <div className="min-h-screen">
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? '' : 'flex'}>
        {isAuthenticated && !hideSidebar && <Sidebar />}
        <main className={`main-content ${hideNavbar ? 'w-full ml-0 mt-0' : ''}`}>
          <div className={`${!hideNavbar && !(isMobile && (isFeaturedPage || isProfilePage || isUserManagementPage || isCommentManagementPage || isSettingsPage)) ? 'p-8' : ''} ${location.pathname === '/dashboard' ? 'dashboard-content-wrapper' : ''} ${isFeaturedPage ? 'featured-content-wrapper' : ''} ${isUserManagementPage ? 'user-management-content-wrapper' : ''} ${isCommentManagementPage ? 'comment-management-content-wrapper' : ''} ${isSettingsPage ? 'settings-content-wrapper' : ''}`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
