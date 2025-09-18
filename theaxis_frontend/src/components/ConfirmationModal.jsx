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
    <div className="confirmation-modal-backdrop" onClick={handleBackdropClick} style={{ backgroundColor: 'rgba(0,0,0,0.5)', position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="confirmation-modal" style={{ background: '#ffffff', borderRadius: '12px', padding: '24px', maxWidth: '400px', width: '100%', position: 'relative' }}>
        <div className="confirmation-modal-header">
          <div className="confirmation-modal-icon">
            <ExclamationTriangleIcon 
              style={{ color: getIconColor() }}
              className="confirmation-modal-icon-svg"
            />
          </div>
          <button
            className="confirmation-modal-close"
            onClick={onClose}
            disabled={isLoading}
          >
            <XMarkIcon className="confirmation-modal-close-icon" />
          </button>
        </div>

        <div className="confirmation-modal-content" style={{ padding: '0 0 24px 0' }}>
          <h3 className="confirmation-modal-title" style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 12px 0' }}>{title}</h3>
          <p className="confirmation-modal-message" style={{ fontSize: '14px', color: '#6b7280', margin: '0' }}>{message}</p>
        </div>

        <div className="confirmation-modal-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', alignItems: 'center' }}>
          <button
            className="confirmation-modal-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
            style={{ padding: '10px 20px', backgroundColor: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}
          >
            {cancelText}
          </button>
          <button
            className={`confirmation-modal-btn-confirm ${getConfirmButtonClass()}`}
            onClick={handleConfirm}
            disabled={isLoading}
            style={{ padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '500', cursor: 'pointer', backgroundColor: '#ef4444', color: '#ffffff' }}
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