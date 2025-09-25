import React from 'react';
import { createPortal } from 'react-dom';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import '../styles/confirmation-modal.css';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning", // warning, danger, info, success
  isLoading = false
}) => {
  console.log('🔍 ConfirmationModal render:', { isOpen, title, type });
  
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleConfirm = () => {
    onConfirm();
  };

  const getIconColor = () => {
    switch (type) {
      case 'danger':
        return '#ef4444';
      case 'success':
        return '#10b981';
      case 'info':
        return '#3b82f6';
      case 'warning':
      default:
        return '#f59e0b';
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'danger':
        return 'confirmation-modal-btn-danger';
      case 'success':
        return 'confirmation-modal-btn-success';
      case 'info':
        return 'confirmation-modal-btn-info';
      case 'warning':
      default:
        return 'confirmation-modal-btn-warning';
    }
  };

  return createPortal(
    <div className="confirmation-modal-backdrop" onClick={handleBackdropClick}>
      <div className="confirmation-modal">
        <div className="confirmation-modal-header">
          <div className="confirmation-modal-header-left">
            <div className="confirmation-modal-icon">
              <ExclamationTriangleIcon 
                style={{ color: getIconColor() }}
                className="confirmation-modal-icon-svg"
              />
            </div>
            <h3 className="confirmation-modal-title">{title}</h3>
          </div>
          <button
            className="confirmation-modal-close"
            onClick={onClose}
            disabled={isLoading}
          >
            <XMarkIcon className="confirmation-modal-close-icon" />
          </button>
        </div>

        <div className="confirmation-modal-content">
          <p className="confirmation-modal-message">{message}</p>
        </div>

        <div className="confirmation-modal-actions">
          <button
            className="confirmation-modal-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </button>
          <button
            className={`confirmation-modal-btn-confirm ${getConfirmButtonClass()}`}
            onClick={handleConfirm}
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="confirmation-modal-spinner">
                <div className="confirmation-modal-spinner-circle"></div>
                <span>Processing...</span>
              </div>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmationModal;