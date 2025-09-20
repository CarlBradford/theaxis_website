import React, { useState, useEffect } from 'react';
import { CalendarIcon, SpeakerWaveIcon, ClockIcon } from '@heroicons/react/24/outline';
import { announcementsAPI } from '../services/apiService';
import '../styles/announcement-section.css';

const AnnouncementSection = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveAnnouncements();
  }, []);

  const fetchActiveAnnouncements = async () => {
    try {
      const data = await announcementsAPI.getActiveAnnouncements();
      setAnnouncements(data.data || []);
    } catch (error) {
      console.error('Error fetching announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="announcement-section">
        <div className="announcement-section-header">
          <h2 className="announcement-section-title">Announcements & Events</h2>
        </div>
        <div className="announcement-section-content">
          <div className="announcement-card loading">
            <div className="announcement-skeleton"></div>
          </div>
        </div>
      </div>
    );
  }

  if (announcements.length === 0) {
    return (
      <div className="announcement-section">
        <div className="announcement-section-header">
          <h2 className="announcement-section-title">Announcements & Events</h2>
        </div>
        <div className="announcement-section-content">
          <div className="announcement-empty">
            <SpeakerWaveIcon className="announcement-empty-icon" />
            <p className="announcement-empty-text">No announcements at the moment</p>
            <p className="announcement-empty-subtext">Check back soon for updates and upcoming events!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="announcement-section">
      <div className="announcement-section-header">
        <h2 className="announcement-section-title">Announcements & Events</h2>
        <p className="announcement-section-subtitle">Stay updated with the latest news and upcoming events</p>
      </div>
      
      <div className="announcement-section-content">
        <div className="announcement-grid">
          {announcements.slice(0, 3).map((announcement) => (
            <div key={announcement.id} className="announcement-card">
              {announcement.imageUrl && (
                <div className="announcement-image">
                  <img 
                    src={announcement.imageUrl} 
                    alt={announcement.title}
                    className="announcement-img"
                  />
                </div>
              )}
              
              <div className="announcement-content">
                <div className="announcement-header">
                  <h3 className="announcement-title">{announcement.title}</h3>
                  <div className="announcement-meta">
                    <div className="announcement-date">
                      <CalendarIcon className="announcement-icon" />
                      <span>{formatDate(announcement.createdAt)}</span>
                    </div>
                    <div className="announcement-time">
                      <ClockIcon className="announcement-icon" />
                      <span>{formatTime(announcement.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="announcement-body">
                  <p className="announcement-description">
                    {announcement.description && announcement.description.length > 150 
                      ? `${announcement.description.substring(0, 150)}...` 
                      : announcement.description || 'No description available.'}
                  </p>
                </div>
                
                <div className="announcement-footer">
                  <div className="announcement-author">
                    <span className="announcement-author-label">Posted by:</span>
                    <span className="announcement-author-name">
                      {announcement.user.firstName} {announcement.user.lastName}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {announcements.length > 3 && (
          <div className="announcement-more">
            <p className="announcement-more-text">
              And {announcements.length - 3} more announcement{announcements.length - 3 !== 1 ? 's' : ''}...
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementSection;
