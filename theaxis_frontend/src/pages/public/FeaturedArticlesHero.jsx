import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
// Removed unused icons: StarIcon, CalendarIcon, EyeIcon, ArrowRightIcon
import { articlesAPI } from '../../services/apiService';
import MediaDisplay from '../../components/MediaDisplay';
import './featured-articles-hero.css';

const FeaturedArticlesHero = () => {
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    fetchFeaturedArticles();
  }, []);

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying || featuredArticles.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredArticles.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying, featuredArticles.length]);


  const goToSlide = (index) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false); // Stop auto-play when user manually navigates
  };

  const fetchFeaturedArticles = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.getFeaturedArticles();
      
      // Transform articles for display
      const articles = response.data?.map(article => {
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

        // Resize image for hero section - add size parameters (only for images, not videos)
        if (imageUrl && imageUrl.includes('http') && !isVideo) {
          // For external URLs, add size parameters
          if (imageUrl.includes('unsplash.com')) {
            imageUrl = imageUrl.replace(/w=\d+&h=\d+/, 'w=1200&h=750');
          } else if (imageUrl.includes('localhost:3001')) {
            // For local images, you might want to add query parameters for resizing
            // This depends on your backend image processing capabilities
            imageUrl = `${imageUrl}?w=1200&h=750&fit=crop&quality=90`;
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
          featuredImage: imageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=1200&h=750&fit=crop&quality=90",
          publicationDate: article.publicationDate,
          viewCount: article.viewCount || 0,
          categories: article.categories || [],
          authors: authors
        };
      }) || [];

      setFeaturedArticles(articles);
    } catch (err) {
      setError('Failed to load featured articles');
      console.error('Error fetching featured articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <section className="featured-articles-hero">
        <div className="featured-articles-hero-container">
        <div className="featured-articles-hero-content">
          {/* Background Image */}
          <div className="featured-articles-hero-bg-image skeleton-bg"></div>
          
          <div className="featured-articles-hero-text">
            <div className="featured-articles-hero-category">
              <div className="skeleton-text skeleton-category"></div>
            </div>
            <div className="featured-articles-hero-title">
              <div className="skeleton-text skeleton-title"></div>
            </div>
            <div className="featured-articles-hero-author">
              <div className="skeleton-text skeleton-author"></div>
            </div>
          </div>
            <div className="featured-articles-hero-image">
              <div className="skeleton-image"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (error || featuredArticles.length === 0) {
    return null; // Don't show section if no featured articles
  }

  const currentArticle = featuredArticles[currentSlide];

  // Check if the featured media is a video
  const isVideo = currentArticle.featuredImage && (
    /\.(mp4|webm|ogg|avi|mov|quicktime)$/i.test(currentArticle.featuredImage) || 
    currentArticle.featuredImage.includes('video/') ||
    currentArticle.featuredImage.includes('.mp4') ||
    currentArticle.featuredImage.includes('.webm') ||
    currentArticle.featuredImage.includes('.ogg')
  );

  return (
    <section className="featured-articles-hero">
      <div className="featured-articles-hero-container">
        <div className="featured-articles-hero-content">
          {/* Background Image or Video */}
          {isVideo ? (
            <video 
              className="featured-articles-hero-bg-image"
              src={currentArticle.featuredImage}
              muted
              playsInline
              preload="metadata"
              onError={(e) => {
                console.error('Video failed to load:', currentArticle.featuredImage);
                // Fallback to background image if video fails
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'block';
              }}
            />
          ) : null}
          <div 
            className="featured-articles-hero-bg-image"
            style={{
              backgroundImage: isVideo ? 'none' : `url(${currentArticle.featuredImage})`,
              display: isVideo ? 'none' : 'block'
            }}
          ></div>
          
          <div className="featured-articles-hero-text">
            {currentArticle.categories.length > 0 && (
              <div className="featured-articles-hero-category">
                {currentArticle.categories[0].name}
              </div>
            )}
            
            <Link to={`/content/${currentArticle.slug || currentArticle.id}`} className="featured-articles-hero-link">
              <h1 className="featured-articles-hero-title">
                {currentArticle.title}
              </h1>
            </Link>
            
            <div className="featured-articles-hero-author">
              <div className="featured-articles-hero-author-info">
                <div className="featured-articles-hero-author-details">
                  <div className="featured-articles-hero-author-name">
                    By {currentArticle.authors?.map((author, index) => (
                      <span key={author.id || index}>
                        {author.name}
                        {index < currentArticle.authors.length - 1 && (
                          <span className="featured-articles-hero-author-separator">
                            {index === currentArticle.authors.length - 2 ? ' and ' : ', '}
                          </span>
                        )}
                      </span>
                    )) || 'Unknown Author'}
                    <span className="featured-articles-hero-author-date-separator"> • </span>
                    <span className="featured-articles-hero-date">{formatDate(currentArticle.publicationDate)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Carousel Controls */}
            {featuredArticles.length > 1 && (
              <div className="featured-articles-hero-controls">
                <div className="featured-articles-hero-dots">
                  {featuredArticles.map((_, index) => (
                    <button
                      key={index}
                      className={`featured-articles-hero-dot ${index === currentSlide ? 'active' : ''}`}
                      onClick={() => goToSlide(index)}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div className="featured-articles-hero-image">
            <Link to={`/content/${currentArticle.slug || currentArticle.id}`}>
              <MediaDisplay
                mediaUrl={currentArticle.featuredImage}
                alt={currentArticle.title}
                className="featured-articles-hero-img"
                imageClassName="featured-articles-hero-img-element"
                videoClassName="featured-articles-hero-img-element"
                iconClassName="w-8 h-8"
                showVideoIcon={true}
              />
            </Link>
          </div>
        </div>
      </div>
      
      {/* Line Separator */}
      <div className="featured-articles-hero-separator"></div>
    </section>
  );
};

export default FeaturedArticlesHero;
