import React from 'react';
import { createPortal } from 'react-dom';
import { CheckCircleIcon, XCircleIcon, ExclamationTriangleIcon, InformationCircleIcon } from '@heroicons/react/24/outline';

const NotificationModal = ({ 
  isOpen, 
  onClose, 
  title, 
  message, 
  type = 'success', // success, error, warning, info
  duration = 3000 // Auto-close duration in ms, 0 = no auto-close
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'error':
        return <XCircleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-green-50 border-green-200';
    }
  };

  const getTextColor = () => {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-green-800';
    }
  };

  const getButtonColor = () => {
    switch (type) {
      case 'success':
        return 'mycontent-notif-btn-success';
      case 'error':
        return 'mycontent-notif-btn-error';
      case 'warning':
        return 'mycontent-notif-btn-warning';
      case 'info':
        return 'mycontent-notif-btn-info';
      default:
        return 'mycontent-notif-btn-success';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Auto-close functionality
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return createPortal(
    <div className="mycontent-notif-backdrop" onClick={handleBackdropClick}>
      <div className={`mycontent-notif-modal ${getBackgroundColor()} ${getTextColor()}`}>
        <div className="mycontent-notif-content">
          <div className="mycontent-notif-icon">
            {getIcon()}
          </div>
          
          <div className="mycontent-notif-text">
            {title && (
              <h3 className="mycontent-notif-title">{title}</h3>
            )}
            <p className="mycontent-notif-message">{message}</p>
          </div>
        </div>
        
        <div className="mycontent-notif-actions">
          <button
            onClick={onClose}
            className={getButtonColor()}
          >
            OK
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default NotificationModal;
