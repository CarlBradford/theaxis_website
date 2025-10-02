import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articlesAPI } from '../../services/apiService';
import MediaDisplay from '../../components/MediaDisplay';
import PublicPageHeader from '../../components/PublicPageHeader';
import PublicFooter from '../../components/PublicFooter';
import usePageTitle from '../../hooks/usePageTitle';
import './gallery.css';

const Gallery = () => {
  usePageTitle('Gallery');
  
  const [galleryArticles, setGalleryArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [imageDimensions, setImageDimensions] = useState({});
  const [additionalArticles, setAdditionalArticles] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchGalleryArticles();
  }, []);

  const fetchGalleryArticles = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.getArticles({
        status: 'published',
        category: 'gallery',
        sortBy: 'publicationDate',
        sortOrder: 'desc',
        limit: 12
      });
      
      // Transform articles for display
      const articles = response.data?.items?.map(article => {
        // Handle image URL - prepend base URL if it's a relative path
        let imageUrl = article.featuredImage;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          imageUrl = `http://localhost:3001${imageUrl}`;
        }
        
        // Check if it's a video before adding image parameters
        const isVideo = imageUrl && (
          /\.(mp4|webm|ogg|avi|mov|quicktime)$/i.test(imageUrl) || 
          imageUrl.includes('video/') ||
          imageUrl.includes('.mp4') ||
          imageUrl.includes('.webm') ||
          imageUrl.includes('.ogg')
        );

        // Resize image for gallery section (only for images, not videos)
        if (imageUrl && imageUrl.includes('http') && !isVideo) {
          if (imageUrl.includes('unsplash.com')) {
            imageUrl = imageUrl.replace(/w=\d+&h=\d+/, 'w=600&h=400');
          } else if (imageUrl.includes('localhost:3001')) {
          }
        }
        
        // Enhanced author information - handle multiple authors
        const authors = article.articleAuthors && article.articleAuthors.length > 0 
          ? article.articleAuthors.map(authorData => ({
              id: authorData.user.id,
              firstName: authorData.user.firstName || '',
              lastName: authorData.user.lastName || '',
              username: authorData.user.username || '',
              email: authorData.user.email || '',
              role: authorData.user.role || authorData.role || '',
              bio: authorData.user.bio || '',
              // Create display name with fallbacks
              name: `${authorData.user.firstName || ''} ${authorData.user.lastName || ''}`.trim() || authorData.user.username || 'Unknown Author',
              // Create role display name
              roleDisplay: authorData.role ? authorData.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : ''
            }))
          : article.author 
            ? [{
                id: article.author.id,
                firstName: article.author.firstName || '',
                lastName: article.author.lastName || '',
                username: article.author.username || '',
                email: article.author.email || '',
                role: article.author.role || '',
                bio: article.author.bio || '',
                name: `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim() || article.author.username || 'Unknown Author',
                roleDisplay: article.author.role ? article.author.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : ''
              }]
            : [{ 
                id: null,
                firstName: '',
                lastName: '',
                username: '',
                email: '',
                role: '',
                bio: '',
                name: 'Unknown Author',
                roleDisplay: ''
              }];
        
        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          featuredImage: imageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop&quality=90",
          publicationDate: article.publicationDate,
          viewCount: article.viewCount || 0,
          categories: article.categories || [],
          authors: authors,
          mediaCaption: article.mediaCaption || ''
        };
      }) || [];

      // Sort articles by publication date (descending - newest first)
      const sortedArticles = articles.sort((a, b) => {
        const dateA = new Date(a.publicationDate);
        const dateB = new Date(b.publicationDate);
        return dateB - dateA; // Descending order (newest first)
      });
      
      setGalleryArticles(sortedArticles);
      
      // Check if there are more articles to load
      const totalCount = response.data?.pagination?.totalCount || response.data?.pagination?.total || response.pagination?.total || 0;
      setHasMore(sortedArticles.length < totalCount);
      
      // Load image dimensions for each article
      loadImageDimensions(sortedArticles);
    } catch (err) {
      setError('Failed to load gallery articles');
      console.error('Error fetching gallery articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadImageDimensions = (articles) => {
    articles.forEach((article, index) => {
      if (article.featuredImage) {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.naturalHeight / img.naturalWidth;
          setImageDimensions(prev => ({
            ...prev,
            [article.id]: {
              width: img.naturalWidth,
              height: img.naturalHeight,
              aspectRatio: aspectRatio,
              isPortrait: img.naturalHeight > img.naturalWidth
            }
          }));
        };
        img.onerror = () => {
          // Fallback to default dimensions if image fails to load
          setImageDimensions(prev => ({
            ...prev,
            [article.id]: {
              width: 600,
              height: 400,
              aspectRatio: 400/600,
              isPortrait: false
            }
          }));
        };
        img.src = article.featuredImage;
      }
    });
  };

  const loadMoreArticles = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const currentCount = galleryArticles.length + additionalArticles.length;
      const currentPage = Math.floor(currentCount / 12) + 1;
      
      const response = await articlesAPI.getArticles({
        status: 'published',
        category: 'gallery',
        sortBy: 'publicationDate',
        sortOrder: 'desc',
        limit: 12,
        page: currentPage
      });
      
      // Transform additional articles for display
      const newArticles = response.data?.items?.map(article => {
        // Handle image URL - prepend base URL if it's a relative path
        let imageUrl = article.featuredImage;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          imageUrl = `http://localhost:3001${imageUrl}`;
        }
        
        // Check if it's a video before adding image parameters
        const isVideo = imageUrl && (
          /\.(mp4|webm|ogg|avi|mov|quicktime)$/i.test(imageUrl) || 
          imageUrl.includes('video/') ||
          imageUrl.includes('.mp4') ||
          imageUrl.includes('.webm') ||
          imageUrl.includes('.ogg')
        );

        // Resize image for gallery section (only for images, not videos)
        if (imageUrl && imageUrl.includes('http') && !isVideo) {
          if (imageUrl.includes('unsplash.com')) {
            imageUrl = imageUrl.replace(/w=\d+&h=\d+/, 'w=600&h=400');
          } else if (imageUrl.includes('localhost:3001')) {
          }
        }
        
        // Enhanced author information - handle multiple authors
        const authors = article.articleAuthors && article.articleAuthors.length > 0 
          ? article.articleAuthors.map(authorData => ({
              id: authorData.user.id,
              firstName: authorData.user.firstName || '',
              lastName: authorData.user.lastName || '',
              username: authorData.user.username || '',
              email: authorData.user.email || '',
              role: authorData.user.role || authorData.role || '',
              bio: authorData.user.bio || '',
              // Create display name with fallbacks
              name: `${authorData.user.firstName || ''} ${authorData.user.lastName || ''}`.trim() || authorData.user.username || 'Unknown Author',
              // Create role display name
              roleDisplay: authorData.role ? authorData.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : ''
            }))
          : article.author 
            ? [{
                id: article.author.id,
                firstName: article.author.firstName || '',
                lastName: article.author.lastName || '',
                username: article.author.username || '',
                email: article.author.email || '',
                role: article.author.role || '',
                bio: article.author.bio || '',
                name: `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim() || article.author.username || 'Unknown Author',
                roleDisplay: article.author.role ? article.author.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : ''
              }]
            : [{ 
                id: null,
                firstName: '',
                lastName: '',
                username: '',
                email: '',
                role: '',
                bio: '',
                name: 'Unknown Author',
                roleDisplay: ''
              }];
        
        return {
          id: article.id,
          title: article.title,
          slug: article.slug,
          featuredImage: imageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&h=400&fit=crop&quality=90",
          publicationDate: article.publicationDate,
          viewCount: article.viewCount || 0,
          categories: article.categories || [],
          authors: authors,
          mediaCaption: article.mediaCaption || ''
        };
      }) || [];

      // Sort additional articles by publication date (descending - newest first)
      const sortedNewArticles = newArticles.sort((a, b) => {
        const dateA = new Date(a.publicationDate);
        const dateB = new Date(b.publicationDate);
        return dateB - dateA; // Descending order (newest first)
      });
      
      setAdditionalArticles(prev => [...prev, ...sortedNewArticles]);
      
      // Check if there are more articles to load
      const totalCount = response.data?.pagination?.totalCount || response.data?.pagination?.total || response.pagination?.total || 0;
      const newTotalCount = galleryArticles.length + additionalArticles.length + sortedNewArticles.length;
      setHasMore(newTotalCount < totalCount);
      
      // Load image dimensions for new articles
      loadImageDimensions(sortedNewArticles);
      
    } catch (err) {
      console.error('Error loading more articles:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      
      // Check if it's a valid date and not epoch date (1970)
      if (isNaN(date.getTime()) || date.getFullYear() < 1990) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <>
        <PublicPageHeader />
        <section className="gallery">
          <div className="gallery-container">
            <div className="gallery-header">
              <h1 className="gallery-title">GALLERY</h1>
              <div className="gallery-title-separator"></div>
            </div>
            <div className="gallery-grid">
              {[...Array(12)].map((_, index) => (
                <div key={index} className="gallery-item loading">
                  <div className="gallery-skeleton"></div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <PublicFooter />
      </>
    );
  }

  if (error || galleryArticles.length === 0) {
    return (
      <>
        <PublicPageHeader />
        <section className="gallery">
          <div className="gallery-container">
            <div className="gallery-header">
              <h1 className="gallery-title">GALLERY</h1>
              <div className="gallery-title-separator"></div>
            </div>
            <div className="gallery-empty">
              <p>No gallery articles found.</p>
            </div>
          </div>
        </section>
        <PublicFooter />
      </>
    );
  }

  return (
    <>
      <PublicPageHeader />
      <section className="gallery">
        <div className="gallery-container">
          <div className="gallery-header">
            <h1 className="gallery-title">GALLERY</h1>
            <div className="gallery-title-separator"></div>
          </div>
          
          <div className="gallery-grid">
            {[...galleryArticles, ...additionalArticles].map((article, index) => {
              // Use real image dimensions to determine grid span
              const imageData = imageDimensions[article.id];
              const aspectRatio = imageData ? imageData.aspectRatio : 0.75; // Default 4:3 ratio
              
              // Calculate grid row span based on natural aspect ratio
              const getGridSpan = (ratio) => {
                if (ratio >= 1.5) return 2.0; // Very tall images
                if (ratio >= 1.2) return 1.5; // Portrait images
                if (ratio >= 0.8) return 1.0; // Square images
                if (ratio >= 0.6) return 0.8; // Standard landscape (4:3, 16:10)
                if (ratio >= 0.4) return 0.6; // Wide landscape (16:9, 21:9)
                return 0.5; // Ultra-wide landscape images
              };
              
              const gridSpan = getGridSpan(aspectRatio);
              
              return (
              <div 
                key={article.id} 
                className="gallery-item"
                style={{ gridRow: `span ${gridSpan}` }}
              >
                <Link 
                  to={`/content/${article.slug || article.id}`}
                  className="gallery-link"
                >
                  <div className="gallery-image-container">
                    <MediaDisplay
                      mediaUrl={article.featuredImage}
                      alt={article.title}
                      className="gallery-image"
                      imageClassName="gallery-image-element"
                      videoClassName="gallery-image-element"
                      iconClassName="w-8 h-8"
                      showVideoIcon={true}
                    />
                    
                    {/* Overlay */}
                    <div className="gallery-overlay">
                      <div className="gallery-overlay-content">
                        <h3 className="gallery-item-title">
                          {article.title}
                        </h3>
                        
                        {article.mediaCaption && (
                          <p className="gallery-item-caption">
                            {article.mediaCaption}
                          </p>
                        )}
                        
                        <div className="gallery-item-meta">
                          <div className="gallery-item-author">
                            By {article.authors?.map((author, index) => (
                              <span key={author.id || index}>
                                {author.name}
                                {index < article.authors.length - 1 && (
                                  <span className="gallery-author-separator">
                                    {index === article.authors.length - 2 ? ' and ' : ', '}
                                  </span>
                                )}
                              </span>
                            )) || 'Unknown Author'}
                          </div>
                          <div className="gallery-item-date">
                            {formatDate(article.publicationDate)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
              );
            })}
          </div>
          
          {/* Load More Button */}
          {hasMore && (
            <div className="gallery-load-more-container">
              <button 
                className="gallery-load-more-button"
                onClick={loadMoreArticles}
                disabled={loadingMore}
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </section>
      <PublicFooter />
    </>
  );
};

export default Gallery;
