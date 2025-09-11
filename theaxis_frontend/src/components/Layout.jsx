import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import '../styles/dashboard.css';

const Layout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  
  // Hide navbar on login and register pages
  const hideNavbar = location.pathname === '/login' || location.pathname === '/register';

  return (
    <div className="min-h-screen">
      {!hideNavbar && <Navbar />}
      <div className={hideNavbar ? '' : 'flex'}>
        {isAuthenticated && !hideNavbar && <Sidebar />}
        <main className={`main-content ${hideNavbar ? 'w-full' : ''}`}>
          <div className={hideNavbar ? '' : 'p-8'}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
