import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import '../styles/review-queue.css';
import { reviewQueueService } from '../services/reviewQueueService';
import { articlesAPI } from '../services/apiService';
import ConfirmationModal from './ConfirmationModal';
import ArticlePreviewModal from './ArticlePreviewModal';
import SuccessModal from './SuccessModal';
import RequestRevisionModal from './RequestRevisionModal';
import ReturnToSectionModal from './ReturnToSectionModal';
import ResubmitModal from './ResubmitModal';

const ReviewQueue = ({ queueType = 'section-head' }) => {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [articleToApprove, setArticleToApprove] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [articleToRevise, setArticleToRevise] = useState(null);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [articleToPublish, setArticleToPublish] = useState(null);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [articleToReturn, setArticleToReturn] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [articleToResubmit, setArticleToResubmit] = useState(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);

  // Map frontend status values to backend database values
  const mapFrontendStatusToBackend = (frontendStatus) => {
    const statusMap = {
      'in-review': 'IN_REVIEW',
      'needs-revision': 'NEEDS_REVISION', 
      'approved': 'APPROVED',
      'draft': 'DRAFT',
      'published': 'PUBLISHED',
      'archived': 'ARCHIVED'
    };
    return statusMap[frontendStatus] || frontendStatus;
  };

  // Load articles from API
  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await reviewQueueService.getReviewQueue(queueType, {
          status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
          search: searchTerm || undefined
        });
        
        console.log('Review queue articles loaded:', response.data.articles);
        console.log('Sample article with reviewer info:', response.data.articles.find(a => a.status === 'approved'));
        setArticles(response.data.articles);
        setFilteredArticles(response.data.articles);
      } catch (error) {
        console.error('Error loading articles:', error);
        setError(error);
        // Fallback to empty array on error
        setArticles([]);
        setFilteredArticles([]);
      } finally {
        setLoading(false);
      }
    };

    loadArticles();
  }, [queueType, selectedStatus, searchTerm]);

  // Filter and sort articles (only search filtering, status filtering is done on backend)
  useEffect(() => {
    let filtered = articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.category.toLowerCase().includes(searchTerm.toLowerCase());
      
      return matchesSearch;
    });

    // Sort articles
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'author':
          aValue = a.author.toLowerCase();
          bValue = b.author.toLowerCase();
          break;
        case 'submittedAt':
          aValue = new Date(a.submittedAt);
          bValue = new Date(b.submittedAt);
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredArticles(filtered);
  }, [articles, searchTerm, sortBy, sortOrder]);

  const handleSelectArticle = (articleId) => {
    setSelectedArticles(prev => 
      prev.includes(articleId) 
        ? prev.filter(id => id !== articleId)
        : [...prev, articleId]
    );
  };

  const handleSelectAll = () => {
    if (selectedArticles.length === filteredArticles.length) {
      setSelectedArticles([]);
    } else {
      setSelectedArticles(filteredArticles.map(article => article.id));
    }
  };

  const handleBulkAction = async (action) => {
    if (selectedArticles.length === 0) {
      alert('Please select articles to perform bulk action');
      return;
    }

    // Store the pending action and show confirmation modal
    setPendingBulkAction(action);
    setShowConfirmationModal(true);
  };

  const confirmBulkAction = async () => {
    if (!pendingBulkAction) return;

    const actionLabels = {
      'publish': 'publish',
      'approve-to-eic': 'approve for EIC review',
      'request-revision': 'request revision',
      'return-to-section': 'return to section head'
    };

    try {
      setLoading(true);
      const result = await reviewQueueService.bulkUpdateArticles(selectedArticles, pendingBulkAction);
      
      console.log(`Bulk action ${pendingBulkAction} completed:`, result);
      
      // Show success/error message
      if (result.failed === 0) {
        setSuccessMessage(`Successfully ${actionLabels[pendingBulkAction] || pendingBulkAction}ed ${result.successful} article(s)`);
        setShowSuccessModal(true);
      } else if (result.successful === 0) {
        alert(`Failed to ${actionLabels[pendingBulkAction] || pendingBulkAction} any articles. Please try again.`);
      } else {
        setSuccessMessage(`${actionLabels[pendingBulkAction] || pendingBulkAction}ed ${result.successful} article(s) successfully. ${result.failed} failed.`);
        setShowSuccessModal(true);
      }
      
      // Refresh articles after bulk action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      
      // Clear selection
    setSelectedArticles([]);
    } catch (error) {
      console.error('Error performing bulk action:', error);
      alert(`Error performing bulk action: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
      setShowConfirmationModal(false);
      setPendingBulkAction(null);
    }
  };

  const cancelBulkAction = () => {
    setShowConfirmationModal(false);
    setPendingBulkAction(null);
  };

  const handlePreview = async (article) => {
    console.log('Previewing article:', article);
    
    try {
      // Fetch the complete article data from the backend
      const response = await articlesAPI.getArticle(article.id);
      console.log('Fetched article data:', response);
      
      if (response.data) {
        const fullArticle = response.data;
        
        // Transform article data to match ArticlePreviewModal expectations
        const transformedArticle = {
          title: fullArticle.title,
          authors: (() => {
            const authors = [];
            
            // Add main author
            if (fullArticle.author) {
              authors.push({
                id: fullArticle.author.id,
                name: `${fullArticle.author.firstName} ${fullArticle.author.lastName}`.trim() || fullArticle.author.username
              });
            }
            
            // Add additional authors
            if (fullArticle.articleAuthors && fullArticle.articleAuthors.length > 0) {
              fullArticle.articleAuthors.forEach(author => {
                const authorName = `${author.user.firstName} ${author.user.lastName}`.trim() || author.user.username;
                // Avoid duplicates
                if (!authors.some(a => a.id === author.user.id)) {
                  authors.push({
                    id: author.user.id,
                    name: authorName
                  });
                }
              });
            }
            
            return authors.length > 0 ? authors : [{ name: article.author || 'Unknown Author' }];
          })(),
          publicationDate: fullArticle.publicationDate || fullArticle.createdAt,
          category: fullArticle.categories && fullArticle.categories.length > 0 
            ? fullArticle.categories[0].name 
            : 'Uncategorized',
          tags: fullArticle.tags && fullArticle.tags.length > 0 
            ? fullArticle.tags.map(tag => tag.name)
            : [],
          featuredImage: fullArticle.featuredImage || '',
          mediaCaption: fullArticle.mediaCaption || '',
          content: fullArticle.content || 'No content available.'
        };
        
        console.log('Transformed article for preview:', transformedArticle);
        setPreviewArticle(transformedArticle);
        setShowPreview(true);
      } else {
        console.error('No article data received');
        alert('Failed to load article preview');
      }
    } catch (error) {
      console.error('Error fetching article for preview:', error);
      
      let errorMessage = 'Failed to load article preview';
      if (error.response?.status === 404) {
        errorMessage = 'Article not found';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to view this article';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to view this article';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewArticle(null);
  };

  const handleApproveClick = (article) => {
    setArticleToApprove(article);
    setShowApproveModal(true);
  };

  const confirmApprove = async () => {
    if (!articleToApprove) return;

    // Check if article is in the correct status for approval
    if (articleToApprove.status !== 'in-review') {
      alert(`Cannot approve this article. Current status: ${articleToApprove.status}. Only articles in review can be approved.`);
      setShowApproveModal(false);
      setArticleToApprove(null);
      return;
    }

    try {
      console.log('Approving article:', articleToApprove);
      console.log('Article ID:', articleToApprove.id);
      console.log('Article status:', articleToApprove.status);
      
      await reviewQueueService.updateArticleStatus(articleToApprove.id, 'approve-to-eic');
      console.log(`Article ${articleToApprove.id} approved for EIC review`);
      
      // Show success message
      setSuccessMessage(`Successfully approved "${articleToApprove.title}" for EIC review`);
      setShowSuccessModal(true);
      
      // Refresh articles after action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      
    } catch (error) {
      console.error('Error approving article:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to approve article';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      }
      
      alert(`Error approving article: ${errorMessage}`);
    } finally {
      setShowApproveModal(false);
      setArticleToApprove(null);
    }
  };

  const cancelApprove = () => {
    setShowApproveModal(false);
    setArticleToApprove(null);
  };

  const handleRevisionClick = (article) => {
    setArticleToRevise(article);
    setShowRevisionModal(true);
  };

  const confirmRevision = async (feedback) => {
    if (!articleToRevise) return;

    try {
      setRevisionLoading(true);
      console.log('Requesting revision for article:', articleToRevise);
      console.log('Feedback:', feedback);
      
      await reviewQueueService.updateArticleStatus(articleToRevise.id, 'request-revision', feedback);
      console.log(`Article ${articleToRevise.id} sent for revision`);
      
      // Show success message
      setSuccessMessage(`Successfully sent "${articleToRevise.title}" back for revision`);
      setShowSuccessModal(true);
      
      // Refresh articles after action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      
    } catch (error) {
      console.error('Error requesting revision:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to request revision';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      }
      
      alert(`Error requesting revision: ${errorMessage}`);
    } finally {
      setRevisionLoading(false);
      setShowRevisionModal(false);
      setArticleToRevise(null);
    }
  };

  const cancelRevision = () => {
    setShowRevisionModal(false);
    setArticleToRevise(null);
  };

  const handlePublishClick = (article) => {
    setArticleToPublish(article);
    setShowPublishModal(true);
  };

  const confirmPublish = async () => {
    if (!articleToPublish) return;

    // Check if article is in the correct status for publishing
    if (articleToPublish.status !== 'approved') {
      alert(`Cannot publish this article. Current status: ${articleToPublish.status}. Only approved articles can be published.`);
      setShowPublishModal(false);
      setArticleToPublish(null);
      return;
    }

    try {
      console.log('Publishing article:', articleToPublish);
      console.log('Article ID:', articleToPublish.id);
      console.log('Article status:', articleToPublish.status);
      
      await reviewQueueService.updateArticleStatus(articleToPublish.id, 'publish');
      console.log(`Article ${articleToPublish.id} published`);
      
      // Show success message
      setSuccessMessage(`Successfully published "${articleToPublish.title}"`);
      setShowSuccessModal(true);
      
      // Refresh articles after action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      
    } catch (error) {
      console.error('Error publishing article:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to publish article';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      }
      
      alert(`Error publishing article: ${errorMessage}`);
    } finally {
      setShowPublishModal(false);
      setArticleToPublish(null);
    }
  };

  const cancelPublish = () => {
    setShowPublishModal(false);
    setArticleToPublish(null);
  };

  const handleReturnClick = (article) => {
    setArticleToReturn(article);
    setShowReturnModal(true);
  };

  const confirmReturn = async (feedback) => {
    if (!articleToReturn) return;

    try {
      setReturnLoading(true);
      console.log('Returning article to section head:', articleToReturn);
      console.log('Feedback:', feedback);
      
      await reviewQueueService.updateArticleStatus(articleToReturn.id, 'return-to-section', feedback);
      console.log(`Article ${articleToReturn.id} returned to section head`);
      
      // Show success message
      setSuccessMessage(`Successfully returned "${articleToReturn.title}" to section head`);
      setShowSuccessModal(true);
      
      // Refresh articles after action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      
    } catch (error) {
      console.error('Error returning article:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to return article to section head';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      }
      
      alert(`Error returning article: ${errorMessage}`);
    } finally {
      setReturnLoading(false);
      setShowReturnModal(false);
      setArticleToReturn(null);
    }
  };

  const cancelReturn = () => {
    setShowReturnModal(false);
    setArticleToReturn(null);
  };

  const handleResubmitClick = (article) => {
    setArticleToResubmit(article);
    setShowResubmitModal(true);
  };

  const confirmResubmit = async () => {
    if (!articleToResubmit) return;

    try {
      setResubmitLoading(true);
      console.log('Resubmitting article:', articleToResubmit);
      
      await reviewQueueService.updateArticleStatusDirect(articleToResubmit.id, 'IN_REVIEW');
      console.log(`Article ${articleToResubmit.id} resubmitted for review`);
      
      // Show success message
      setSuccessMessage(`Successfully resubmitted "${articleToResubmit.title}" for review`);
      setShowSuccessModal(true);
      
      // Refresh articles after action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      
    } catch (error) {
      console.error('Error resubmitting article:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      let errorMessage = 'Failed to resubmit article';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      }
      
      alert(`Error resubmitting article: ${errorMessage}`);
    } finally {
      setResubmitLoading(false);
      setShowResubmitModal(false);
      setArticleToResubmit(null);
    }
  };

  const cancelResubmit = () => {
    setShowResubmitModal(false);
    setArticleToResubmit(null);
  };

  const handleArticleAction = async (articleId, action) => {
    try {
      // Handle view action separately
      if (action === 'view') {
        const article = articles.find(a => a.id === articleId);
        if (article) {
          await handlePreview(article);
        }
        return;
      }

      // Handle edit action separately
      if (action === 'edit') {
        const article = articles.find(a => a.id === articleId);
        if (article) {
          // Navigate to review edit article page
          navigate(`/content/${articleId}/review-edit`);
        }
        return;
      }
    } catch (error) {
      console.error('Error in handleArticleAction:', error);
      setError(error);
      return;
    }

    const actionLabels = {
      'publish': 'publish',
      'approve-to-eic': 'approve for EIC review',
      'request-revision': 'request revision',
      'return-to-section': 'return to section head'
    };

    const confirmMessage = `Are you sure you want to ${actionLabels[action] || action} this article?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await reviewQueueService.updateArticleStatus(articleId, action);
      console.log(`Action ${action} completed for article ${articleId}`);
      
      // Show success message
      alert(`Successfully ${actionLabels[action] || action}ed article`);
      
      // Refresh articles after action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      
    } catch (error) {
      console.error('Error performing article action:', error);
      alert(`Error performing action: ${error.response?.data?.message || error.message}`);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'draft': '#6b7280',           // Draft
      'in-review': '#3b82f6',       // In Review (submitted by staff)
      'needs-revision': '#ef4444',  // Needs Revision (returned to staff)
      'approved': '#8b5cf6',        // Approved (by Section Head)
      'scheduled': '#f59e0b',       // Scheduled
      'published': '#10b981',       // Published
      'archived': '#6b7280'         // Archived
    };
    return colors[status] || '#6b7280';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="review-queue-container">
        <div className="review-queue-loading">
          <div className="review-queue-spinner"></div>
          <p>Loading review queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`review-queue-container ${showFilters ? 'filters-open' : ''}`}>
      {/* Header */}
      <div className="review-queue-header">
        <div className="review-queue-title-section">
          <h1 className="review-queue-title">
            {queueType === 'section-head' ? 'Section Review Queue' : 'Editor-in-Chief Review Queue'}
          </h1>
          <p className="review-queue-subtitle">
            {queueType === 'section-head' 
              ? 'Review and approve articles submitted by staff' 
              : 'Review approved articles and manage publication'
            }
          </p>
        </div>
        <div className="review-queue-stats">
          <div className="review-queue-stat">
            <span className="review-queue-stat-number">{filteredArticles.length}</span>
            <span className="review-queue-stat-label">Total Articles</span>
          </div>
          <div className="review-queue-stat-separator"></div>
          {queueType === 'section-head' ? (
            <>
              <div className="review-queue-stat">
                <span className="review-queue-stat-number">
                  {filteredArticles.filter(a => a.status === 'in-review').length}
                </span>
                <span className="review-queue-stat-label">In Review</span>
              </div>
              <div className="review-queue-stat-separator"></div>
              <div className="review-queue-stat">
                <span className="review-queue-stat-number">
                  {filteredArticles.filter(a => a.status === 'needs-revision').length}
                </span>
                <span className="review-queue-stat-label">Needs Revision</span>
              </div>
            </>
          ) : (
            <>
          <div className="review-queue-stat">
            <span className="review-queue-stat-number">
                  {filteredArticles.filter(a => a.status === 'approved').length}
            </span>
                <span className="review-queue-stat-label">Ready for Publication</span>
          </div>
          <div className="review-queue-stat-separator"></div>
          <div className="review-queue-stat">
            <span className="review-queue-stat-number">
                  {filteredArticles.filter(a => a.status === 'needs-revision').length}
            </span>
                <span className="review-queue-stat-label">Needs Revision</span>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="review-queue-control-bar">
        <div className="review-queue-controls-left">
          <div className="review-queue-search-container">
            <svg className="review-queue-search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search articles, authors, or categories..."
              className="review-queue-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            className={`review-queue-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <svg className="review-queue-filter-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
          </button>
        </div>

        <div className="review-queue-controls-right">
          {selectedArticles.length > 0 && (
            <div className="review-queue-bulk-actions">
              <span className="review-queue-selected-count">
                {selectedArticles.length} selected
              </span>
              <button
                className="review-queue-bulk-btn"
                onClick={() => handleBulkAction('publish')}
                disabled={loading}
              >
                {loading ? 'Publishing...' : 'Publish Articles'}
                  </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="review-queue-filters">
          <div className="review-queue-filter-group">
            <label className="review-queue-filter-label">Status</label>
            <select
              className="review-queue-filter-select"
              value={selectedStatus}
              onChange={(e) => {
                console.log('Status filter changed to:', e.target.value);
                setSelectedStatus(e.target.value);
              }}
            >
              <option value="all">All Statuses</option>
              {queueType === 'section-head' ? (
                <>
                  <option value="in-review">In Review</option>
                  <option value="needs-revision">Needs Revision</option>
                </>
              ) : (
                <>
                  <option value="approved">Approved for Publication</option>
                </>
              )}
            </select>
          </div>


          <div className="review-queue-filter-group">
            <label className="review-queue-filter-label">Sort By</label>
            <select
              className="review-queue-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="submittedAt">Submission Date</option>
              <option value="title">Title</option>
              <option value="author">Author</option>
            </select>
          </div>

          <div className="review-queue-filter-group">
            <label className="review-queue-filter-label">Order</label>
            <select
              className="review-queue-filter-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>
      )}

      {/* Articles List */}
      <div className="review-queue-list">
        {filteredArticles.length === 0 ? (
          <div className="review-queue-empty">
            <svg className="review-queue-empty-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="review-queue-empty-title">No articles found</h3>
            <p className="review-queue-empty-description">
              {searchTerm || selectedStatus !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'No articles have been submitted for review yet.'}
            </p>
          </div>
        ) : (
          <div className="review-queue-table">
            <div className="review-queue-table-header">
              <div className="review-queue-table-cell checkbox-cell">
                <input
                  type="checkbox"
                  checked={selectedArticles.length === filteredArticles.length && filteredArticles.length > 0}
                  onChange={handleSelectAll}
                />
              </div>
              <div className="review-queue-table-cell">Image</div>
              <div className="review-queue-table-cell">Article</div>
              <div className="review-queue-table-cell">Author</div>
              <div className="review-queue-table-cell">Status</div>
              <div className="review-queue-table-cell">Submitted</div>
              <div className="review-queue-table-cell">Actions</div>
            </div>

            {filteredArticles.map((article) => (
              <div key={article.id} className="review-queue-table-row">
                <div className="review-queue-table-cell checkbox-cell">
                  <input
                    type="checkbox"
                    checked={selectedArticles.includes(article.id)}
                    onChange={() => handleSelectArticle(article.id)}
                  />
                </div>
                
                <div className="review-queue-table-cell image-cell">
                  {article.featuredImage ? (
                    <div className="review-queue-article-image">
                      <img 
                        src={article.featuredImage} 
                        alt={article.title}
                        className="review-queue-featured-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="review-queue-article-icon" style={{ display: 'none' }}>
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="review-queue-article-icon">
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <div className="review-queue-table-cell article-cell">
                  <div className="review-queue-article-info">
                    <h4 className="review-queue-article-title">{article.title}</h4>
                    <p className="review-queue-article-excerpt">{article.excerpt}</p>
                    <div className="review-queue-article-meta">
                      <span className="review-queue-article-category">{article.category}</span>
                      <span className="review-queue-article-separator">•</span>
                      <span className="review-queue-article-word-count">{article.wordCount} words</span>
                      <span className="review-queue-article-separator">•</span>
                      <span className="review-queue-article-read-time">{article.estimatedReadTime}</span>
                    </div>
                    <div className="review-queue-article-tags">
                      {article.tags.map((tag, index) => (
                        <span key={index} className="review-queue-tag">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="review-queue-table-cell">
                    <span className="review-queue-author-name">{article.author}</span>
                </div>

                <div className="review-queue-table-cell">
                  <span
                    className="review-queue-status-badge"
                    style={{ backgroundColor: getStatusColor(article.status) }}
                  >
                    {article.status === 'draft' ? 'Draft' :
                     article.status === 'in-review' ? 'In Review' :
                     article.status === 'needs-revision' ? 'Needs Revision' :
                     article.status === 'approved' ? 'Approved' :
                     article.status === 'scheduled' ? 'Scheduled' :
                     article.status === 'published' ? 'Published' :
                     article.status === 'archived' ? 'Archived' : article.status}
                  </span>
                  {article.status === 'approved' && (
                    <div className="review-queue-reviewer">
                      <span className="review-queue-reviewer-label">Approved by:</span>
                      <span 
                        className="review-queue-reviewer-name" 
                        title={article.reviewer || article.sectionHead || 'Unknown'}
                      >
                        {article.reviewer || article.sectionHead || 'Unknown'}
                      </span>
                    </div>
                  )}
                  {article.reviewer && article.status === 'needs-revision' && (
                    <div className="review-queue-reviewer">
                      <span className="review-queue-reviewer-label">Revision requested by:</span>
                      <span 
                        className="review-queue-reviewer-name" 
                        title={article.reviewer}
                      >
                        {article.reviewer}
                      </span>
                    </div>
                  )}
                  {article.sectionHead && !article.reviewer && (
                    <div className="review-queue-reviewer">
                      <span className="review-queue-reviewer-label">Section Head:</span>
                      <span 
                        className="review-queue-reviewer-name" 
                        title={article.sectionHead}
                      >
                        {article.sectionHead}
                      </span>
                    </div>
                  )}
                </div>

                <div className="review-queue-table-cell">
                  <div className="review-queue-date">
                    {formatDate(article.submittedAt)}
                  </div>
                </div>

                <div className="review-queue-table-cell">
                  <div className="review-queue-actions">
                    <button
                      className="review-queue-action-btn"
                      onClick={() => handleArticleAction(article.id, 'view')}
                      title="View Article"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    
                    {/* Workflow-specific actions based on status */}
                    {article.status === 'in-review' && (
                      <>
                        <button
                          className="review-queue-action-btn"
                          onClick={() => handleApproveClick(article)}
                          title="Approve for EIC Review"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          className="review-queue-action-btn"
                          onClick={() => handleRevisionClick(article)}
                          title="Request Revision"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                          </svg>
                        </button>
                      </>
                    )}
                    
                    {article.status === 'approved' && (
                      <>
                        <button
                          className="review-queue-action-btn"
                          onClick={() => handlePublishClick(article)}
                          title="Publish Article"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                        </button>
                        <button
                          className="review-queue-action-btn"
                          onClick={() => handleReturnClick(article)}
                          title="Return to Section Head"
                        >
                          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </>
                    )}
                    
                    {article.status === 'needs-revision' && (
                      <button
                        className="review-queue-action-btn"
                        onClick={() => handleResubmitClick(article)}
                        title="Resubmit for Review"
                      >
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                    
                    <button
                      className="review-queue-action-btn"
                      onClick={() => handleArticleAction(article.id, 'edit')}
                      title="Edit"
                    >
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmationModal}
        onClose={cancelBulkAction}
        onConfirm={confirmBulkAction}
        title="Confirm Bulk Action"
        message={`Are you sure you want to publish ${selectedArticles.length} article(s)? This action cannot be undone.`}
        confirmText="Publish Articles"
        cancelText="Cancel"
        type="warning"
        isLoading={loading}
      />

      {/* Preview Modal */}
      {previewArticle && createPortal(
        <ArticlePreviewModal
          isOpen={showPreview}
          onClose={handleClosePreview}
          articleData={previewArticle}
        />,
        document.body
      )}

      {/* Approve Modal */}
      {showApproveModal && articleToApprove && (
        <div className="simple-approve-modal-overlay">
          <div className="simple-approve-modal">
            <div className="simple-approve-modal-header">
              <h3 className="simple-approve-modal-title">Approve Article</h3>
              <button
                onClick={cancelApprove}
                className="simple-approve-modal-close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="simple-approve-modal-content">
              <p className="simple-approve-warning-text">
                Are you sure you want to approve <strong>"{articleToApprove.title}"</strong> for EIC review?
              </p>
              <p className="simple-approve-details">
                Author: {articleToApprove.author} • Category: {articleToApprove.category}
              </p>
              <p className="simple-approve-note">
                This will send the article to the Editor-in-Chief for final review.
              </p>
            </div>
            
            <div className="simple-approve-modal-buttons">
              <button
                onClick={cancelApprove}
                className="simple-approve-modal-button cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmApprove}
                className="simple-approve-modal-button approve"
              >
                Approve for EIC
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={successMessage}
        buttonText="OK"
      />

      {/* Request Revision Modal */}
      {showRevisionModal && articleToRevise && (
        <RequestRevisionModal
          isOpen={showRevisionModal}
          onClose={cancelRevision}
          onConfirm={confirmRevision}
          article={articleToRevise}
          isLoading={revisionLoading}
        />
      )}

      {/* Return to Section Modal */}
      {showReturnModal && articleToReturn && (
        <ReturnToSectionModal
          isOpen={showReturnModal}
          onClose={cancelReturn}
          onConfirm={confirmReturn}
          article={articleToReturn}
          isLoading={returnLoading}
        />
      )}

      {/* Resubmit Modal */}
      {showResubmitModal && articleToResubmit && (
        <ResubmitModal
          isOpen={showResubmitModal}
          onClose={cancelResubmit}
          onConfirm={confirmResubmit}
          article={articleToResubmit}
          isLoading={resubmitLoading}
        />
      )}

      {/* Publish Modal */}
      {showPublishModal && articleToPublish && (
        <div className="simple-publish-modal-overlay">
          <div className="simple-publish-modal">
            <div className="simple-publish-modal-header">
              <h3 className="simple-publish-modal-title">Publish Article</h3>
              <button
                onClick={cancelPublish}
                className="simple-publish-modal-close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="simple-publish-modal-content">
              <p className="simple-publish-warning-text">
                Are you sure you want to publish <strong>"{articleToPublish.title}"</strong>?
              </p>
              <p className="simple-publish-details">
                Author: {articleToPublish.author} • Category: {articleToPublish.category}
              </p>
              <p className="simple-publish-note">
                This will make the article live and visible to readers. This action cannot be undone.
              </p>
            </div>
            
            <div className="simple-publish-modal-buttons">
              <button
                onClick={cancelPublish}
                className="simple-publish-modal-button cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmPublish}
                className="simple-publish-modal-button publish"
              >
                Publish Article
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
