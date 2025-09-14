import React from 'react';
import { createPortal } from 'react-dom';
import '../styles/resubmit-modal.css';

const ResubmitModal = ({ isOpen, onClose, onConfirm, article, isLoading = false }) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="resubmit-modal-overlay">
      <div className="resubmit-modal">
        <div className="resubmit-modal-header">
          <div className="resubmit-modal-icon">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <h3 className="resubmit-modal-title">Resubmit Article</h3>
          <button
            onClick={handleClose}
            className="resubmit-modal-close"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="resubmit-modal-content">
          <div className="resubmit-modal-article-info">
            <h4 className="resubmit-modal-article-title">{article?.title}</h4>
            <p className="resubmit-modal-article-details">
              Author: {article?.author} • Category: {article?.category}
            </p>
          </div>
          
          <div className="resubmit-modal-message">
            <p className="resubmit-modal-warning-text">
              Are you sure you want to resubmit this article for review?
            </p>
            <p className="resubmit-modal-note">
              This will change the article status from "Needs Revision" to "In Review" and send it back to the reviewer's queue.
            </p>
          </div>
          
          <div className="resubmit-modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="resubmit-modal-btn-cancel"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="resubmit-modal-btn-confirm"
              disabled={isLoading}
            >
              {isLoading ? 'Resubmitting...' : 'Resubmit Article'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ResubmitModal;
