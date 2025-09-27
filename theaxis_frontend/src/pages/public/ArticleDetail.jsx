import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { articlesAPI, commentsAPI, engagementAPI } from '../../services/apiService';
import MediaDisplay from '../../components/MediaDisplay';
import { Bars3Icon, MagnifyingGlassIcon, XMarkIcon, LinkIcon, ShareIcon, BookmarkIcon, HandThumbUpIcon, HandThumbDownIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import theaxisWordmark from '../../assets/theaxis_wordmark.png';
import './article-detail.css';

const ArticleDetail = () => {
  const { slug } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [userLikeStatus, setUserLikeStatus] = useState(null); // null, true (like), false (dislike)
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  useEffect(() => {
    if (article) {
      fetchComments();
      fetchUserLikeStatus();
      // Initialize counts from article data
      setLikeCount(article.likeCount || 0);
      setDislikeCount(article.dislikeCount || 0);
    }
  }, [article]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await articlesAPI.getArticle(slug);
      
      const articleData = response.data?.data || response.data;
      
      if (!articleData) {
        setError('Article not found');
        return;
      }
      
      setArticle(articleData);
    } catch (error) {
      console.error('Failed to fetch article:', error);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await commentsAPI.getComments(article.id);
      const commentsData = response.data?.items || response.data || [];
      setComments(commentsData);
    } catch (err) {
      console.error('Error fetching comments:', err);
      setComments([]);
    }
  };

  const fetchUserLikeStatus = async () => {
    try {
      const response = await engagementAPI.getUserLikeStatus(article.id);
      setUserLikeStatus(response.data?.isLike || null);
    } catch (err) {
      console.error('Error fetching like status:', err);
      // If user is not authenticated, set to null (no like/dislike)
      setUserLikeStatus(null);
    }
  };

  const handleLike = async (isLike) => {
    if (!article || isLiking) return;
    
    try {
      setIsLiking(true);
      await engagementAPI.likeArticle(article.id, isLike);
      
      // Update counts based on previous state
      const previousLikeStatus = userLikeStatus;
      
      if (previousLikeStatus === null) {
        // First time liking/disliking
        if (isLike) {
          setLikeCount(prev => prev + 1);
        } else {
          setDislikeCount(prev => prev + 1);
        }
      } else if (previousLikeStatus === true && !isLike) {
        // Changing from like to dislike
        setLikeCount(prev => prev - 1);
        setDislikeCount(prev => prev + 1);
      } else if (previousLikeStatus === false && isLike) {
        // Changing from dislike to like
        setDislikeCount(prev => prev - 1);
        setLikeCount(prev => prev + 1);
      } else if (previousLikeStatus === true && isLike) {
        // Unliking (clicking like again)
        setLikeCount(prev => prev - 1);
        setUserLikeStatus(null);
        setIsLiking(false);
        return;
      } else if (previousLikeStatus === false && !isLike) {
        // Undisliking (clicking dislike again)
        setDislikeCount(prev => prev - 1);
        setUserLikeStatus(null);
        setIsLiking(false);
        return;
      }
      
      // Update user like status
      setUserLikeStatus(isLike);
      
    } catch (err) {
      console.error('Error liking article:', err);
      // If user is not authenticated, show a message or redirect to login
      if (err.response?.status === 401) {
        alert('Please log in to like/dislike articles');
      }
    } finally {
      setIsLiking(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatContent = (content) => {
    if (!content) return '';
    
    // Basic HTML sanitization and formatting
    return content
      .replace(/\n/g, '<br>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>');
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Custom Header Component
  const ArticleHeader = () => (
    <header className="article-detail-custom-header">
      <div className="article-detail-header-container">
        {/* Menu Button */}
        <button 
          className={`article-detail-menu-button ${isMobileMenuOpen ? 'menu-open' : ''}`}
          title="Menu"
          onClick={toggleMobileMenu}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="article-detail-menu-icon" />
          ) : (
            <Bars3Icon className="article-detail-menu-icon" />
          )}
        </button>
        
        {/* Logo/Center */}
        <div className="article-detail-logo">
          <Link to="/" className="article-detail-logo-link">
            <img 
              src={theaxisWordmark} 
              alt="The AXIS" 
              className="article-detail-logo-image"
            />
          </Link>
        </div>
        
        {/* Search Button */}
        <button className="article-detail-search-button" title="Search">
          <MagnifyingGlassIcon className="article-detail-search-icon" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`article-detail-mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
      ></div>

      {/* Mobile Menu Sidebar */}
      <div className={`article-detail-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
        {/* AXIS Wordmark */}
        <div className="article-detail-mobile-wordmark">
          <img 
            src={theaxisWordmark} 
            alt="The AXIS" 
            className="article-detail-mobile-wordmark-image"
          />
        </div>

        {/* Navigation Categories */}
        <nav className="article-detail-mobile-nav">
          <Link to="/news" className="article-detail-mobile-link" onClick={closeMobileMenu}>
            News
          </Link>
          <div className="article-detail-mobile-separator"></div>
          
          <Link to="/opinion" className="article-detail-mobile-link" onClick={closeMobileMenu}>
            Opinion
          </Link>
          <div className="article-detail-mobile-separator"></div>
          
          <Link to="/editorial" className="article-detail-mobile-link" onClick={closeMobileMenu}>
            Editorial
          </Link>
          <div className="article-detail-mobile-separator"></div>
          
          <Link to="/feature" className="article-detail-mobile-link" onClick={closeMobileMenu}>
            Feature
          </Link>
          <div className="article-detail-mobile-separator"></div>
          
          <Link to="/literary" className="article-detail-mobile-link" onClick={closeMobileMenu}>
            Literary
          </Link>
          <div className="article-detail-mobile-separator"></div>
          
          <Link to="/devcomm" className="article-detail-mobile-link" onClick={closeMobileMenu}>
            DevComm
          </Link>
          <div className="article-detail-mobile-separator"></div>
          
          <Link to="/sports" className="article-detail-mobile-link" onClick={closeMobileMenu}>
            Sports
          </Link>
          <div className="article-detail-mobile-separator"></div>
          
          <Link to="/art" className="article-detail-mobile-link" onClick={closeMobileMenu}>
            Art
          </Link>
          <div className="article-detail-mobile-separator"></div>
          
          <Link to="/the-axis-online" className="article-detail-mobile-link" onClick={closeMobileMenu}>
            The AXIS Online
          </Link>
          <div className="article-detail-mobile-separator"></div>
          
          <Link to="/annual-editions" className="article-detail-mobile-link" onClick={closeMobileMenu}>
            Annual Editions
          </Link>
        </nav>
      </div>
    </header>
  );

  if (loading) {
    return (
      <div className="article-detail-page">
        <ArticleHeader />
        <div className="article-detail-loading">
          <div className="article-detail-loading-spinner"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="article-detail-page">
        <ArticleHeader />
        <div className="article-detail-error">
          <h1>Article Not Found</h1>
          <p>The article you're looking for doesn't exist or has been removed.</p>
          <Link to="/" className="article-detail-back-link">
            ← Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="article-detail-page">
      <ArticleHeader />
      
      <main className="article-detail-main">
        <div className="article-detail-container">
          {/* Article Header */}
          <header className="article-detail-header">
            {/* Category */}
            {article.categories && article.categories.length > 0 && (
              <div className="article-detail-category">
                {article.categories[0].name}
              </div>
            )}

            {/* Title */}
            <h1 className="article-detail-title">
              {article.title}
            </h1>

            {/* Featured Image */}
            {article.featuredImage && (
              <div className="article-detail-featured-image">
                <MediaDisplay
                  mediaUrl={article.featuredImage}
                  alt={article.title}
                  className="media-display-container article-detail-image"
                  imageClassName="media-display-image article-detail-image-element"
                  videoClassName="media-display-video article-detail-image-element"
                  iconClassName="w-6 h-6"
                  showVideoIcon={true}
                />
                {/* Media Caption */}
                {article.mediaCaption && (
                  <p className="article-detail-media-caption">
                    {article.mediaCaption}
                  </p>
                )}
              </div>
            )}

            {/* Excerpt */}
            {article.excerpt && (
              <p className="article-detail-excerpt">
                {article.excerpt}
              </p>
            )}

            {/* Meta Information */}
            <div className="article-detail-meta">
              <div className="article-detail-author-date">
                {/* Authors */}
                <div className="article-detail-authors">
                  {article.articleAuthors && article.articleAuthors.length > 0 ? (
                    <span className="article-detail-author">
                      By {article.articleAuthors.map((articleAuthor, index) => {
                        const author = articleAuthor.user;
                        const authorName = `${author.firstName} ${author.lastName}`;
                        return (
                          <span key={author.id || index}>
                            {authorName}
                            {index < article.articleAuthors.length - 1 && (
                              <span className="article-detail-author-separator">
                                {index === article.articleAuthors.length - 2 ? ' and ' : ', '}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </span>
                  ) : article.author ? (
                    <span className="article-detail-author">
                      By {article.author.firstName} {article.author.lastName}
                    </span>
                  ) : (
                    <span className="article-detail-author">By Unknown Author</span>
                  )}
                </div>
                
                {/* Publication Date */}
                <div className="article-detail-publication-date">
                  Published {formatDate(article.publicationDate)}
                </div>
              </div>
              
              {/* Social Share */}
              <div className="article-detail-social">
                <button className="article-detail-action-btn" title="Copy Link">
                  <LinkIcon className="article-detail-action-icon" />
                </button>
                <button className="article-detail-action-btn" title="Share">
                  <ShareIcon className="article-detail-action-icon" />
                </button>
                <button className="article-detail-action-btn" title="Save Offline">
                  <BookmarkIcon className="article-detail-action-icon" />
                </button>
              </div>
            </div>
          </header>

          {/* Article Content */}
          <article className="article-detail-content">
            <div 
              className="article-detail-body"
              dangerouslySetInnerHTML={{ __html: formatContent(article.content) }}
            />
          </article>

          {/* Article Footer */}
          <footer className="article-detail-footer">
            {/* Tags */}
            {article.tags && article.tags.length > 0 && (
              <div className="article-detail-tags">
                <div className="article-detail-tags-content">
                  <span className="article-detail-tags-label">Related Topic:</span>
                  <div className="article-detail-tags-list">
                    {article.tags.map((tag, index) => (
                      <span key={tag.id} className="article-detail-tag">
                        {tag.name}
                        {index < article.tags.length - 1 && (
                          <span className="article-detail-tag-separator"> | </span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Comments and Engagement */}
            <div className="article-detail-engagement">
              <div className="article-detail-engagement-content">
                <div className="article-detail-comments-info">
                  <span className="article-detail-comment-count">{comments.length}</span>
                  <span className="article-detail-comments-text">COMMENTS</span>
                </div>
                <div className="article-detail-engagement-actions">
                  <button 
                    className={`article-detail-like-btn ${userLikeStatus === true ? 'active' : ''}`} 
                    title="Like"
                    onClick={() => handleLike(true)}
                    disabled={isLiking}
                  >
                    <HandThumbUpIcon className="article-detail-engagement-icon" />
                    <span className="article-detail-counter">{likeCount}</span>
                  </button>
                  <button 
                    className={`article-detail-dislike-btn ${userLikeStatus === false ? 'active' : ''}`} 
                    title="Dislike"
                    onClick={() => handleLike(false)}
                    disabled={isLiking}
                  >
                    <HandThumbDownIcon className="article-detail-engagement-icon" />
                    <span className="article-detail-counter">{dislikeCount}</span>
                  </button>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
};

export default ArticleDetail;
