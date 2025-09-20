import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { announcementsAPI } from '../services/apiService';
import '../styles/announcement-popup.css';

const AnnouncementPopup = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveAnnouncements();
  }, []);

  const fetchActiveAnnouncements = async () => {
    try {
      const data = await announcementsAPI.getActiveAnnouncements();
      setAnnouncements(data.data || []);
      
      // Show popup if there are active announcements
      if (data.data && data.data.length > 0) {
        // Check if user has already seen this announcement
        const lastSeenAnnouncement = localStorage.getItem('lastSeenAnnouncement');
        const latestAnnouncement = data.data[0];
        
        if (lastSeenAnnouncement !== latestAnnouncement.id) {
          setIsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    // Mark current announcement as seen
    if (announcements[currentAnnouncementIndex]) {
      localStorage.setItem('lastSeenAnnouncement', announcements[currentAnnouncementIndex].id);
    }
  };

  const handleNext = () => {
    if (currentAnnouncementIndex < announcements.length - 1) {
      setCurrentAnnouncementIndex(currentAnnouncementIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentAnnouncementIndex > 0) {
      setCurrentAnnouncementIndex(currentAnnouncementIndex - 1);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading || !isVisible || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentAnnouncementIndex];

  return (
    <div className="announcement-popup-overlay">
      <div className="announcement-popup">
        <div className="announcement-popup-header">
          <h3 className="announcement-popup-title">Announcement</h3>
          <button 
            className="announcement-popup-close"
            onClick={handleClose}
            aria-label="Close announcement"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="announcement-popup-content">
          {currentAnnouncement.imageUrl && (
            <div className="announcement-popup-image">
              <img 
                src={currentAnnouncement.imageUrl} 
                alt={currentAnnouncement.title}
                className="announcement-popup-img"
              />
            </div>
          )}

          <div className="announcement-popup-text">
            <h4 className="announcement-popup-heading">
              {currentAnnouncement.title}
            </h4>

            <div className="announcement-popup-meta">
              <span className="announcement-popup-date">
                {formatDate(currentAnnouncement.createdAt)}
              </span>
              <span className="announcement-popup-author">
                by {currentAnnouncement.user.firstName} {currentAnnouncement.user.lastName}
              </span>
            </div>
          </div>
        </div>

        {announcements.length > 1 && (
          <div className="announcement-popup-navigation">
            <button 
              className="announcement-popup-nav-btn"
              onClick={handlePrevious}
              disabled={currentAnnouncementIndex === 0}
            >
              Previous
            </button>
            
            <div className="announcement-popup-dots">
              {announcements.map((_, index) => (
                <button
                  key={index}
                  className={`announcement-popup-dot ${
                    index === currentAnnouncementIndex ? 'active' : ''
                  }`}
                  onClick={() => setCurrentAnnouncementIndex(index)}
                />
              ))}
            </div>
            
            <button 
              className="announcement-popup-nav-btn"
              onClick={handleNext}
              disabled={currentAnnouncementIndex === announcements.length - 1}
            >
              Next
            </button>
          </div>
        )}

        <div className="announcement-popup-footer">
          <button 
            className="announcement-popup-dismiss"
            onClick={handleClose}
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementPopup;
