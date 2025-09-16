import React from 'react';
import { XMarkIcon, CalendarIcon, UserIcon, TagIcon } from '@heroicons/react/24/outline';

const ArticlePreviewModal = ({ isOpen, onClose, articleData }) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'Not set';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatContent = (content) => {
    if (!content) return '<p>No content provided.</p>';
    return content;
  };

  return (
    <div className="article-preview-overlay">
      <div className="article-preview-modal">
        {/* Header */}
        <div className="article-preview-header">
          <h2 className="article-preview-title">Article Preview</h2>
          <button
            onClick={onClose}
            className="article-preview-close-btn"
            title="Close preview"
          >
            <XMarkIcon className="article-preview-close-icon" />
          </button>
        </div>

        {/* Preview Content */}
        <div className="article-preview-content">
          {/* Article Header */}
          <div className="article-preview-article-header">
            <h1 className="article-preview-article-title">
              {articleData.title || 'Untitled Article'}
            </h1>
            
            {/* Article Meta */}
            <div className="article-preview-meta">
              <div className="article-preview-meta-item">
                <UserIcon className="article-preview-meta-icon" />
                <span className="article-preview-meta-text">
                  {articleData.authors && articleData.authors.length > 0 
                    ? articleData.authors.map(author => author.name).join(', ')
                    : 'No authors'
                  }
                </span>
              </div>
              
              <div className="article-preview-meta-item">
                <CalendarIcon className="article-preview-meta-icon" />
                <span className="article-preview-meta-text">
                  {formatDate(articleData.publicationDate)}
                </span>
              </div>
            </div>

            {/* Category and Tags */}
            <div className="article-preview-categories-tags">
              {articleData.category && (
                <div className="article-preview-category">
                  <span className="article-preview-category-label">Category:</span>
                  <span className="article-preview-category-value">{articleData.category}</span>
                </div>
              )}
              
              {articleData.tags && articleData.tags.length > 0 && (
                <div className="article-preview-tags">
                  <TagIcon className="article-preview-tags-icon" />
                  <div className="article-preview-tags-list">
                    {articleData.tags.map((tag, index) => (
                      <span key={index} className="article-preview-tag">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Featured Media (Image or Video) */}
          {articleData.featuredImage && (
            <div className="article-preview-featured-image">
              {(() => {
                const mediaUrl = articleData.featuredImage;
                const isVideo = /\.(mp4|webm|ogg|avi|mov|quicktime)$/i.test(mediaUrl) || 
                               mediaUrl.includes('video/') ||
                               mediaUrl.includes('.mp4') ||
                               mediaUrl.includes('.webm') ||
                               mediaUrl.includes('.ogg');
                
                if (isVideo) {
                  return (
                    <video 
                      src={mediaUrl} 
                      controls
                      className="article-preview-video"
                      onError={(e) => {
                        console.error('Video failed to load:', mediaUrl);
                        e.target.style.display = 'none';
                      }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  );
                } else {
                  return (
                    <img 
                      src={mediaUrl} 
                      alt="Featured image"
                      className="article-preview-image"
                      onError={(e) => {
                        console.error('Image failed to load:', mediaUrl);
                        e.target.style.display = 'none';
                      }}
                    />
                  );
                }
              })()}
              {articleData.mediaCaption && (
                <p className="article-preview-image-caption">
                  {articleData.mediaCaption}
                </p>
              )}
            </div>
          )}

          {/* Additional Media */}
          {articleData.additionalMedia && articleData.additionalMedia.length > 0 && (
            <div className="article-preview-additional-media">
              <h3 className="article-preview-media-title">Additional Media</h3>
              <div className="article-preview-media-grid">
                {articleData.additionalMedia.map((mediaItem, index) => (
                  <div key={mediaItem.id || index} className="article-preview-media-item">
                    <div className="article-preview-media-container">
                      {mediaItem.media.mimeType.startsWith('video/') ? (
                        <video 
                          src={mediaItem.media.url} 
                          controls 
                          className="article-preview-media-video"
                          onError={(e) => {
                            console.error('Video failed to load:', mediaItem.media.url);
                            e.target.style.display = 'none';
                          }}
                        >
                          Your browser does not support the video tag.
                        </video>
                      ) : mediaItem.media.mimeType.startsWith('image/') ? (
                        <img 
                          src={mediaItem.media.url} 
                          alt={mediaItem.media.altText || mediaItem.media.originalName}
                          className="article-preview-media-image"
                          onError={(e) => {
                            console.error('Image failed to load:', mediaItem.media.url);
                            e.target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="article-preview-media-file">
                          <div className="article-preview-file-icon">📎</div>
                          <div className="article-preview-file-name">{mediaItem.media.originalName}</div>
                          <div className="article-preview-file-type">{mediaItem.media.mimeType}</div>
                        </div>
                      )}
                    </div>
                    {(mediaItem.caption || mediaItem.media.caption) && (
                      <p className="article-preview-media-caption">
                        {mediaItem.caption || mediaItem.media.caption}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Article Content */}
          <div className="article-preview-body">
            <div 
              className="article-preview-content-text"
              dangerouslySetInnerHTML={{ __html: formatContent(articleData.content) }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="article-preview-footer">
          <button
            onClick={onClose}
            className="article-preview-close-footer-btn"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};

export default ArticlePreviewModal;
