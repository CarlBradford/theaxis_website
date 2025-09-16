import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { 
  XMarkIcon, 
  DocumentTextIcon,
  LinkIcon,
  TagIcon,
  CalendarIcon,
  EyeIcon
} from '@heroicons/react/24/outline';
import '../styles/flipbook-input-form.css';

const FlipbookInputForm = ({ isOpen, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    name: '',
    embedLink: '',
    type: 'magazine',
    releaseDate: new Date().toISOString().split('T')[0]
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const publicationTypes = [
    { value: 'newsletter', label: 'Newsletter' },
    { value: 'tabloid', label: 'Tabloid' },
    { value: 'magazine', label: 'Magazine' },
    { value: 'literary_folio', label: 'Literary Folio' },
    { value: 'art_compilation', label: 'Art Compilation' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }

  };

  const validateForm = () => {
    const newErrors = {};

    // Validate publication name
    if (!formData.name.trim()) {
      newErrors.name = 'Publication name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Publication name must be at least 3 characters';
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Publication name must be less than 100 characters';
    }

    // Validate embed link
    if (!formData.embedLink.trim()) {
      newErrors.embedLink = 'Embed link is required';
    } else if (!isValidUrl(formData.embedLink)) {
      newErrors.embedLink = 'Please enter a valid URL';
    } else if (!isValidFlipbookUrl(formData.embedLink)) {
      newErrors.embedLink = 'Please enter a valid FlipHTML5 or flipbook URL';
    }

    // Validate publication type
    if (!formData.type) {
      newErrors.type = 'Publication type is required';
    }

    // Validate release date (optional but if provided, check it's not in the future by more than 1 year)
    if (formData.releaseDate) {
      const releaseDate = new Date(formData.releaseDate);
      const today = new Date();
      const oneYearFromNow = new Date();
      oneYearFromNow.setFullYear(today.getFullYear() + 1);
      
      if (releaseDate > oneYearFromNow) {
        newErrors.releaseDate = 'Release date cannot be more than 1 year in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidUrl = (string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const isValidFlipbookUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      
      // Check for common flipbook platforms
      const validHosts = [
        'fliphtml5.com',
        'www.fliphtml5.com',
        'flipbuilder.com',
        'www.flipbuilder.com',
        'issuu.com',
        'www.issuu.com',
        'calameo.com',
        'www.calameo.com',
        'yumpu.com',
        'www.yumpu.com'
      ];
      
      return validHosts.some(host => hostname.includes(host));
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      setSubmitError(error.message || 'Failed to publish online issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      embedLink: '',
      type: 'magazine',
      releaseDate: new Date().toISOString().split('T')[0]
    });
    setErrors({});
    setSubmitError('');
    setIsSubmitting(false);
    onClose();
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="flipbook-form-overlay" onClick={handleBackdropClick}>
      <div className="flipbook-form-container">
        {/* Header */}
        <div className="flipbook-form-header">
          <div className="flipbook-form-title-section">
            <DocumentTextIcon className="flipbook-form-icon" />
            <div>
              <h2 className="flipbook-form-title">Publish Online Issue</h2>
              <p className="flipbook-form-subtitle">Enter publication details and embed link</p>
            </div>
          </div>
          
          <button
            className="flipbook-form-close-btn"
            onClick={handleClose}
            title="Close"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flipbook-form-content">
          <div className="flipbook-form-grid">
            {/* First Column */}
            <div className="flipbook-form-column">
              {/* Publication Name */}
              <div className="flipbook-form-field">
                <label htmlFor="name" className="flipbook-form-label">
                  <DocumentTextIcon className="w-4 h-4" />
                  Publication Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className={`flipbook-form-input ${errors.name ? 'error' : ''}`}
                  placeholder="e.g., The Axis Magazine Issue 2024"
                  required
                />
                {errors.name && <span className="flipbook-form-error">{errors.name}</span>}
              </div>

              {/* Publication Type */}
              <div className="flipbook-form-field">
                <label htmlFor="type" className="flipbook-form-label">
                  <TagIcon className="w-4 h-4" />
                  Publication Type *
                </label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className={`flipbook-form-select ${errors.type ? 'error' : ''}`}
                  required
                >
                  {publicationTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                {errors.type && <span className="flipbook-form-error">{errors.type}</span>}
              </div>
            </div>

            {/* Second Column */}
            <div className="flipbook-form-column">
               {/* Embed Link */}
               <div className="flipbook-form-field">
                 <label htmlFor="embedLink" className="flipbook-form-label">
                   <LinkIcon className="w-4 h-4" />
                   Embed Link *
                 </label>
                 <div className="flipbook-form-input-group">
                   <input
                     type="url"
                     id="embedLink"
                     name="embedLink"
                     value={formData.embedLink}
                     onChange={handleInputChange}
                     className={`flipbook-form-input ${errors.embedLink ? 'error' : ''}`}
                     placeholder="https://fliphtml5.com/book/your-flipbook-id"
                     required
                   />
                   {formData.embedLink.trim() && isValidUrl(formData.embedLink) && isValidFlipbookUrl(formData.embedLink) && (
                     <a
                       href={formData.embedLink}
                       data-rel="fh5-light-box-demo"
                       data-href={formData.embedLink}
                       data-width="800"
                       data-height="600"
                       data-title={formData.name || 'Flipbook Preview'}
                       className="flipbook-form-preview-btn"
                       title="Preview Flipbook"
                       target="_blank"
                       rel="noopener noreferrer"
                     >
                       <EyeIcon className="w-4 h-4" />
                     </a>
                   )}
                 </div>
                 {errors.embedLink && <span className="flipbook-form-error">{errors.embedLink}</span>}
               </div>

              {/* Release Date */}
              <div className="flipbook-form-field">
                <label htmlFor="releaseDate" className="flipbook-form-label">
                  <CalendarIcon className="w-4 h-4" />
                  Release Date
                </label>
                <input
                  type="date"
                  id="releaseDate"
                  name="releaseDate"
                  value={formData.releaseDate}
                  onChange={handleInputChange}
                  className={`flipbook-form-input ${errors.releaseDate ? 'error' : ''}`}
                />
                {errors.releaseDate && <span className="flipbook-form-error">{errors.releaseDate}</span>}
              </div>
            </div>
           </div>

           {/* Submit Error */}
          {submitError && (
            <div className="flipbook-form-submit-error">
              <span className="flipbook-form-error-icon">⚠️</span>
              <span className="flipbook-form-error-text">{submitError}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flipbook-form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="flipbook-form-btn secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flipbook-form-btn primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="flipbook-form-spinner"></div>
                  Publishing...
                </>
              ) : (
                'Publish Online Issue'
              )}
            </button>
          </div>
         </form>
       </div>
     </div>,
     document.body
   );
 };

export default FlipbookInputForm;
