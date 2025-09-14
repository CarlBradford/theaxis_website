import React from 'react';
import { createPortal } from 'react-dom';
import '../styles/success-modal.css';

const SuccessModal = ({ isOpen, onClose, title, message, buttonText = "OK" }) => {
  if (!isOpen) return null;

  return createPortal(
    <div className="success-modal-overlay">
      <div className="success-modal">
        <div className="success-modal-header">
          <div className="success-modal-icon">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="success-modal-title">{title}</h3>
          <button
            onClick={onClose}
            className="success-modal-close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="success-modal-content">
          <p className="success-modal-message">{message}</p>
        </div>
        
        <div className="success-modal-buttons">
          <button
            onClick={onClose}
            className="success-modal-button"
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default SuccessModal;
