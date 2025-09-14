import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/return-to-section-modal.css';

const ReturnToSectionModal = ({ isOpen, onClose, onConfirm, article, isLoading = false }) => {
  const [feedback, setFeedback] = useState('');
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validation
    const newErrors = {};
    if (!feedback.trim()) {
      newErrors.feedback = 'Feedback is required';
    } else if (feedback.trim().length < 10) {
      newErrors.feedback = 'Feedback must be at least 10 characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onConfirm(feedback.trim());
  };

  const handleClose = () => {
    setFeedback('');
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="return-to-section-modal-overlay">
      <div className="return-to-section-modal">
        <div className="return-to-section-modal-header">
          <div className="return-to-section-modal-icon">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <h3 className="return-to-section-modal-title">Return to Section Head</h3>
          <button
            onClick={handleClose}
            className="return-to-section-modal-close"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="return-to-section-modal-content">
          <div className="return-to-section-modal-article-info">
            <h4 className="return-to-section-modal-article-title">{article?.title}</h4>
            <p className="return-to-section-modal-article-details">
              Author: {article?.author} • Category: {article?.category}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="return-to-section-modal-form">
            <div className="return-to-section-modal-form-group">
              <label htmlFor="feedback" className="return-to-section-modal-label">
                Feedback for Section Head
              </label>
              <textarea
                id="feedback"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Please provide feedback on why this article is being returned to the section head..."
                className={`return-to-section-modal-textarea ${errors.feedback ? 'error' : ''}`}
                rows={4}
                disabled={isLoading}
              />
              {errors.feedback && (
                <p className="return-to-section-modal-error">{errors.feedback}</p>
              )}
            </div>
            
            <div className="return-to-section-modal-actions">
              <button
                type="button"
                onClick={handleClose}
                className="return-to-section-modal-btn-cancel"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="return-to-section-modal-btn-confirm"
                disabled={isLoading}
              >
                {isLoading ? 'Returning...' : 'Return to Section Head'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ReturnToSectionModal;
