import { Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Navbar />
      <div className="flex">
        {isAuthenticated && <Sidebar />}
        <main className={`flex-1 p-8 transition-all duration-300 ${isAuthenticated ? 'md:ml-64' : ''}`}>
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
