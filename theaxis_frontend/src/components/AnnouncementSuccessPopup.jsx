import React, { useState } from 'react';
import { XMarkIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';
import { announcementsAPI } from '../services/apiService';
import '../styles/announcement-success-popup.css';

const AnnouncementSuccessPopup = ({ announcement, onClose, onEdit }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await announcementsAPI.deleteAnnouncement(announcement.id);
      onClose();
    } catch (error) {
      console.error('Error deleting announcement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    onEdit();
  };

  const handleViewImage = () => {
    if (announcement.imageUrl) {
      window.open(`http://localhost:3001/uploads/announcements/${announcement.imageUrl}`, '_blank');
    }
  };

  return (
    <div className="announcement-success-popup-overlay">
      <div className="announcement-success-popup">
        <div className="announcement-success-popup-header">
          <h3 className="announcement-success-popup-title">
            ✅ Announcement Created Successfully!
          </h3>
          <button 
            className="announcement-success-popup-close"
            onClick={onClose}
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="announcement-success-popup-content">
          <div className="announcement-success-details">
            <h4 className="announcement-success-details-title">
              {announcement.title}
            </h4>
            
            <div className="announcement-success-status">
              <span className={`announcement-status-badge ${announcement.isActive ? 'active' : 'inactive'}`}>
                {announcement.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>

            {announcement.imageUrl && (
              <div className="announcement-success-image-section">
                <div className="announcement-success-image-preview">
                  <img 
                    src={`http://localhost:3001/uploads/announcements/${announcement.imageUrl}`}
                    alt="Announcement preview"
                    className="announcement-success-image"
                  />
                </div>
                <button 
                  className="announcement-success-view-image-btn"
                  onClick={handleViewImage}
                >
                  <EyeIcon className="w-4 h-4" />
                  View Full Image
                </button>
              </div>
            )}

            <div className="announcement-success-created">
              <p className="announcement-success-created-text">
                Created: {new Date(announcement.createdAt).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="announcement-success-actions">
            <button 
              className="announcement-success-btn announcement-success-btn-edit"
              onClick={handleEdit}
            >
              <PencilIcon className="w-4 h-4" />
              Edit Announcement
            </button>
            
            <button 
              className="announcement-success-btn announcement-success-btn-delete"
              onClick={() => setShowConfirmDelete(true)}
            >
              <TrashIcon className="w-4 h-4" />
              Delete Announcement
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showConfirmDelete && (
          <div className="announcement-delete-confirm-overlay">
            <div className="announcement-delete-confirm-modal">
              <h4 className="announcement-delete-confirm-title">
                Delete Announcement
              </h4>
              <p className="announcement-delete-confirm-message">
                Are you sure you want to delete this announcement? This action cannot be undone.
              </p>
              <div className="announcement-delete-confirm-actions">
                <button 
                  className="announcement-delete-confirm-btn announcement-delete-confirm-btn-cancel"
                  onClick={() => setShowConfirmDelete(false)}
                >
                  Cancel
                </button>
                <button 
                  className="announcement-delete-confirm-btn announcement-delete-confirm-btn-delete"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementSuccessPopup;
