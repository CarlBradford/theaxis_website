import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import '../styles/request-revision-modal.css';

const RequestRevisionModal = ({ isOpen, onClose, onConfirm, article, isLoading = false }) => {
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
    <div className="request-revision-modal-overlay">
      <div className="request-revision-modal">
        <div className="request-revision-modal-header">
          <div className="request-revision-modal-icon">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="request-revision-modal-title">Request Revision</h3>
          <button
            onClick={handleClose}
            className="request-revision-modal-close"
            disabled={isLoading}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="request-revision-modal-content">
          <div className="request-revision-article-info">
            <h4 className="request-revision-article-title">{article?.title}</h4>
            <p className="request-revision-article-meta">
              Author: {article?.author} • Category: {article?.category}
            </p>
          </div>
          
          <div className="request-revision-feedback-section">
            <label htmlFor="revision-feedback" className="request-revision-label">
              Revision Feedback <span className="required">*</span>
            </label>
            <textarea
              id="revision-feedback"
              className={`request-revision-textarea ${errors.feedback ? 'error' : ''}`}
              value={feedback}
              onChange={(e) => {
                setFeedback(e.target.value);
                if (errors.feedback) {
                  setErrors(prev => ({ ...prev, feedback: '' }));
                }
              }}
              placeholder="Please provide specific feedback on what needs to be revised..."
              rows={4}
              disabled={isLoading}
              maxLength={1000}
            />
            {errors.feedback && (
              <p className="request-revision-error">{errors.feedback}</p>
            )}
            <div className="request-revision-char-count">
              {feedback.length}/1000 characters
            </div>
          </div>
          
          <div className="request-revision-note">
            <p className="request-revision-note-text">
              This will send the article back to the author for revision. The article will move to "Needs Revision" status.
            </p>
          </div>
        </form>
        
        <div className="request-revision-modal-buttons">
          <button
            type="button"
            onClick={handleClose}
            className="request-revision-modal-button cancel"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="request-revision-modal-button submit"
            disabled={isLoading || !feedback.trim()}
          >
            {isLoading ? (
              <>
                <div className="request-revision-spinner"></div>
                Sending...
              </>
            ) : (
              'Send for Revision'
            )}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default RequestRevisionModal;
