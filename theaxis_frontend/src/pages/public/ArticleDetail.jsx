import React, { useState, useEffect, Fragment, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { articlesAPI, commentsAPI, engagementAPI } from '../../services/apiService';
import MediaDisplay from '../../components/MediaDisplay';
import FrontendProfanityFilter from '../../utils/profanityFilter';
import PublicFooter from '../../components/PublicFooter';
import { Bars3Icon, MagnifyingGlassIcon, XMarkIcon, LinkIcon, ShareIcon, BookmarkIcon, HandThumbUpIcon, HandThumbDownIcon, ChatBubbleLeftIcon } from '@heroicons/react/24/outline';
import theaxisWordmark from '../../assets/theaxis_wordmark.png';
import './article-detail.css';

const ArticleDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [comments, setComments] = useState([]);
  const [userLikeStatus, setUserLikeStatus] = useState(null); // null, true (like), false (dislike)
  const [isLiking, setIsLiking] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [dislikeCount, setDislikeCount] = useState(0);
  
  // Comment form state
  const [commentForm, setCommentForm] = useState({
    content: '',
    name: '',
    email: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [commentApprovalStatus, setCommentApprovalStatus] = useState(null); // 'approved' or 'pending'
  
  // Comments pagination
  const [commentsPage, setCommentsPage] = useState(1);
  const [commentsPagination, setCommentsPagination] = useState(null);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  
  // Related articles
  const [authorArticles, setAuthorArticles] = useState([]);
  const [relatedArticles, setRelatedArticles] = useState([]);
  const [loadingRelated, setLoadingRelated] = useState(false);
  
  // Profanity filter
  const profanityFilter = new FrontendProfanityFilter();
  const [profanityWarning, setProfanityWarning] = useState(null);
  const [flaggedWords, setFlaggedWords] = useState([]);
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);

  useEffect(() => {
    fetchArticle();
  }, [slug]);

  useEffect(() => {
    if (article) {
      fetchComments();
      fetchUserLikeStatus();
      fetchAuthorArticles();
      fetchRelatedArticles();
      // Initialize counts from article data
      setLikeCount(article.likeCount || 0);
      setDislikeCount(article.dislikeCount || 0);
    }
  }, [article]);

  const fetchArticle = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching article with slug:', slug);
      const response = await articlesAPI.getArticle(slug);
      console.log('Article response:', response);
      
      const articleData = response.data?.data || response.data;
      
      if (!articleData) {
        console.log('No article data found');
        setError('Article not found');
        return;
      }
      
      console.log('Article data:', articleData);
      setArticle(articleData);
    } catch (error) {
      console.error('Failed to fetch article:', error);
      setError('Failed to load article');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async (page = 1, append = false) => {
    try {
      const response = await commentsAPI.getComments(article.id, { page, limit: 3 });
      const commentsData = response.data?.items || response.data || [];
      const pagination = response.data?.pagination;
      
      if (append) {
        setComments(prev => [...prev, ...commentsData]);
      } else {
        setComments(commentsData);
      }
      
      setCommentsPagination(pagination);
      setCommentsPage(page);
    } catch (err) {
      console.error('Error fetching comments:', err);
      if (!append) {
        setComments([]);
      }
    }
  };

  const loadMoreComments = async () => {
    if (loadingMoreComments || !commentsPagination?.hasNextPage) return;
    
    setLoadingMoreComments(true);
    try {
      await fetchComments(commentsPage + 1, true);
    } finally {
      setLoadingMoreComments(false);
    }
  };

  const fetchUserLikeStatus = async () => {
    try {
      const response = await engagementAPI.getUserLikeStatus(article.id);
      setUserLikeStatus(response.data?.isLike || null);
    } catch (err) {
      console.error('Error fetching like status:', err);
      // For anonymous users, set to null (no individual tracking)
      setUserLikeStatus(null);
    }
  };

  const fetchAuthorArticles = async () => {
    if (!article?.author?.id) return;
    
    try {
      // Get all author IDs (main author + co-authors)
      const authorIds = [article.author.id];
      
      // Add co-authors if they exist
      if (article.articleAuthors && article.articleAuthors.length > 0) {
        const coAuthorIds = article.articleAuthors.map(aa => aa.user.id);
        authorIds.push(...coAuthorIds);
      }
      
      // Remove duplicates
      const uniqueAuthorIds = [...new Set(authorIds)];
      
      // Fetch articles from all authors
      const response = await articlesAPI.getArticles({
        authorIds: uniqueAuthorIds.join(','), // Send comma-separated author IDs
        status: 'published', // Only fetch published articles
        limit: 3,
        excludeId: article.id // Exclude current article
      });
      console.log('Author articles response:', response.data?.items);
      const articles = response.data?.items || [];
      // Filter out articles without slugs
      const validArticles = articles.filter(article => article.slug);
      console.log('Valid author articles:', validArticles);
      setAuthorArticles(validArticles);
    } catch (err) {
      console.error('Error fetching author articles:', err);
    }
  };

  const fetchRelatedArticles = async () => {
    if (!article?.tags?.length) return;
    
    try {
      setLoadingRelated(true);
      const response = await articlesAPI.getArticles({
        tags: article.tags.map(tag => tag.name).join(','), // Send comma-separated tag names
        status: 'published', // Only fetch published articles
        limit: 3,
        excludeId: article.id // Exclude current article
      });
      console.log('Related articles response:', response.data?.items);
      const articles = response.data?.items || [];
      // Filter out articles without slugs
      const validArticles = articles.filter(article => article.slug);
      console.log('Valid related articles:', validArticles);
      setRelatedArticles(validArticles);
    } catch (err) {
      console.error('Error fetching related articles:', err);
    } finally {
      setLoadingRelated(false);
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
      // For anonymous users, we'll still allow liking/disliking
      // The backend will handle anonymous users by just updating counts
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

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!commentForm.content.trim()) {
      errors.content = 'Comment content is required';
    } else if (commentForm.content.trim().length < 10) {
      errors.content = 'Comment must be at least 10 characters long';
    }
    
    if (!commentForm.name.trim()) {
      errors.name = 'Name is required';
    } else if (commentForm.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters long';
    }
    
    if (!commentForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(commentForm.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    
    return errors;
  };

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCommentForm(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    
    // Check for profanity in real-time (only for content field)
    if (name === 'content' && value.trim()) {
      const profanityResult = profanityFilter.moderateComment(value);
      
      if (profanityResult.blocked) {
        setProfanityWarning(profanityResult.reason);
        setFlaggedWords(profanityResult.flaggedWords);
      } else {
        setProfanityWarning(null);
        setFlaggedWords([]);
      }
    } else if (name === 'content' && !value.trim()) {
      // Clear warning when content is empty
      setProfanityWarning(null);
      setFlaggedWords([]);
    }
  };

  // Handle form submission
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    try {
      setIsSubmittingComment(true);
      setFormErrors({}); // Clear any previous errors
      
      // Prepare comment data
      const commentData = {
        articleId: article.id,
        content: commentForm.content.trim(),
        name: commentForm.name.trim(),
        email: commentForm.email.trim()
      };
      
      // Submit comment to database using public endpoint
      const response = await commentsAPI.createPublicComment(commentData);
      
      // Reset form on success
      setCommentForm({
        content: '',
        name: '',
        email: ''
      });
      
      // Check if comment was approved or pending
      const isApproved = response.data?.isApproved;
      
      // Set approval status for success message
      setCommentApprovalStatus(isApproved ? 'approved' : 'pending');
      
      // Refresh comments list to show the new comment (if approved)
      if (isApproved) {
        await fetchComments();
      }
      
      // Show success message
      setCommentSuccess(true);
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setCommentSuccess(false);
        setCommentApprovalStatus(null);
      }, 5000);
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      // Handle different types of errors
      if (error.response?.status === 400) {
        // Check if there's a specific error message from the backend
        const errorMessage = error.response?.data?.message || error.response?.data?.error;
        if (errorMessage) {
          setFormErrors({ submit: errorMessage });
        } else {
          setFormErrors({ submit: 'Please check your input and try again.' });
        }
      } else if (error.response?.status === 429) {
        setFormErrors({ submit: 'Too many comments submitted. Please wait before trying again.' });
      } else if (error.response?.status === 403) {
        setFormErrors({ submit: 'Comment submission is currently restricted. Please try again later.' });
      } else if (error.response?.status === 422) {
        // Validation errors
        const errorMessage = error.response?.data?.message || 'Please check your input and try again.';
        setFormErrors({ submit: errorMessage });
      } else {
        // Log the full error for debugging
        console.error('Full error object:', error);
        setFormErrors({ submit: `Failed to submit comment. Error: ${error.response?.status || 'Unknown'}` });
      }
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Copy link functionality
  const handleCopyLink = async () => {
    try {
      const url = window.location.href;
      await navigator.clipboard.writeText(url);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    } catch (err) {
      console.error('Failed to copy link:', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setShowCopiedMessage(true);
      setTimeout(() => setShowCopiedMessage(false), 2000);
    }
  };

  // Share functionality
  const handleShare = async () => {
    const shareData = {
      title: article?.title || 'The AXIS Article',
      text: article?.excerpt || 'Check out this article from The AXIS',
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(shareData.url);
        console.log('Link copied to clipboard (share fallback)');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  // Save offline functionality (using browser's print/save as PDF)
  const handleSaveOffline = () => {
    // Create a new window with the article content for printing
    const printWindow = window.open('', '_blank');
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${article?.title || 'The AXIS Article'}</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .print-header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 2px solid #215d55;
              padding-bottom: 20px;
            }
            .print-logo-image {
              height: 50px;
              width: auto;
              margin-bottom: 20px;
              display: block;
            }
            .print-category {
              display: inline-block;
              background: #215d55;
              color: white;
              padding: 6px 16px;
              font-size: 11px;
              font-weight: 600;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            .print-title {
              font-size: 28px;
              font-weight: 800;
              color: #1c4643;
              line-height: 1.2;
              margin: 0 0 15px 0;
            }
            .print-meta {
              font-size: 14px;
              color: #656362;
              margin-bottom: 20px;
            }
            .print-authors {
              font-weight: 500;
              margin-bottom: 5px;
            }
            .print-date {
              font-weight: 400;
            }
            .print-image {
              width: 100%;
              max-width: 600px;
              height: auto;
              margin: 20px auto 0 auto;
              display: block;
              border-radius: 0;
            }
            .print-caption {
              font-size: 12px;
              color: #6b7280;
              text-align: center;
              margin-top: 4px;
              margin-bottom: 30px;
              font-style: italic;
            }
            .print-excerpt {
              font-size: 18px;
              line-height: 1.6;
              color: #656362;
              margin: 20px 0;
              font-style: italic;
            }
            .print-content {
              font-size: 16px;
              line-height: 1.8;
              color: #1c4643;
            }
            .print-content h1, .print-content h2, .print-content h3, .print-content h4, .print-content h5, .print-content h6 {
              color: #1c4643;
              font-weight: 700;
              margin: 24px 0 12px 0;
              line-height: 1.3;
            }
            .print-content h1 { font-size: 24px; }
            .print-content h2 { font-size: 22px; }
            .print-content h3 { font-size: 20px; }
            .print-content h4 { font-size: 18px; }
            .print-content p {
              margin: 0 0 16px 0;
            }
            .print-content ul, .print-content ol {
              margin: 0 0 16px 0;
              padding-left: 24px;
            }
            .print-content li {
              margin: 0 0 8px 0;
            }
            .print-content blockquote {
              border-left: 4px solid #215d55;
              padding-left: 20px;
              margin: 24px 0;
              font-style: italic;
              color: #656362;
              background: rgba(33, 93, 85, 0.05);
              padding: 20px;
            }
            .print-content img {
              max-width: 100%;
              height: auto;
              margin: 16px 0;
            }
            .print-content strong {
              font-weight: 700;
              color: #1c4643;
            }
            .print-content em {
              font-style: italic;
            }
            .print-footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
            }
            .print-url {
              margin-top: 20px;
              font-size: 12px;
              color: #9ca3af;
              text-align: center;
            }
            @media print {
              body { margin: 0; padding: 15px; }
              .print-header { page-break-after: avoid; }
              .print-content { page-break-inside: avoid; }
              .print-category { 
                background: #215d55 !important; 
                color: white !important;
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-header">
            <img src="${theaxisWordmark}" alt="The AXIS" class="print-logo-image" />
            ${article?.categories && article.categories.length > 0 ? 
              `<div class="print-category">${article.categories[0].name}</div>` : ''}
            <h1 class="print-title">${article?.title || 'Article Title'}</h1>
            <div class="print-meta">
              <div class="print-authors">
                ${article?.articleAuthors && article.articleAuthors.length > 0 ? 
                  `By ${article.articleAuthors.map((articleAuthor, index) => {
                    const author = articleAuthor.user;
                    const authorName = `${author.firstName} ${author.lastName}`;
                    return authorName;
                  }).join(', ')}` : 
                  article?.author ? 
                    `By ${article.author.firstName} ${article.author.lastName}` : 
                    'By Unknown Author'
                }
              </div>
              <div class="print-date">
                Published ${article?.publicationDate ? 
                  new Date(article.publicationDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'Unknown Date'
                }
                ${article?.updatedAt && article.updatedAt !== article.publicationDate ? 
                  `<br />Updated ${new Date(article.updatedAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}` : ''
                }
              </div>
            </div>
          </div>

          ${article?.featuredImage ? `
            <img src="${article.featuredImage}" alt="${article.title}" class="print-image" />
            ${article?.mediaCaption ? `<div class="print-caption">${article.mediaCaption}</div>` : ''}
          ` : ''}

          ${article?.excerpt ? `<div class="print-excerpt">${article.excerpt}</div>` : ''}

          <div class="print-content">
            ${article?.content ? article.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>') : 'Content not available'}
          </div>

          <div class="print-footer">
            <div class="print-url">
              ${window.location.href}
            </div>
          </div>
        </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Wait for images to load, then print
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 500);
    };
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
        <button 
          className="article-detail-search-button" 
          title="Search"
          onClick={() => navigate('/search')}
        >
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
          <Link to="/" onClick={closeMobileMenu}>
          <img 
            src={theaxisWordmark} 
            alt="The AXIS" 
            className="article-detail-mobile-wordmark-image"
          />
          </Link>
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
                  {article.updatedAt && article.updatedAt !== article.publicationDate && (
                    <span className="article-detail-updated-date">
                      <br />Updated {formatDate(article.updatedAt)}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Social Share */}
              <div className="article-detail-social">
                <div className="article-detail-copy-container">
                  <button 
                    className="article-detail-action-btn" 
                    title="Copy Link"
                    onClick={handleCopyLink}
                  >
                  <LinkIcon className="article-detail-action-icon" />
                </button>
                  {showCopiedMessage && (
                    <div className="article-detail-copied-message">
                      Copied!
                    </div>
                  )}
                </div>
                <button 
                  className="article-detail-action-btn" 
                  title="Share"
                  onClick={handleShare}
                >
                  <ShareIcon className="article-detail-action-icon" />
                </button>
                <button 
                  className="article-detail-action-btn" 
                  title="Save Offline"
                  onClick={handleSaveOffline}
                >
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
                      <React.Fragment key={tag.id}>
                        <Link 
                          to={`/search?q=${encodeURIComponent(tag.name)}`}
                          className="article-detail-tag"
                        >
                          {tag.name}
                        </Link>
                        {index < article.tags.length - 1 && (
                          <span className="article-detail-tag-separator"> | </span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Comments and Engagement */}
            <div className="article-detail-engagement">
              <div className="article-detail-engagement-content">
                <div className="article-detail-comments-info">
                  <span className="article-detail-comment-count">{commentsPagination?.totalCount ?? 0}</span>
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

            {/* Comment Form */}
            <div className="article-detail-comment-form">
              <h3 className="article-detail-comment-form-title">JOIN THE CONVERSATION</h3>
              <form className="article-detail-comment-form-content" onSubmit={handleCommentSubmit}>
                <div className="article-detail-comment-textarea-container">
                  <textarea 
                    name="content"
                    className={`article-detail-comment-textarea ${formErrors.content ? 'error' : ''}`}
                    placeholder="Share your thoughts..."
                    rows="4"
                    value={commentForm.content}
                    onChange={handleFormChange}
                    required
                  ></textarea>
                  {formErrors.content && (
                    <div className="article-detail-form-error">{formErrors.content}</div>
                  )}
                  {profanityWarning && (
                    <div className="article-detail-form-warning">
                      <div className="article-detail-form-warning-icon">⚠️</div>
                      <div className="article-detail-form-warning-content">
                        <div className="article-detail-form-warning-title">Content Warning</div>
                        <div className="article-detail-form-warning-message">{profanityWarning}</div>
                        {flaggedWords.length > 0 && (
                          <div className="article-detail-form-warning-words">
                            Flagged words: {flaggedWords.join(', ')}
                          </div>
                        )}
                        <div className="article-detail-form-warning-note">
                          This comment will be sent for manual review before being published.
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="article-detail-comment-form-fields">
                  <div className="article-detail-comment-form-field">
                    <input 
                      type="text" 
                      name="name"
                      className={`article-detail-comment-input ${formErrors.name ? 'error' : ''}`}
                      placeholder="Name"
                      value={commentForm.name}
                      onChange={handleFormChange}
                      required
                    />
                    {formErrors.name && (
                      <div className="article-detail-form-error">{formErrors.name}</div>
                    )}
                  </div>
                  <div className="article-detail-comment-form-field">
                    <input 
                      type="email" 
                      name="email"
                      className={`article-detail-comment-input ${formErrors.email ? 'error' : ''}`}
                      placeholder="Email"
                      value={commentForm.email}
                      onChange={handleFormChange}
                      required
                    />
                    {formErrors.email && (
                      <div className="article-detail-form-error">{formErrors.email}</div>
                    )}
                  </div>
                </div>
                {commentSuccess && (
                  <div className="article-detail-form-success">
                    {commentApprovalStatus === 'approved' ? (
                      <>✓ Comment posted successfully! It's now visible to everyone.</>
                    ) : (
                      <>✓ Comment submitted successfully! It's pending approval due to flagged content.</>
                    )}
                  </div>
                )}
                {formErrors.submit && (
                  <div className="article-detail-form-error article-detail-form-error-submit">
                    {formErrors.submit}
                  </div>
                )}
                <button 
                  type="submit" 
                  className="article-detail-comment-submit-btn"
                  disabled={isSubmittingComment}
                >
                  {isSubmittingComment ? 'POSTING...' : 'POST COMMENT'}
                </button>
              </form>
            </div>

            {/* Approved Comments Display */}
            <div className="article-detail-comments-section">
              <h3 className="article-detail-comments-title">
                Comments ({commentsPagination?.totalCount !== undefined ? commentsPagination.totalCount : '...'})
              </h3>
              {comments.length > 0 ? (
                <>
                  <div className="article-detail-comments-list">
                    {comments.map((comment) => (
                      <div key={comment.id} className="article-detail-comment-item">
                        <div className="article-detail-comment-header">
                          <div className="article-detail-comment-author">
                            <div className="article-detail-comment-author-info">
                              <span className="article-detail-comment-author-name">
                                {comment.guestName || (comment.author ? `${comment.author.firstName} ${comment.author.lastName}`.trim() : 'Anonymous')}
                              </span>
                              {comment.author && (
                                <span className="article-detail-comment-author-username">@{comment.author.username}</span>
                              )}
                            </div>
                            <div className="article-detail-comment-author-contact">
                              <span className="article-detail-comment-author-email">
                                {comment.guestEmail || comment.author?.email || 'No email provided'}
                              </span>
                            </div>
                          </div>
                          <div className="article-detail-comment-date">
                            {new Date(comment.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        <div className="article-detail-comment-content">
                          <p>{comment.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {commentsPagination?.hasNextPage && (
                    <div className="article-detail-load-more-container">
                      <button 
                        className="article-detail-load-more-btn"
                        onClick={loadMoreComments}
                        disabled={loadingMoreComments}
                      >
                        {loadingMoreComments ? 'LOADING...' : 'LOAD MORE COMMENTS'}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="article-detail-comments-empty">
                  <p>No comments yet. Be the first to share your thoughts!</p>
                </div>
              )}
            </div>

            {/* More from this Author & Related Stories */}
            <div className="article-detail-related-section">
              <div className="article-detail-related-container">
                {/* More from this Author */}
                <div className="article-detail-author-section">
                  <h3 className="article-detail-related-title">MORE FROM THIS AUTHOR</h3>
                  <div className="article-detail-author-articles">
                    {authorArticles.map((authorArticle) => (
                      <div key={authorArticle.id} className="article-detail-author-article">
                        <div className="article-detail-author-article-image">
                          <img 
                            src={authorArticle.featuredImage || '/placeholder-article.svg'} 
                            alt={authorArticle.title}
                            onError={(e) => {
                              e.target.src = '/placeholder-article.svg';
                            }}
                          />
                          {authorArticle.categories && authorArticle.categories.length > 0 && (
                            <div className="article-detail-author-article-category">
                              {authorArticle.categories[0].name}
                            </div>
                          )}
                        </div>
                        <div className="article-detail-author-article-content">
                          <h4 className="article-detail-author-article-title">
                            <Link to={`/content/${authorArticle.slug}`}>
                              {authorArticle.title}
                            </Link>
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related Stories */}
                <div className="article-detail-related-stories-section">
                  <div className="article-detail-related-container-inner">
                    <div className="article-detail-related-title">
                      <div className="article-detail-related-green-line"></div>
                      <span>RELATED STORIES</span>
                    </div>
                  <div className="article-detail-related-stories">
                    {loadingRelated ? (
                      <div className="article-detail-loading">Loading related stories...</div>
                    ) : (
                        relatedArticles.map((relatedArticle, index) => (
                          <React.Fragment key={relatedArticle.id}>
                            <Link 
                              to={`/content/${relatedArticle.slug}`}
                              className="article-detail-related-story"
                            >
                              {relatedArticle.categories && relatedArticle.categories.length > 0 && (
                                <div className="article-detail-related-story-category">
                                  {relatedArticle.categories[0].name}
                          </div>
                              )}
                            <h4 className="article-detail-related-story-title">
                                {relatedArticle.title}
                            </h4>
                            </Link>
                            {index < relatedArticles.length - 1 && (
                              <div className="article-detail-related-story-separator"></div>
                            )}
                          </React.Fragment>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </main>
      
      {/* Public Footer */}
      <PublicFooter />
    </div>
  );
};

export default ArticleDetail;

