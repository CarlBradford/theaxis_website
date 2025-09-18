import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { hasPermission, ROLE_DISPLAY_NAMES } from '../config/permissions';
import { 
  HomeIcon,
  DocumentTextIcon,
  PhotoIcon,
  UserGroupIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  ExclamationTriangleIcon,
  ServerIcon,
  ArchiveBoxIcon,
  TagIcon,
  FolderIcon,
  ChevronDownIcon,
  QuestionMarkCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import '../styles/dashboard.css';
import theaxisLogo from '../assets/theaxis_logo.png';

const Sidebar = () => {
  const { user, hasRole, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear auth state first
    logout();
    // Use setTimeout to ensure the logout completes before navigation
    setTimeout(() => {
      window.location.href = '/';
    }, 100);
  };

  // Define navigation items with permissions
  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      permission: null, // Always visible to authenticated users
    },
    {
      name: 'Users',
      href: '/users',
      icon: UserGroupIcon,
      permission: 'user:read',
    },
    {
      name: 'Content',
      href: '/content',
      icon: DocumentTextIcon,
      permission: 'article:read',
      subItems: [
        {
          name: 'My Content',
          href: '/content/mycontent',
          permission: 'article:read',
          hideForRoles: ['ADVISER'], // Hide for advisers
        },
        {
          name: 'Content Status',
          href: '/content/status',
          permission: 'article:read',
          hideForRoles: ['ADVISER'], // Hide for advisers
        },
        {
          name: 'Review Queue',
          href: '/content/pending',
          permission: 'article:review',
        },
        {
          name: 'Published Content',
          href: '/published-content',
          permission: 'article:publish',
        },
      ]
    },
    {
      name: 'Comments',
      href: '/comments',
      icon: ClipboardDocumentListIcon,
      permission: 'comment:read',
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
      permission: 'analytics:read',
    },
    {
      name: 'Site Settings',
      href: '/settings',
      icon: Cog6ToothIcon,
      permission: 'system:config', // Only visible to EIC and higher roles
    },
  ];

  // Filter navigation items based on user permissions
  const filteredNavigation = navigationItems.filter(item => {
    if (!item.permission) return true;
    return hasPermission(user?.role, item.permission);
  }).map(item => ({
    ...item,
    subItems: item.subItems?.filter(subItem => {
      // Check permission first
      if (subItem.permission && !hasPermission(user?.role, subItem.permission)) {
        return false;
      }
      // Check if item should be hidden for current user's role
      if (subItem.hideForRoles && subItem.hideForRoles.includes(user?.role)) {
        return false;
      }
      return true;
    })
  }));

  const isActive = (href) => {
    return location.pathname === href || location.pathname.startsWith(href + '/');
  };

  const NavItem = ({ item, level = 0 }) => {
    const [isExpanded, setIsExpanded] = React.useState(false);
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isItemActive = isActive(item.href);
    const isSubItemActive = hasSubItems && item.subItems.some(subItem => isActive(subItem.href));
    
    // Keep submenu open if any subitem is active
    const shouldBeExpanded = isExpanded || isSubItemActive;

    const handleMainItemClick = (e) => {
      if (hasSubItems) {
        e.preventDefault();
        setIsExpanded(!isExpanded);
      }
    };

    return (
      <div>
        <Link
          to={item.href}
          className={`nav-item ${isItemActive || isSubItemActive ? 'active' : ''}`}
          onClick={handleMainItemClick}
        >
          <item.icon className="nav-item-icon" />
          <span className="nav-item-text">{item.name}</span>
          {hasSubItems && (
            <ChevronDownIcon
              className={`nav-item-arrow ${shouldBeExpanded ? 'expanded' : ''}`}
            />
          )}
        </Link>
        
        {hasSubItems && shouldBeExpanded && (
          <div className="nav-submenu">
            {item.subItems.map((subItem) => (
              <Link
                key={subItem.href}
                to={subItem.href}
                className={`nav-subitem ${isActive(subItem.href) ? 'active' : ''}`}
              >
                {subItem.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="sidebar-container">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-container">
          <div className="sidebar-logo-icon">
            <img 
              src={theaxisLogo} 
              alt="The AXIS Logo" 
              className="sidebar-logo-image"
            />
          </div>
          <div className="sidebar-logo-text">
            <span className="logo-the">The</span>
            <span className="logo-axis">AXIS</span>
            <span className="logo-group">GROUP OF PUBLICATIONS</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        {filteredNavigation.map((item) => (
          <NavItem key={item.href} item={item} />
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <Link to="/help" className="footer-item">
          <QuestionMarkCircleIcon className="footer-item-icon" />
          Help
        </Link>
        <button className="footer-item" onClick={handleLogout}>
          <ArrowRightOnRectangleIcon className="footer-item-icon" />
          Log Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;