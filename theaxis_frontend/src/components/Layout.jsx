import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../styles/navbar-sidebar.css';

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

  return (
    <div className="min-h-screen">
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? '' : 'flex'}>
        {isAuthenticated && !hideSidebar && <Sidebar />}
        <main className={`main-content ${hideNavbar ? 'w-full ml-0 mt-0' : ''}`}>
          <div className={hideNavbar ? '' : 'p-8'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
