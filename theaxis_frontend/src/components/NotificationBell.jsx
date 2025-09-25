import React, { createContext, useContext, useState, useEffect } from 'react';
import { BellIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../services/api';

// Notification Context
const NotificationContext = createContext();

// Notification Provider
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications from backend API
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications?limit=50');
      const notificationData = response.data.data;
      
      setNotifications(notificationData.notifications || []);
      setUnreadCount(notificationData.notifications?.filter(n => !n.isRead).length || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // Fallback to localStorage if API fails
      const savedNotifications = localStorage.getItem('notifications');
      if (savedNotifications) {
        const parsed = JSON.parse(savedNotifications);
        setNotifications(parsed);
        setUnreadCount(parsed.filter(n => !n.read).length);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch unread count
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/notifications/unread-count');
      setUnreadCount(response.data.data.count || 0);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  };

  // Load notifications on mount
  useEffect(() => {
    fetchNotifications();
    
    // Set up real-time notification stream
    const setupRealtimeNotifications = () => {
      const token = localStorage.getItem('token');
      if (!token) return;

      // EventSource doesn't support custom headers, so we pass the token as a query parameter
      const eventSource = new EventSource(`http://localhost:3001/api/realtime/stream?token=${encodeURIComponent(token)}`);

      eventSource.onopen = () => {
        console.log('Connected to real-time notification stream');
      };

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'notification') {
            // Add new notification to the list
            setNotifications(prev => [data.notification, ...prev]);
            setUnreadCount(prev => prev + 1);
            
            // Show browser notification if permission is granted
            if (Notification.permission === 'granted') {
              new Notification(data.notification.title, {
                body: data.notification.message,
                icon: '/favicon.ico'
              });
            }
          } else if (data.type === 'heartbeat') {
            // Keep connection alive
            console.log('Heartbeat received');
          }
        } catch (error) {
          console.error('Error parsing real-time notification:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('Real-time notification stream error:', error);
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (eventSource.readyState === EventSource.CLOSED) {
            setupRealtimeNotifications();
          }
        }, 5000);
      };

      // Store event source for cleanup
      return eventSource;
    };

    const eventSource = setupRealtimeNotifications();

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Cleanup on unmount
    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === id 
            ? { ...notification, isRead: true }
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  // Refresh notifications
  const refreshNotifications = () => {
    fetchNotifications();
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refreshNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Bell Component
export const NotificationBell = () => {
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);

  const handleBellClick = () => {
    setIsOpen(!isOpen);
    // Refresh notifications when opening
    if (!isOpen) {
      refreshNotifications();
    }
  };

  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    // You can add navigation logic here if needed
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'ARTICLE_SUBMITTED':
        return '📝';
      case 'ARTICLE_APPROVED':
        return '✅';
      case 'ARTICLE_REJECTED':
        return '❌';
      case 'ARTICLE_PUBLISHED':
        return '🎉';
      case 'COMMENT_APPROVED':
        return '💬';
      case 'COMMENT_REJECTED':
        return '🚫';
      case 'INFO':
        return 'ℹ️';
      case 'SUCCESS':
        return '✅';
      case 'WARNING':
        return '⚠️';
      case 'ERROR':
        return '❌';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'ARTICLE_SUBMITTED':
        return 'text-blue-600';
      case 'ARTICLE_APPROVED':
        return 'text-green-600';
      case 'ARTICLE_REJECTED':
        return 'text-red-600';
      case 'ARTICLE_PUBLISHED':
        return 'text-purple-600';
      case 'COMMENT_APPROVED':
        return 'text-green-600';
      case 'COMMENT_REJECTED':
        return 'text-red-600';
      case 'SUCCESS':
        return 'text-green-600';
      case 'WARNING':
        return 'text-orange-600';
      case 'ERROR':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={handleBellClick}
        className="notification-bell"
        title="Notifications"
        style={{ color: 'white' }}
      >
        <BellIcon className="bell-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="notification-dropdown">
          {/* Header */}
          <div className="notification-header">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <BellIcon className="w-4 h-4 text-white" />
                </div>
                <h3 className="notification-title">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200 min-h-[32px] min-w-[32px] flex items-center justify-center"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Notifications List */}
          <div className="notification-list">
            {loading ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
                <p className="text-gray-500 font-medium">Loading notifications...</p>
              </div>
            ) : notifications.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <BellIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No notifications yet</p>
                <p className="text-gray-400 text-sm mt-1">We'll notify you when something happens</p>
              </div>
            ) : (
              notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${
                      notification.type === 'ARTICLE_APPROVED' ? 'bg-gradient-to-r from-green-100 to-emerald-100' :
                      notification.type === 'ARTICLE_REJECTED' ? 'bg-gradient-to-r from-red-100 to-pink-100' :
                      notification.type === 'ARTICLE_SUBMITTED' ? 'bg-gradient-to-r from-blue-100 to-cyan-100' :
                      notification.type === 'ARTICLE_PUBLISHED' ? 'bg-gradient-to-r from-purple-100 to-pink-100' :
                      notification.type === 'COMMENT_APPROVED' ? 'bg-gradient-to-r from-green-100 to-emerald-100' :
                      notification.type === 'COMMENT_REJECTED' ? 'bg-gradient-to-r from-red-100 to-pink-100' :
                      'bg-gradient-to-r from-gray-100 to-gray-200'
                    }`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className={`text-sm font-semibold ${getNotificationColor(notification.type)} leading-tight`}>
                          {notification.title}
                        </h4>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs text-gray-500 font-medium">
                            {formatTimestamp(notification.createdAt)}
                          </span>
                          {!notification.isRead && (
                            <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2 leading-relaxed">
                        {notification.message}
                      </p>
                      {notification.data?.articleTitle && (
                        <div className="mt-2 px-3 py-2 bg-gray-50/80 rounded-lg border border-gray-200/50">
                          <p className="text-xs text-gray-600 font-medium">
                            📄 {notification.data.articleTitle}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="notification-footer">
              <button
                onClick={markAllAsRead}
                className="notification-mark-all"
              >
                Mark all as read
              </button>
            </div>
          )}
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

export default NotificationBell;
