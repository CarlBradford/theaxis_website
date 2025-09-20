import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  XMarkIcon, 
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import '../styles/flipbook-display.css';

const FlipbookDisplay = ({ flipbook, onClose, onShare }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState(flipbook.status || 'processing');

  useEffect(() => {
    // Simulate loading time for flipbook
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'processing':
        return <ClockIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ClockIcon className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'completed':
        return 'Ready to view';
      case 'processing':
        return 'Processing your flipbook...';
      case 'error':
        return 'Error processing flipbook';
      default:
        return 'Processing...';
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return createPortal(
    <div className="flipbook-modal-overlay">
      <div className="flipbook-modal-container">
        {/* Header */}
        <div className="flipbook-modal-header">
          <div className="flipbook-modal-title-section">
            <DocumentTextIcon className="flipbook-modal-icon" />
            <div>
              <h2 className="flipbook-modal-title">{flipbook.title}</h2>
              <div className="flipbook-modal-meta">
                <span className="flipbook-modal-file-info">
                  {flipbook.file_name} • {flipbook.type ? flipbook.type.replace('_', ' ').toUpperCase() : 'PUBLICATION'}
                </span>
                <span className="flipbook-modal-separator">•</span>
                <span className="flipbook-modal-date">
                  {formatDate(flipbook.created_at)}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flipbook-modal-actions">
            <button
              className="flipbook-modal-close-btn"
              onClick={onClose}
              title="Close"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Status Bar */}
        <div className="flipbook-modal-status-bar">
          <div className="flipbook-modal-status">
            {getStatusIcon()}
            <span className="flipbook-modal-status-text">{getStatusText()}</span>
          </div>
        </div>

        {/* Content */}
        <div className="flipbook-modal-content">
          {isLoading ? (
            <div className="uniform-loading">
              <div className="uniform-spinner-large"></div>
              <p className="uniform-loading-text">
                Preparing your online issue flipbook...
              </p>
              <div className="flipbook-modal-progress">
                <div className="flipbook-modal-progress-bar">
                  <div className="flipbook-modal-progress-fill"></div>
                </div>
                <span className="flipbook-modal-progress-text">Processing...</span>
              </div>
            </div>
          ) : status === 'completed' ? (
            <div className="flipbook-modal-embed-container">
              <div className="flipbook-modal-embed-wrapper">
                <iframe
                  src={flipbook.embed_url}
                  width="100%"
                  height="600px"
                  frameBorder="0"
                  allowFullScreen
                  title={flipbook.title}
                  className="flipbook-modal-iframe"
                />
              </div>
              {flipbook.description && (
                <div className="flipbook-modal-description">
                  <h4 className="flipbook-modal-description-title">Description</h4>
                  <p className="flipbook-modal-description-text">{flipbook.description}</p>
                </div>
              )}
              <div className="flipbook-modal-demo-info">
                <p className="flipbook-modal-demo-note">
                  <strong>Note:</strong> This flipbook is embedded from the provided URL.
                </p>
              </div>
            </div>
          ) : status === 'error' ? (
            <div className="flipbook-modal-error">
              <ExclamationTriangleIcon className="flipbook-modal-error-icon" />
              <h3 className="flipbook-modal-error-title">Processing Failed</h3>
              <p className="flipbook-modal-error-message">
                There was an error processing your flipbook. Please try again or contact support.
              </p>
              <button
                className="flipbook-modal-retry-btn"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="flipbook-modal-processing">
              <ClockIcon className="flipbook-modal-processing-icon" />
              <h3 className="flipbook-modal-processing-title">Still Processing</h3>
              <p className="flipbook-modal-processing-message">
                Your flipbook is still being processed. This may take a few minutes for large files.
              </p>
              <button
                className="flipbook-modal-refresh-btn"
                onClick={() => window.location.reload()}
              >
                Refresh Status
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flipbook-modal-footer">
          <div className="flipbook-modal-footer-info">
            <span className="flipbook-modal-footer-text">
              Online Issue • The AXIS
            </span>
          </div>
          <div className="flipbook-modal-footer-actions">
            <button
              className="flipbook-modal-footer-btn secondary"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FlipbookDisplay;
