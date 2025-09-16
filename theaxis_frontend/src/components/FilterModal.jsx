import React from 'react';
import { createPortal } from 'react-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

const FilterModal = ({ 
  isOpen, 
  onClose, 
  title = "Filter Options",
  children,
  onApply,
  onClear,
  showClearButton = true,
  showApplyButton = true,
  layout = "grid" // "grid" or "vertical"
}) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleApply = () => {
    if (onApply) {
      onApply();
    }
    onClose();
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  return createPortal(
    <div className="filter-modal-overlay" onClick={handleBackdropClick}>
      <div className="filter-modal">
        <div className="filter-modal-header">
          <h3 className="filter-modal-title">{title}</h3>
          <button
            onClick={onClose}
            className="filter-modal-close"
            title="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        
        <div className="filter-modal-content">
          <div className={`filter-modal-sections-grid ${layout === "vertical" ? "vertical-layout" : ""}`}>
            {children}
          </div>
        </div>
        
        <div className="filter-modal-footer">
          {showClearButton && (
            <button
              onClick={handleClear}
              className="filter-modal-button filter-modal-button-clear"
            >
              Clear All
            </button>
          )}
          {showApplyButton && (
            <button
              onClick={handleApply}
              className="filter-modal-button filter-modal-button-apply"
            >
              Apply Filters
            </button>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};

export default FilterModal;