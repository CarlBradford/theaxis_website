import React, { useState } from 'react';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { announcementsAPI } from '../services/apiService';
import AnnouncementSuccessPopup from './AnnouncementSuccessPopup';
import '../styles/create-announcement-modal.css';

const CreateAnnouncementModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    image: null,
    isActive: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [createdAnnouncement, setCreatedAnnouncement] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        setError('Image size must be less than 20MB');
        return;
      }

      setFormData(prev => ({
        ...prev,
        image: file
      }));
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = new FormData();
      submitData.append('title', formData.title);
      submitData.append('isActive', formData.isActive);
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      const result = await announcementsAPI.createAnnouncement(submitData);
      setCreatedAnnouncement(result.data);
      setShowSuccessPopup(true);
      
      // Close the main modal
      setTimeout(() => {
        handleClose();
      }, 500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to create announcement');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      image: null,
      isActive: true
    });
    setError('');
    setShowSuccessPopup(false);
    setCreatedAnnouncement(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="create-announcement-modal-overlay">
      <div className="create-announcement-modal">
        <div className="create-announcement-modal-header">
          <h2 className="create-announcement-modal-title">Create Announcement</h2>
          <button 
            className="create-announcement-modal-close"
            onClick={handleClose}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="create-announcement-modal-form">
          <div className="create-announcement-form-group">
            <label className="create-announcement-form-label">
              Announcement Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className="create-announcement-form-input"
              placeholder="Enter announcement title"
              required
            />
          </div>

          <div className="create-announcement-form-group">
            <label className="create-announcement-form-label">
              Announcement Image *
            </label>
            <div className="create-announcement-image-upload">
              <input
                type="file"
                id="announcement-image"
                accept="image/*"
                onChange={handleImageChange}
                className="create-announcement-image-input"
                required
              />
              <label 
                htmlFor="announcement-image" 
                className="create-announcement-image-label"
              >
                <PhotoIcon className="create-announcement-image-icon" />
                <span className="create-announcement-image-text">
                  {formData.image ? 'Change Image' : 'Upload Image'}
                </span>
              </label>
            </div>
            
            {formData.image && (
              <div className="create-announcement-file-info">
                <span className="create-announcement-file-name">
                  {formData.image.name}
                </span>
              </div>
            )}
          </div>

          <div className="create-announcement-form-group">
            <label className="create-announcement-checkbox-label">
              <input
                type="checkbox"
                name="isActive"
                checked={formData.isActive}
                onChange={handleInputChange}
                className="create-announcement-checkbox"
              />
              <span className="create-announcement-checkbox-text">
                Show this announcement on home page
              </span>
            </label>
          </div>

          {error && (
            <div className="create-announcement-error">
              {error}
            </div>
          )}

          <div className="create-announcement-modal-actions">
            <button
              type="button"
              onClick={handleClose}
              className="create-announcement-btn create-announcement-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="create-announcement-btn create-announcement-btn-submit"
            >
              {loading ? 'Creating...' : 'Create Announcement'}
            </button>
          </div>
        </form>
      </div>

      {/* Success Popup */}
      {showSuccessPopup && createdAnnouncement && (
        <AnnouncementSuccessPopup 
          announcement={createdAnnouncement}
          onClose={() => {
            setShowSuccessPopup(false);
            setCreatedAnnouncement(null);
            onSuccess?.(createdAnnouncement);
          }}
          onEdit={() => {
            setShowSuccessPopup(false);
            // Reopen the main modal with the announcement data
            setFormData({
              title: createdAnnouncement.title,
              image: null, // Will be fetched from server
              isActive: createdAnnouncement.isActive
            });
            setCreatedAnnouncement(createdAnnouncement);
          }}
        />
      )}
    </div>
  );
};

export default CreateAnnouncementModal;


