import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const PublishConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  articleTitle = "Untitled Article"
}) => {
  if (!isOpen) return null;

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
    <div 
      className="publish-confirm-backdrop" 
      onClick={handleBackdropClick}
    >
      <div className="publish-confirm-modal">
        <div className="publish-confirm-header">
          <h3 className="publish-confirm-title">Publish Article</h3>
          <button
            onClick={onClose}
            className="publish-confirm-close"
            title="Close"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        
        <div className="publish-confirm-content">
          <p className="publish-confirm-message">
            Are you sure you want to publish "{articleTitle}"? This will make it visible to all users.
          </p>
        </div>
        
        <div className="publish-confirm-actions">
          <button
            onClick={onClose}
            className="publish-confirm-btn-cancel"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="publish-confirm-btn-confirm"
          >
            Publish
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PublishConfirmationModal;