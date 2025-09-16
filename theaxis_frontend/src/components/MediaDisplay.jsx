import React from 'react';
import { DocumentTextIcon, VideoCameraIcon } from '@heroicons/react/24/outline';

const MediaDisplay = ({ 
  mediaUrl, 
  alt, 
  className = '', 
  imageClassName = '', 
  videoClassName = '',
  iconClassName = '',
  onError,
  onClick,
  title,
  showVideoIcon = true
}) => {
  if (!mediaUrl) {
    return (
      <div 
        className={`media-display-icon ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        title={title}
      >
        <DocumentTextIcon className={`w-4 h-4 ${iconClassName}`} />
      </div>
    );
  }

  const isVideo = /\.(mp4|webm|ogg|avi|mov|quicktime)$/i.test(mediaUrl) || 
                 mediaUrl.includes('video/') ||
                 mediaUrl.includes('.mp4') ||
                 mediaUrl.includes('.webm') ||
                 mediaUrl.includes('.ogg');

  if (isVideo) {
    return (
      <div 
        className={`media-display-container ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        title={title}
      >
        <video 
          src={mediaUrl} 
          className={`media-display-video ${videoClassName}`}
          onError={(e) => {
            console.error('Video failed to load:', mediaUrl);
            if (onError) {
              onError(e);
            } else {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }
          }}
          muted
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
        {showVideoIcon && (
          <div className="media-display-video-overlay">
            <VideoCameraIcon className="media-display-video-icon" />
          </div>
        )}
        <div className="media-display-icon" style={{ display: 'none' }}>
          <DocumentTextIcon className={`w-4 h-4 ${iconClassName}`} />
        </div>
      </div>
    );
  } else {
    return (
      <div 
        className={`media-display-container ${className}`}
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
        title={title}
      >
        <img 
          src={mediaUrl} 
          alt={alt}
          className={`media-display-image ${imageClassName}`}
          onError={(e) => {
            console.error('Image failed to load:', mediaUrl);
            if (onError) {
              onError(e);
            } else {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }
          }}
        />
        <div className="media-display-icon" style={{ display: 'none' }}>
          <DocumentTextIcon className={`w-4 h-4 ${iconClassName}`} />
        </div>
      </div>
    );
  }
};

export default MediaDisplay;
