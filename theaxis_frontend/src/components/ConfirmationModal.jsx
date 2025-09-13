import { createPortal } from 'react-dom';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed?", 
  confirmText = "Confirm", 
  cancelText = "Cancel",
  type = "warning" // warning, danger, info
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <ExclamationTriangleIcon className="h-6 w-6 text-red-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'info':
        return <ExclamationTriangleIcon className="h-6 w-6 text-blue-500" />;
      default:
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'mycontent-confirm-btn-danger';
      case 'warning':
        return 'mycontent-confirm-btn-warning';
      case 'info':
        return 'mycontent-confirm-btn-info';
      default:
        return 'mycontent-confirm-btn-warning';
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return createPortal(
    <div className="mycontent-confirm-backdrop" onClick={handleBackdropClick}>
      <div className="mycontent-confirm-modal">
        <div className="mycontent-confirm-header">
          <div className="mycontent-confirm-icon">
            {getIcon()}
          </div>
          <button
            onClick={onClose}
            className="mycontent-confirm-close"
            title="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="mycontent-confirm-content">
          <h3 className="mycontent-confirm-title">{title}</h3>
          <p className="mycontent-confirm-message">{message}</p>
        </div>
        
        <div className="mycontent-confirm-actions">
          <button
            onClick={handleConfirm}
            className={getConfirmButtonClass()}
          >
            {confirmText}
          </button>
          <button
            onClick={onClose}
            className="mycontent-confirm-btn-cancel"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;
