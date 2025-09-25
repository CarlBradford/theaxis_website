import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  XMarkIcon, 
  DocumentTextIcon,
  LinkIcon,
  TagIcon,
  CalendarIcon,
  EyeIcon,
  PhotoIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import '../styles/flipbook-input-form.css';

const FlipbookInputForm = ({ isOpen, onClose, onSubmit, editData = null }) => {
  const [formData, setFormData] = useState({
    name: editData?.title || '',
    embedLink: editData?.embed_url || '',
    type: editData?.type?.toLowerCase() || 'magazine',
    releaseDate: editData?.releaseDate ? new Date(editData.releaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    thumbnailImage: null
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [imagePreview, setImagePreview] = useState(editData?.thumbnailUrl || null);

  // Update form data when editData changes
  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.title || '',
        embedLink: editData.embed_url || '',
        type: editData.type?.toLowerCase() || 'magazine',
        releaseDate: editData.releaseDate ? new Date(editData.releaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        thumbnailImage: null
      });
      setImagePreview(editData?.thumbnailUrl || null);
    } else {
      setFormData({
        name: '',
        embedLink: '',
        type: 'magazine',
        releaseDate: new Date().toISOString().split('T')[0],
        thumbnailImage: null
      });
      setImagePreview(null);
    }
  }, [editData]);

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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrors(prev => ({
          ...prev,
          thumbnailImage: 'Please select a valid image file'
        }));
        return;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setErrors(prev => ({
          ...prev,
          thumbnailImage: 'Image size must be less than 20MB'
        }));
        return;
      }

      // Update form data with file
      setFormData(prev => ({
        ...prev,
        thumbnailImage: file
      }));

      // Clear any existing errors
      if (errors.thumbnailImage) {
        setErrors(prev => ({
          ...prev,
          thumbnailImage: ''
        }));
      }
    }
  };

  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      thumbnailImage: null
    }));
    
    // Clear image preview for edit mode
    setImagePreview(null);
    
    // Clear file input if it exists (for new file upload mode)
    const fileInput = document.getElementById('thumbnailImage');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const validateForm = () => {
    const newErrors = {};
    console.log('🔍 Validating form with data:', formData);

    // Validate publication name
    if (!formData.name.trim()) {
      newErrors.name = 'Publication name is required';
      console.log('🔍 Validation error: Publication name is required');
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Publication name must be at least 3 characters';
      console.log('🔍 Validation error: Publication name too short');
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Publication name must be less than 100 characters';
      console.log('🔍 Validation error: Publication name too long');
    }

    // Validate embed link
    if (!formData.embedLink.trim()) {
      newErrors.embedLink = 'Embed link is required';
      console.log('🔍 Validation error: Embed link is required');
    } else if (!isValidUrl(formData.embedLink)) {
      newErrors.embedLink = 'Please enter a valid URL';
      console.log('🔍 Validation error: Invalid URL');
    } else if (!isValidFlipbookUrl(formData.embedLink)) {
      newErrors.embedLink = 'Please enter a valid FlipHTML5 or flipbook URL';
      console.log('🔍 Validation error: Invalid flipbook URL');
    }

    // Validate publication type
    if (!formData.type) {
      newErrors.type = 'Publication type is required';
      console.log('🔍 Validation error: Publication type is required');
    }

    // Validate thumbnail image (required for new flipbooks, optional for edits if existing image exists)
    if (!formData.thumbnailImage && !imagePreview) {
      newErrors.thumbnailImage = 'Thumbnail image is required';
      console.log('🔍 Validation error: Thumbnail image is required');
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
    const isValid = Object.keys(newErrors).length === 0;
    console.log('🔍 Validation result:', { isValid, errors: newErrors });
    return isValid;
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
    console.log('🔍 Form submit triggered');
    console.log('🔍 Form data:', formData);
    
    if (!validateForm()) {
      console.log('🔍 Form validation failed');
      return;
    }

    console.log('🔍 Form validation passed, submitting...');
    setIsSubmitting(true);
    setSubmitError('');

    try {
      console.log('🔍 Calling onSubmit with formData:', formData);
      await onSubmit(formData);
      console.log('🔍 onSubmit completed successfully');
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
      releaseDate: new Date().toISOString().split('T')[0],
      thumbnailImage: null
    });
    setImagePreview(null);
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

  console.log('🔍 FlipbookInputForm render:', {
    isOpen,
    editData,
    onSubmit: typeof onSubmit,
    onClose: typeof onClose
  });

  return createPortal(
    <div className="flipbook-form-overlay" onClick={handleBackdropClick}>
      <div className="flipbook-form-container">
        {/* Header */}
        <div className="flipbook-form-header">
          <div className="flipbook-form-title-section">
            <DocumentTextIcon className="flipbook-form-icon" />
            <div>
              <h2 className="flipbook-form-title">{editData ? 'Edit Online Issue' : 'Publish Online Issue'}</h2>
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
                  placeholder="e.g., The AXIS Magazine Issue 2024"
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

           {/* Thumbnail Image Upload */}
           <div className="flipbook-form-field flipbook-form-field-full">
             <label htmlFor="thumbnailImage" className="flipbook-form-label">
               <PhotoIcon className="w-4 h-4" />
               Thumbnail Image <span className="flipbook-form-required">*</span>
             </label>
             
             {formData.thumbnailImage ? (
               <div className="flipbook-form-file-selected">
                 <div className="flipbook-form-file-info">
                   <PhotoIcon className="w-5 h-5" />
                   <span className="flipbook-form-file-name">{formData.thumbnailImage.name}</span>
                   <span className="flipbook-form-file-size">
                     ({(formData.thumbnailImage.size / (1024 * 1024)).toFixed(2)} MB)
                   </span>
                 </div>
                 <button
                   type="button"
                   onClick={handleRemoveImage}
                   className="flipbook-form-remove-file-btn"
                   title="Remove file"
                 >
                   <TrashIcon className="w-4 h-4" />
                 </button>
               </div>
             ) : imagePreview ? (
               <div className="flipbook-form-file-selected">
                 <div className="flipbook-form-file-info">
                   <PhotoIcon className="w-5 h-5" />
                   <span className="flipbook-form-file-name">
                     {imagePreview.split('/').pop() || 'Current thumbnail'}
                   </span>
                   <span className="flipbook-form-file-size">
                     (Current image)
                   </span>
                 </div>
                 <div className="flipbook-form-file-actions">
                   <button
                     type="button"
                     onClick={handleRemoveImage}
                     className="flipbook-form-change-image-btn"
                     title="Remove current image"
                   >
                     <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                     </svg>
                   </button>
                 </div>
               </div>
             ) : (
               <div className="flipbook-form-image-upload">
                 <input
                   type="file"
                   id="thumbnailImage"
                   name="thumbnailImage"
                   accept="image/*"
                   onChange={handleImageUpload}
                   className="flipbook-form-file-input"
                 />
                 <label htmlFor="thumbnailImage" className="flipbook-form-file-label">
                   <span>Upload thumbnail image</span>
                   <small>PNG, JPG, GIF up to 20MB</small>
                 </label>
               </div>
             )}
             
             {errors.thumbnailImage && <span className="flipbook-form-error">{errors.thumbnailImage}</span>}
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
                  <div className="uniform-spinner-small"></div>
                  Publishing...
                </>
              ) : (
                editData ? 'Update Online Issue' : 'Publish Online Issue'
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
