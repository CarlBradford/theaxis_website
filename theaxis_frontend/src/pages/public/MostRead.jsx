import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articlesAPI } from '../../services/apiService';
import MediaDisplay from '../../components/MediaDisplay';
import './most-read.css';

const MostRead = () => {
  const [mostReadArticles, setMostReadArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    fetchMostReadArticles();
  }, []);

  // Auto-advance carousel
  useEffect(() => {
    if (mostReadArticles.length > 1) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % mostReadArticles.length);
      }, 5000); // Change slide every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [mostReadArticles.length]);

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const fetchMostReadArticles = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.getArticles({
        status: 'published',
        sortBy: 'viewCount',
        sortOrder: 'desc',
        limit: 5
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

        // Resize image for most read section (only for images, not videos)
        if (imageUrl && imageUrl.includes('http') && !isVideo) {
          if (imageUrl.includes('unsplash.com')) {
            imageUrl = imageUrl.replace(/w=\d+&h=\d+/, 'w=300&h=200');
          } else if (imageUrl.includes('localhost:3001')) {
            imageUrl = `${imageUrl}?w=300&h=200&fit=crop&quality=90`;
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
        
        // Generate content snippet from article content
        const contentSnippet = article.content 
          ? article.content.length > 150 
            ? `${article.content.substring(0, 150)}...` 
            : article.content
          : article.excerpt || 'Read the full article to discover more about this story...';

        return {
          id: article.id,
          title: article.title,
          contentSnippet: contentSnippet,
          slug: article.slug,
          featuredImage: imageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop&quality=90",
          publicationDate: article.publicationDate,
          viewCount: article.viewCount || 0,
          categories: article.categories || [],
          authors: authors
        };
      }) || [];

      setMostReadArticles(articles);
    } catch (err) {
      setError('Failed to load most read articles');
      console.error('Error fetching most read articles:', err);
    } finally {
      setLoading(false);
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
      <section className="most-read">
        <div className="most-read-container">
          <div className="most-read-header">
            <h2 className="most-read-title">Most Read</h2>
            <div className="most-read-title-separator"></div>
          </div>
          <div className="most-read-grid">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="most-read-card loading">
                <div className="most-read-skeleton"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || mostReadArticles.length === 0) {
    return null; // Don't show section if no most read articles
  }

  return (
    <section className="most-read">
      <div className="most-read-container">
        
        <div className="most-read-grid">
          {/* Left Column - Carousel */}
          <div className="most-read-left-column">
            <div className="most-read-carousel">
              <div className="most-read-carousel-container">
                <div 
                  className="most-read-carousel-track"
                  style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                  {mostReadArticles.map((article, index) => (
                    <div key={article.id} className="most-read-carousel-slide">
                      <Link to={`/content/${article.slug || article.id}`} className="most-read-carousel-link">
                        <div className="most-read-carousel-image">
                          <MediaDisplay
                            mediaUrl={article.featuredImage}
                            alt={article.title}
                            className="most-read-carousel-img"
                            imageClassName="most-read-carousel-img-element"
                            videoClassName="most-read-carousel-img-element"
                            iconClassName="w-8 h-8"
                            showVideoIcon={true}
                          />
                        </div>
                        <div className="most-read-carousel-content">
                          {article.categories.length > 0 && (
                            <div className="most-read-carousel-category">
                              {article.categories[0].name}
                            </div>
                          )}
                          <h3 className="most-read-carousel-title">
                            {article.title}
                          </h3>
                          <div className="most-read-carousel-meta">
                            <span className="most-read-carousel-authors">
                              By {article.authors?.map((author, index) => (
                                <span key={author.id || index}>
                                  {author.name}
                                  {index < article.authors.length - 1 && (
                                    <span className="most-read-carousel-author-separator">
                                      {index === article.authors.length - 2 ? ' and ' : ', '}
                                    </span>
                                  )}
                                </span>
                              )) || 'Unknown Author'}
                            </span>
                            <span className="most-read-carousel-meta-separator"> • </span>
                            <span className="most-read-carousel-views">
                              <svg className="most-read-carousel-eye-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              </svg>
                              {article.viewCount.toLocaleString()} views
                            </span>
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Carousel Controls */}
              {mostReadArticles.length > 1 && (
                <div className="most-read-carousel-controls">
                  <div className="most-read-carousel-dots">
                    {mostReadArticles.map((_, index) => (
                      <button
                        key={index}
                        className={`most-read-carousel-dot ${index === currentSlide ? 'active' : ''}`}
                        onClick={() => goToSlide(index)}
                        aria-label={`Go to slide ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Vertical Column Separator */}
          <div className="most-read-column-separator"></div>
          
          {/* Right Column - Most Read Articles */}
          <div className="most-read-right-column">
            <div className="most-read-container-inner">
              <div className="most-read-section-title">
                <div className="most-read-green-line"></div>
                <span>MOST READ</span>
              </div>
              <div className="most-read-articles-list">
                {mostReadArticles.map((article, index) => (
                  <React.Fragment key={article.id}>
                    <Link 
                      to={`/content/${article.slug || article.id}`}
                      className="most-read-simple-card"
                    >
                      {article.categories.length > 0 && (
                        <div className="most-read-simple-category">
                          {article.categories[0].name}
                        </div>
                      )}
                      
                      <h3 className="most-read-simple-title">
                        {article.title}
                      </h3>
                    </Link>
                    {index < mostReadArticles.length - 1 && (
                      <div className="most-read-simple-separator"></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>
        </div>
      {/* Line Separator */}
      <div className="most-read-separator"></div>
      </div>
      

    </section>
  );
};

export default MostRead;
