import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { 
  DocumentTextIcon, 
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import { 
  ClipboardDocumentCheckIcon as ClipboardDocumentCheckIconSolid,
} from '@heroicons/react/24/solid';
import '../styles/review-queue.css';
import '../styles/filter-modal.css';
import { reviewQueueService } from '../services/reviewQueueService';
import { articlesAPI, categoriesAPI } from '../services/apiService';
import { useNotifications } from './NotificationBell';
import { trackArticleApproval, trackArticleRejection, trackError } from '../config/analytics';
import ConfirmationModal from './ConfirmationModal';
import ArticlePreviewModal from './ArticlePreviewModal';
import SuccessModal from './SuccessModal';
import RequestRevisionModal from './RequestRevisionModal';
import ReturnToSectionModal from './ReturnToSectionModal';
import ResubmitModal from './ResubmitModal';
import FilterModal from './FilterModal';

const ReviewQueue = ({ queueType = 'section-head' }) => {
  const navigate = useNavigate();
  const notifications = useNotifications();
  const addNotification = notifications?.addNotification || (() => {
    console.warn('addNotification not available - notifications may not work properly');
  });
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('submittedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedArticles, setSelectedArticles] = useState([]);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [articleToApprove, setArticleToApprove] = useState(null);
  const [approveLoading, setApproveLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [articleToRevise, setArticleToRevise] = useState(null);
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [articleToPublish, setArticleToPublish] = useState(null);
  const [publishLoading, setPublishLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [articleToReturn, setArticleToReturn] = useState(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [articleToResubmit, setArticleToResubmit] = useState(null);
  const [resubmitLoading, setResubmitLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

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

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        setLoadingCategories(true);
        const response = await categoriesAPI.getCategories();
        const categoriesData = response.data?.items || response.items || [];
        setCategories(categoriesData);
        console.log('Categories loaded for review queue:', categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      } finally {
        setLoadingCategories(false);
      }
    };

    loadCategories();
  }, []);

  // Load articles from API
  useEffect(() => {
    const loadArticles = async () => {
      try {
        setError(null);
        const response = await reviewQueueService.getReviewQueue(queueType, {
          status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
          search: searchTerm || undefined,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          sortBy: sortBy,
          sortOrder: sortOrder
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
      }
    };

    loadArticles();
  }, [queueType, selectedStatus, selectedCategory, searchTerm, sortBy, sortOrder]);

  // No need for frontend filtering/sorting since we're using database operations

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
      setBulkLoading(true);
      
      // Add timeout handling for slow operations
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - operation is taking longer than expected')), 30000)
      );
      
      const bulkPromise = reviewQueueService.bulkUpdateArticles(selectedArticles, pendingBulkAction);
      
      const result = await Promise.race([bulkPromise, timeoutPromise]);
      
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
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      setSelectedArticles([]);
      
    } catch (error) {
      console.error('Error performing bulk action:', error);
      
      if (error.message.includes('timeout')) {
        // Show processing message instead of error
        setSuccessMessage(`Processing bulk ${actionLabels[pendingBulkAction] || pendingBulkAction} for ${selectedArticles.length} article(s)... This may take a moment. The page will refresh automatically to show the result.`);
        setShowSuccessModal(true);
        
        // Auto-refresh after 5 seconds
        setTimeout(async () => {
          try {
            const response = await reviewQueueService.getReviewQueue(queueType, {
              status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
              search: searchTerm || undefined,
              category: selectedCategory !== 'all' ? selectedCategory : undefined
            });
            setArticles(response.data.articles);
            setFilteredArticles(response.data.articles);
            setSelectedArticles([]);
            setShowSuccessModal(false);
          } catch (refreshError) {
            console.error('Error refreshing articles:', refreshError);
          }
        }, 5000);
      } else {
        alert(`Error performing bulk action: ${error.response?.data?.message || error.message}`);
      }
    } finally {
      setShowConfirmationModal(false);
      setPendingBulkAction(null);
      setBulkLoading(false);
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
      setApproveLoading(true);
      console.log('Approving article:', articleToApprove);
      console.log('Article ID:', articleToApprove.id);
      console.log('Article status:', articleToApprove.status);
      
      // Add timeout handling for slow operations
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - operation is taking longer than expected')), 20000)
      );
      
      const approvePromise = reviewQueueService.updateArticleStatus(articleToApprove.id, 'approve-to-eic');
      
      await Promise.race([approvePromise, timeoutPromise]);
      console.log(`Article ${articleToApprove.id} approved for EIC review`);
      
      // Track article approval
      trackArticleApproval(
        articleToApprove.id,
        articleToApprove.title,
        articleToApprove.category?.name || 'Uncategorized'
      );
      
      // Add notification for article approval
      try {
        addNotification({
          type: 'approval',
          title: 'Article Approved',
          message: `Your article "${articleToApprove.title}" has been approved by Section Head and forwarded to Editor-in-Chief for final review.`,
          articleTitle: articleToApprove.title,
          articleId: articleToApprove.id
        });
      } catch (notificationError) {
        console.warn('Failed to add notification:', notificationError);
      }
      
      // Show success message
      setSuccessMessage(`Successfully approved "${articleToApprove.title}" for EIC review`);
      setShowSuccessModal(true);
      
      // Refresh articles after action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      
    } catch (error) {
      console.error('Error approving article:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      // Track approval error
      trackError(
        error.response?.data?.message || 'Article approval failed',
        'ARTICLE_APPROVAL_ERROR',
        'review-queue'
      );
      
      if (error.message.includes('timeout')) {
        // Show processing message instead of error
        setSuccessMessage(`Processing approval for "${articleToApprove.title}"... This may take a moment. The page will refresh automatically to show the result.`);
        setShowSuccessModal(true);
        
        // Auto-refresh after 3 seconds
        setTimeout(async () => {
          try {
            const response = await reviewQueueService.getReviewQueue(queueType, {
              status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
              search: searchTerm || undefined,
              category: selectedCategory !== 'all' ? selectedCategory : undefined
            });
            setArticles(response.data.articles);
            setFilteredArticles(response.data.articles);
            setShowSuccessModal(false);
          } catch (refreshError) {
            console.error('Error refreshing articles:', refreshError);
          }
        }, 3000);
      } else {
        let errorMessage = 'Failed to approve article';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.errors) {
          errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
        }
        
        alert(`Error approving article: ${errorMessage}`);
      }
    } finally {
      setApproveLoading(false);
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
      
      // Add timeout handling for slow operations
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - operation is taking longer than expected')), 20000)
      );
      
      const revisionPromise = reviewQueueService.updateArticleStatus(articleToRevise.id, 'request-revision', feedback);
      
      await Promise.race([revisionPromise, timeoutPromise]);
      console.log(`Article ${articleToRevise.id} sent for revision`);
      
      // Track article rejection/revision request
      trackArticleRejection(
        articleToRevise.id,
        articleToRevise.title,
        articleToRevise.category?.name || 'Uncategorized',
        'revision_requested'
      );
      
      // Add notification for revision request
      try {
        addNotification({
          type: 'rejection',
          title: 'Revision Required',
          message: `Your article "${articleToRevise.title}" needs revision. ${feedback ? `Feedback: ${feedback}` : 'Please check the feedback section for details.'}`,
          articleTitle: articleToRevise.title,
          articleId: articleToRevise.id
        });
      } catch (notificationError) {
        console.warn('Failed to add notification:', notificationError);
      }
      
      // Show success message
      setSuccessMessage(`Successfully sent "${articleToRevise.title}" back for revision`);
      setShowSuccessModal(true);
      
      // Refresh articles after action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      
    } catch (error) {
      console.error('Error requesting revision:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.message.includes('timeout')) {
        // Show processing message instead of error
        setSuccessMessage(`Processing revision request for "${articleToRevise.title}"... This may take a moment. The page will refresh automatically to show the result.`);
        setShowSuccessModal(true);
        
        // Auto-refresh after 3 seconds
        setTimeout(async () => {
          try {
            const response = await reviewQueueService.getReviewQueue(queueType, {
              status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
              search: searchTerm || undefined,
              category: selectedCategory !== 'all' ? selectedCategory : undefined
            });
            setArticles(response.data.articles);
            setFilteredArticles(response.data.articles);
            setShowSuccessModal(false);
          } catch (refreshError) {
            console.error('Error refreshing articles:', refreshError);
          }
        }, 3000);
      } else {
        let errorMessage = 'Failed to request revision';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.errors) {
          errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
        }
        
        alert(`Error requesting revision: ${errorMessage}`);
      }
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
      setPublishLoading(true);
      console.log('Publishing article:', articleToPublish);
      console.log('Article ID:', articleToPublish.id);
      console.log('Article status:', articleToPublish.status);
      
      // Add timeout handling for slow operations
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - operation is taking longer than expected')), 20000)
      );
      
      const publishPromise = reviewQueueService.updateArticleStatus(articleToPublish.id, 'publish');
      
      await Promise.race([publishPromise, timeoutPromise]);
      console.log(`Article ${articleToPublish.id} published`);
      
      // Add notification for article publication
      try {
        addNotification({
          type: 'approval',
          title: 'Article Published',
          message: `Congratulations! Your article "${articleToPublish.title}" has been published and is now live.`,
          articleTitle: articleToPublish.title,
          articleId: articleToPublish.id
        });
      } catch (notificationError) {
        console.warn('Failed to add notification:', notificationError);
      }
      
      // Show success message
      setSuccessMessage(`Successfully published "${articleToPublish.title}"`);
      setShowSuccessModal(true);
      
      // Refresh articles after action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      
    } catch (error) {
      console.error('Error publishing article:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.message.includes('timeout')) {
        // Show processing message instead of error
        setSuccessMessage(`Processing publication for "${articleToPublish.title}"... This may take a moment. The page will refresh automatically to show the result.`);
        setShowSuccessModal(true);
        
        // Auto-refresh after 3 seconds
        setTimeout(async () => {
          try {
            const response = await reviewQueueService.getReviewQueue(queueType, {
              status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
              search: searchTerm || undefined,
              category: selectedCategory !== 'all' ? selectedCategory : undefined
            });
            setArticles(response.data.articles);
            setFilteredArticles(response.data.articles);
            setShowSuccessModal(false);
          } catch (refreshError) {
            console.error('Error refreshing articles:', refreshError);
          }
        }, 3000);
      } else {
        let errorMessage = 'Failed to publish article';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.errors) {
          errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
        }
        
        alert(`Error publishing article: ${errorMessage}`);
      }
    } finally {
      setPublishLoading(false);
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
      
      // Add notification for article return
      try {
        addNotification({
          type: 'return',
          title: 'Article Returned',
          message: `Your article "${articleToReturn.title}" has been returned to Section Head for further review. ${feedback ? `Feedback: ${feedback}` : ''}`,
          articleTitle: articleToReturn.title,
          articleId: articleToReturn.id
        });
      } catch (notificationError) {
        console.warn('Failed to add notification:', notificationError);
      }
      
      // Show success message
      setSuccessMessage(`Successfully returned "${articleToReturn.title}" to section head`);
      setShowSuccessModal(true);
      
      // Refresh articles after action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
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
      
      // Add timeout handling for slow operations
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout - operation is taking longer than expected')), 20000)
      );
      
      const resubmitPromise = reviewQueueService.updateArticleStatusDirect(articleToResubmit.id, 'IN_REVIEW');
      
      await Promise.race([resubmitPromise, timeoutPromise]);
      console.log(`Article ${articleToResubmit.id} resubmitted for review`);
      
      // Show success message
      setSuccessMessage(`Successfully resubmitted "${articleToResubmit.title}" for review`);
      setShowSuccessModal(true);
      
      // Refresh articles after action
      const response = await reviewQueueService.getReviewQueue(queueType, {
        status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
      });
      setArticles(response.data.articles);
      setFilteredArticles(response.data.articles);
      
    } catch (error) {
      console.error('Error resubmitting article:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      
      if (error.message.includes('timeout')) {
        // Show processing message instead of error
        setSuccessMessage(`Processing resubmission for "${articleToResubmit.title}"... This may take a moment. The page will refresh automatically to show the result.`);
        setShowSuccessModal(true);
        
        // Auto-refresh after 3 seconds
        setTimeout(async () => {
          try {
            const response = await reviewQueueService.getReviewQueue(queueType, {
              status: selectedStatus !== 'all' ? mapFrontendStatusToBackend(selectedStatus) : undefined,
              search: searchTerm || undefined,
              category: selectedCategory !== 'all' ? selectedCategory : undefined
            });
            setArticles(response.data.articles);
            setFilteredArticles(response.data.articles);
            setShowSuccessModal(false);
          } catch (refreshError) {
            console.error('Error refreshing articles:', refreshError);
          }
        }, 3000);
      } else {
        let errorMessage = 'Failed to resubmit article';
        if (error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error.response?.data?.errors) {
          errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
        }
        
        alert(`Error resubmitting article: ${errorMessage}`);
      }
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
        search: searchTerm || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined
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

  const getStatusLabel = (status) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'Published';
      case 'in-review':
        return 'Under Review';
      case 'draft':
        return 'Draft';
      case 'needs-revision':
        return 'Needs Revision';
      case 'approved':
        return 'Approved';
      case 'scheduled':
        return 'Scheduled';
      case 'archived':
        return 'Archived';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'published':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'in-review':
        return <ClockIcon className="w-4 h-4" />;
      case 'draft':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'needs-revision':
        return <ExclamationTriangleIcon className="w-4 h-4" />;
      case 'approved':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'scheduled':
        return <CalendarIcon className="w-4 h-4" />;
      case 'archived':
        return <DocumentTextIcon className="w-4 h-4" />;
      default:
        return <DocumentTextIcon className="w-4 h-4" />;
    }
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


  return (
    <div className="review-queue-container">
      {/* Header */}
      <div className="review-queue-header">
        <div className="flex items-center space-x-4">
          <div>
            <ClipboardDocumentCheckIconSolid className="h-8 w-8 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">
              {queueType === 'section-head' ? 'Section Review Queue' : 'Administrator\'s Review Queue'}
            </h1>
            <p className="text-gray-600">
              {queueType === 'section-head' 
                ? 'Review and approve articles submitted by staff' 
                : 'Review approved articles and manage publication'
              }
            </p>
          </div>
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
            className={`review-queue-filter-btn ${showFilterModal ? 'active' : ''}`}
            onClick={() => setShowFilterModal(!showFilterModal)}
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
              >
                Publish Articles
                  </button>
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title={queueType === 'section-head' ? 'Filter Section Review Queue' : 'Filter Administrator\'s Review Queue'}
        onApply={() => setShowFilterModal(false)}
        onClear={() => {
          setSelectedStatus('all');
          setSelectedCategory('all');
          setSortBy('submittedAt');
          setSortOrder('desc');
        }}
      >
        {/* Left Column - Category */}
        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Category</h4>
          <div className="filter-modal-radio-group">
            <label className={`filter-modal-radio-item ${selectedCategory === 'all' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="category"
                value="all"
                checked={selectedCategory === 'all'}
                onChange={(e) => {
                  console.log('Category filter changed to:', e.target.value);
                  setSelectedCategory(e.target.value);
                }}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">All Categories</span>
            </label>
            {loadingCategories ? (
              <div className="filter-modal-loading">Loading categories...</div>
            ) : (
              categories.map((category) => (
                <label 
                  key={category.id} 
                  className={`filter-modal-radio-item ${selectedCategory === category.name ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={category.name}
                    checked={selectedCategory === category.name}
                    onChange={(e) => {
                      console.log('Category filter changed to:', e.target.value);
                      setSelectedCategory(e.target.value);
                    }}
                    className="filter-modal-radio-input"
                  />
                  <span className="filter-modal-radio-label">{category.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {/* Right Column - Status */}
        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Status</h4>
          <div className="filter-modal-radio-group">
            <label className={`filter-modal-radio-item ${selectedStatus === 'all' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="status"
                value="all"
                checked={selectedStatus === 'all'}
                onChange={(e) => {
                  console.log('Status filter changed to:', e.target.value);
                  setSelectedStatus(e.target.value);
                }}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">All Statuses</span>
            </label>
            {queueType === 'section-head' ? (
              <>
                <label className={`filter-modal-radio-item ${selectedStatus === 'in-review' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="status"
                    value="in-review"
                    checked={selectedStatus === 'in-review'}
                    onChange={(e) => {
                      console.log('Status filter changed to:', e.target.value);
                      setSelectedStatus(e.target.value);
                    }}
                    className="filter-modal-radio-input"
                  />
                  <span className="filter-modal-radio-label">In Review</span>
                </label>
                <label className={`filter-modal-radio-item ${selectedStatus === 'needs-revision' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="status"
                    value="needs-revision"
                    checked={selectedStatus === 'needs-revision'}
                    onChange={(e) => {
                      console.log('Status filter changed to:', e.target.value);
                      setSelectedStatus(e.target.value);
                    }}
                    className="filter-modal-radio-input"
                  />
                  <span className="filter-modal-radio-label">Needs Revision</span>
                </label>
              </>
            ) : (
              <>
                <label className={`filter-modal-radio-item ${selectedStatus === 'approved' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="status"
                    value="approved"
                    checked={selectedStatus === 'approved'}
                    onChange={(e) => {
                      console.log('Status filter changed to:', e.target.value);
                      setSelectedStatus(e.target.value);
                    }}
                    className="filter-modal-radio-input"
                  />
                  <span className="filter-modal-radio-label">Approved for Publication</span>
                </label>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Sort By */}
        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Sort By</h4>
          <div className="filter-modal-radio-group">
            <label className={`filter-modal-radio-item ${sortBy === 'submittedAt' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortBy"
                value="submittedAt"
                checked={sortBy === 'submittedAt'}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Submission Date</span>
            </label>
            <label className={`filter-modal-radio-item ${sortBy === 'title' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortBy"
                value="title"
                checked={sortBy === 'title'}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Title</span>
            </label>
            <label className={`filter-modal-radio-item ${sortBy === 'author' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortBy"
                value="author"
                checked={sortBy === 'author'}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Author</span>
            </label>
          </div>
        </div>

        {/* Right Column - Order */}
        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Order</h4>
          <div className="filter-modal-radio-group">
            <label className={`filter-modal-radio-item ${sortOrder === 'desc' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortOrder"
                value="desc"
                checked={sortOrder === 'desc'}
                onChange={(e) => setSortOrder(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Descending</span>
            </label>
            <label className={`filter-modal-radio-item ${sortOrder === 'asc' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortOrder"
                value="asc"
                checked={sortOrder === 'asc'}
                onChange={(e) => setSortOrder(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Ascending</span>
            </label>
          </div>
        </div>
      </FilterModal>

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
                      {(() => {
                        const mediaUrl = article.featuredImage;
                        const isVideo = /\.(mp4|webm|ogg|avi|mov|quicktime)$/i.test(mediaUrl) || 
                                       mediaUrl.includes('video/') ||
                                       mediaUrl.includes('.mp4') ||
                                       mediaUrl.includes('.webm') ||
                                       mediaUrl.includes('.ogg');
                        
                        if (isVideo) {
                          return (
                            <video 
                              src={mediaUrl} 
                              className="review-queue-featured-image"
                              onError={(e) => {
                                console.error('Video failed to load:', mediaUrl);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            >
                              Your browser does not support the video tag.
                            </video>
                          );
                        } else {
                          return (
                            <img 
                              src={mediaUrl} 
                              alt={article.title}
                              className="review-queue-featured-image"
                              onError={(e) => {
                                console.error('Image failed to load:', mediaUrl);
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          );
                        }
                      })()}
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
                  <div className="review-queue-status-container">
                  <span
                    className="review-queue-status-badge"
                    style={{ backgroundColor: getStatusColor(article.status) }}
                  >
                      {getStatusIcon(article.status)}
                      {getStatusLabel(article.status)}
                  </span>
                    
                    {/* Show reviewer information for relevant statuses */}
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
                      title="View Content"
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
                          title="Publish Content"
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
              <h3 className="simple-approve-modal-title">Approve Content</h3>
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
                disabled={approveLoading}
              >
                {approveLoading ? (
                  <>
                    <div className="simple-approve-spinner"></div>
                    Approving...
                  </>
                ) : (
                  'Approve for EIC'
                )}
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
              <h3 className="simple-publish-modal-title">Publish Content</h3>
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
                This will make the content live and visible to readers. This action cannot be undone.
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
                disabled={publishLoading}
              >
                {publishLoading ? (
                  <>
                    <div className="simple-publish-spinner"></div>
                    Publishing...
                  </>
                ) : (
                  'Publish Content'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewQueue;
