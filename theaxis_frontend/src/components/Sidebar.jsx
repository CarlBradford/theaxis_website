import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  HomeIcon,
  DocumentTextIcon,
  PhotoIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const { user, hasRole } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Articles', href: '/articles', icon: DocumentTextIcon },
    ...(hasRole('STAFF') ? [{ name: 'Media', href: '/media', icon: PhotoIcon }] : []),
    ...(hasRole('SECTION_HEAD') ? [{ name: 'Users', href: '/users', icon: UserGroupIcon }] : []),
    ...(hasRole('EDITOR_IN_CHIEF') ? [{ name: 'Analytics', href: '/analytics', icon: ChartBarIcon }] : []),
    { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
  ];

  return (
    <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
      <div className="flex-1 flex flex-col min-h-0 bg-white/80 backdrop-blur-md border-r border-gray-100">
        <div className="flex-1 flex flex-col pt-6 pb-4 overflow-y-auto">
          <nav className="mt-5 flex-1 px-2 space-y-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`${
                    isActive
                      ? 'bg-primary-100 text-primary-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                >
                  <item.icon
                    className={`${
                      isActive ? 'text-primary-500' : 'text-gray-400 group-hover:text-gray-500'
                    } mr-3 flex-shrink-0 h-6 w-6`}
                    aria-hidden="true"
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
        
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-gray-500 capitalize">
                {user?.role?.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
