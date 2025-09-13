import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { articlesAPI, categoriesAPI } from '../services/apiService';
import ArticlePreviewModal from '../components/ArticlePreviewModal';
import NotificationModal from '../components/NotificationModal';
import ConfirmationModal from '../components/ConfirmationModal';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import '../styles/mycontent.css';

const MyContent = () => {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [authorRoleFilter, setAuthorRoleFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [showAdditionalFilters, setShowAdditionalFilters] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ title: '', message: '', type: 'success' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [articleToArchive, setArticleToArchive] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [articleToRestore, setArticleToRestore] = useState(null);
  const { user } = useAuth();

  // Notification modal helper functions
  const showNotification = (title, message, type = 'success') => {
    setNotificationData({ title, message, type });
    setShowNotificationModal(true);
  };

  const closeNotification = () => {
    setShowNotificationModal(false);
    setNotificationData({ title: '', message: '', type: 'success' });
  };

  // Debug logging
  console.log('MyContent component rendered');
  console.log('Articles:', articles);
  console.log('Loading:', loading);
  console.log('Error:', error);

  // Fetch user's articles and categories when component mounts
  useEffect(() => {
    if (user?.id) {
      fetchMyContent();
      fetchCategories();
    }
  }, [user?.id]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      setCategories(response.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchMyContent = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await articlesAPI.getMyContent({ authorId: user?.id });
      console.log('Fetched articles response:', response);
      console.log('Sample article with categories:', response.data?.items?.[0]);
      
      // Transform the data to match the expected structure
      const transformedArticles = (response.data?.items || []).map(article => {
        // Determine if current user is primary author or co-author
        const isPrimaryAuthor = article.authorId === user?.id;
        const isCoAuthor = article.articleAuthors?.some(aa => aa.user.id === user?.id);
        
        console.log(`Article ${article.id} (${article.title}) author role analysis:`, {
          userId: user?.id,
          authorId: article.authorId,
          isPrimaryAuthor: isPrimaryAuthor,
          isCoAuthor: isCoAuthor,
          coAuthors: article.articleAuthors?.map(aa => ({ id: aa.user.id, name: aa.user.firstName + ' ' + aa.user.lastName }))
        });
        
        // Get all authors (primary + co-authors) with unique IDs
        const authorMap = new Map();
        
        // Add primary author
        authorMap.set(article.author.id, {
          id: article.author.id,
          name: `${article.author.firstName} ${article.author.lastName}`.trim() || article.author.username,
          isPrimary: true
        });
        
        // Add co-authors (this will overwrite if same user is both primary and co-author)
        if (article.articleAuthors && article.articleAuthors.length > 0) {
          article.articleAuthors.forEach(aa => {
            authorMap.set(aa.user.id, {
              id: aa.user.id,
              name: `${aa.user.firstName} ${aa.user.lastName}`.trim() || aa.user.username,
              isPrimary: false
            });
          });
        }
        
        const allAuthors = Array.from(authorMap.values());

        return {
          id: article.id,
          title: article.title,
          status: article.status?.toLowerCase() || 'draft',
          author: { 
            name: isPrimaryAuthor 
              ? `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Unknown Author'
              : allAuthors.find(a => a.id === user?.id)?.name || 'Unknown Author',
            isPrimary: isPrimaryAuthor,
            isCoAuthor: !isPrimaryAuthor && isCoAuthor
          },
          allAuthors: allAuthors, // Include all authors for display
          viewCount: article.viewCount || 0,
          createdAt: article.createdAt,
          excerpt: article.excerpt || article.title, // Use title as excerpt if no excerpt
          categories: article.categories || [], // Use categories from backend
          tags: article.tags || [] // Use tags from backend
        };
      });
      
      setArticles(transformedArticles);
    } catch (error) {
      console.error('Failed to fetch my content:', error);
      setError('Failed to load your content');
      setArticles([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    // Store the article ID and show confirmation modal
    setArticleToDelete(articleId);
    setShowConfirmModal(true);
  };

  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;

    try {
      await articlesAPI.deleteArticle(articleToDelete);
      // Remove from local state after successful deletion
      setArticles(articles.filter(article => article.id !== articleToDelete));
      console.log('Article deleted successfully');
      
      // Show success notification
      showNotification('Success', 'Article deleted successfully', 'success');
    } catch (error) {
      console.error('Failed to delete article:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to delete article. Please try again.';
      if (error.response?.status === 403) {
        errorMessage = 'You can only delete your own articles.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Article not found.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to delete articles.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      // Show error notification
      showNotification('Error', errorMessage, 'error');
    } finally {
      // Reset confirmation modal state
      setShowConfirmModal(false);
      setArticleToDelete(null);
    }
  };

  const cancelDeleteArticle = () => {
    setShowConfirmModal(false);
    setArticleToDelete(null);
  };

  const handleArchiveArticle = async (articleId) => {
    setArticleToArchive(articleId);
    setShowArchiveModal(true);
  };

  const confirmArchiveArticle = async () => {
    if (!articleToArchive) return;

    try {
      await articlesAPI.updateArticleStatus(articleToArchive, 'ARCHIVED');
      // Update local state
      setArticles(articles.map(article => 
        article.id === articleToArchive 
          ? { ...article, status: 'archived' }
          : article
      ));
      
      showNotification('Success', 'Article archived successfully', 'success');
    } catch (error) {
      console.error('Failed to archive article:', error);
      
      let errorMessage = 'Failed to archive article. Please try again.';
      if (error.response?.status === 403) {
        errorMessage = 'You can only archive your own articles.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Article not found.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to archive articles.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showNotification('Error', errorMessage, 'error');
    } finally {
      setShowArchiveModal(false);
      setArticleToArchive(null);
    }
  };

  const cancelArchiveArticle = () => {
    setShowArchiveModal(false);
    setArticleToArchive(null);
  };

  const handleRestoreArticle = async (articleId) => {
    setArticleToRestore(articleId);
    setShowRestoreModal(true);
  };

  const confirmRestoreArticle = async () => {
    if (!articleToRestore) return;

    try {
      await articlesAPI.updateArticleStatus(articleToRestore, 'DRAFT');
      // Update local state
      setArticles(articles.map(article => 
        article.id === articleToRestore 
          ? { ...article, status: 'draft' }
          : article
      ));
      
      showNotification('Success', 'Article restored to draft successfully', 'success');
    } catch (error) {
      console.error('Failed to restore article:', error);
      
      let errorMessage = 'Failed to restore article. Please try again.';
      if (error.response?.status === 403) {
        errorMessage = 'You can only restore your own articles.';
      } else if (error.response?.status === 404) {
        errorMessage = 'Article not found.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Please log in to restore articles.';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      showNotification('Error', errorMessage, 'error');
    } finally {
      setShowRestoreModal(false);
      setArticleToRestore(null);
    }
  };

  const cancelRestoreArticle = () => {
    setShowRestoreModal(false);
    setArticleToRestore(null);
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowAdditionalFilters(false);
  };

  const handleAuthorRoleChange = (role) => {
    setAuthorRoleFilter(role);
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterToggle = () => {
    setShowFilterDropdown(!showFilterDropdown);
  };

  const handleAdditionalFiltersToggle = () => {
    setShowAdditionalFilters(!showAdditionalFilters);
  };

  const handleDateRangeChange = (field, value) => {
    console.log('Date range change:', field, value);
    setDateRange(prev => {
      const newRange = { ...prev, [field]: value };
      console.log('New date range:', newRange);
      return newRange;
    });
  };

  const handleCategoryToggle = (categoryId) => {
    setSelectedCategories(prev => 
      prev.includes(categoryId) 
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  };


  const clearAllFilters = () => {
    setDateRange({ start: '', end: '' });
    setSelectedCategories([]);
    setActiveFilter('all');
    setAuthorRoleFilter('all');
  };

  const closeFilterPopup = () => {
    setShowFilterDropdown(false);
    setShowAdditionalFilters(false);
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      closeFilterPopup();
    }
  };

  const handleCreateContent = () => {
    navigate('/content/create');
  };

  const handlePreview = async (article) => {
    console.log('Previewing article:', article);
    
    setPreviewLoading(true);
    try {
      // Fetch the complete article data from the backend
      const response = await articlesAPI.getArticle(article.id);
      console.log('Fetched article data:', response);
      console.log('Full article object:', response.data);
      console.log('Categories:', response.data?.categories);
      console.log('Tags:', response.data?.tags);
      console.log('Main Author:', response.data?.author);
      console.log('Article Authors:', response.data?.articleAuthors);
      console.log('Media caption:', response.data?.mediaCaption);
      
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
            
            return authors.length > 0 ? authors : [{ name: article.author?.name || 'Unknown Author' }];
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
        showNotification('Error', 'Failed to load article preview', 'error');
      }
    } catch (error) {
      console.error('Error fetching article for preview:', error);
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
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
      
      showNotification('Error', errorMessage, 'error');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewArticle(null);
  };


  const getFilteredArticles = () => {
    let filtered = articles;

    // Filter by status
    if (activeFilter !== 'all') {
      filtered = filtered.filter(article => {
        const filterStatus = activeFilter.toLowerCase();
        
        // Handle status filters
        const articleStatus = article.status.toLowerCase();
        const statusMap = {
          'published': 'published',
          'draft': 'draft', 
          'pending': 'in_review',
          'needs_revision': 'needs_revision',
          'rejected': 'needs_revision',
          'archived': 'archived'
        };
        
        return articleStatus === (statusMap[filterStatus] || filterStatus);
      });
    }

    // Filter by author role
    if (authorRoleFilter !== 'all') {
      filtered = filtered.filter(article => {
        if (authorRoleFilter === 'primary_author') {
          const result = article.author?.isPrimary === true;
          console.log(`Primary author filter for article ${article.id}:`, {
            articleTitle: article.title,
            authorIsPrimary: article.author?.isPrimary,
            result: result
          });
          return result;
        }
        
        if (authorRoleFilter === 'co_author') {
          const result = article.author?.isCoAuthor === true;
          console.log(`Co-author filter for article ${article.id}:`, {
            articleTitle: article.title,
            authorIsCoAuthor: article.author?.isCoAuthor,
            result: result
          });
          return result;
        }
        
        return true;
      });
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt.toLowerCase().includes(searchLower) ||
        article.author.name.toLowerCase().includes(searchLower)
      );
    }

    // Filter by date range
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.createdAt);
        const startDate = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
        const endDate = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;
        
        console.log('Date filtering:', {
          articleTitle: article.title,
          articleDate: articleDate.toISOString(),
          startDate: startDate?.toISOString(),
          endDate: endDate?.toISOString(),
          dateRange
        });
        
        if (startDate && endDate) {
          return articleDate >= startDate && articleDate <= endDate;
        } else if (startDate) {
          return articleDate >= startDate;
        } else if (endDate) {
          return articleDate <= endDate;
        }
        return true;
      });
    }

    // Filter by categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(article => 
        article.categories.some(category => selectedCategories.includes(category.id))
      );
    }

    return filtered;
  };

  const getFilterCount = (status) => {
    let filtered = articles;

    // Apply search filter first
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(article => 
        article.title.toLowerCase().includes(searchLower) ||
        article.excerpt.toLowerCase().includes(searchLower) ||
        article.author.name.toLowerCase().includes(searchLower)
      );
    }

    // Apply author role filter
    if (authorRoleFilter !== 'all') {
      filtered = filtered.filter(article => {
        if (authorRoleFilter === 'primary_author') {
          return article.author?.isPrimary === true;
        }
        if (authorRoleFilter === 'co_author') {
          return article.author?.isCoAuthor === true;
        }
        return true;
      });
    }

    // Apply date range filter
    if (dateRange.start || dateRange.end) {
      filtered = filtered.filter(article => {
        const articleDate = new Date(article.createdAt);
        const startDate = dateRange.start ? new Date(dateRange.start + 'T00:00:00') : null;
        const endDate = dateRange.end ? new Date(dateRange.end + 'T23:59:59') : null;
        
        if (startDate && endDate) {
          return articleDate >= startDate && articleDate <= endDate;
        } else if (startDate) {
          return articleDate >= startDate;
        } else if (endDate) {
          return articleDate <= endDate;
        }
        return true;
      });
    }

    // Apply category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(article => 
        article.categories.some(category => selectedCategories.includes(category.id))
      );
    }

    // Then apply status filter
    if (status === 'all') {
      return filtered.length;
    }
    
    return filtered.filter(article => {
      const filterStatus = status.toLowerCase();
      
      // Handle status filters
      const articleStatus = article.status.toLowerCase();
      const statusMap = {
        'published': 'published',
        'draft': 'draft', 
        'pending': 'in_review',
        'needs_revision': 'needs_revision',
        'rejected': 'needs_revision',
        'archived': 'archived'
      };
      
      return articleStatus === (statusMap[filterStatus] || filterStatus);
    }).length;
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'published':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'in_review':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'draft':
        return <PencilIcon className="h-4 w-4 text-gray-500" />;
      case 'needs_revision':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      case 'approved':
        return <CheckCircleIcon className="h-4 w-4 text-blue-500" />;
      case 'scheduled':
        return <ClockIcon className="h-4 w-4 text-purple-500" />;
      case 'archived':
        return <ArchiveBoxIcon className="h-4 w-4 text-gray-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'needs_revision':
        return 'bg-red-100 text-red-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-purple-100 text-purple-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilterLabel = (filter) => {
    switch (filter) {
      case 'all':
        return 'Total Content';
      case 'published':
        return 'Published';
      case 'draft':
        return 'Drafts';
      case 'pending':
        return 'Under Review';
      case 'needs_revision':
        return 'Needs Revision';
      case 'archived':
        return 'Archived';
      default:
        return 'All Content';
    }
  };

  const getStatusLabel = (status) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'Published';
      case 'in_review':
        return 'Under Review';
      case 'draft':
        return 'Draft';
      case 'needs_revision':
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

  if (loading) {
    return (
      <div className="mycontent-container">
        <div className="mycontent-loading">
          <div className="mycontent-spinner"></div>
        </div>
      </div>
    );
  }


  return (
    <div className="mycontent-container">
      <div className="mycontent-content">
        {/* Header */}
        <div className="mycontent-header">
          <div>
            <h1 className="mycontent-title">Content Management</h1>
          </div>
        </div>

        {/* Control Bar */}
        <div className="mycontent-control-bar">
          <div className="mycontent-stats">
            <button 
              className={`mycontent-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
              onClick={() => handleFilterChange('all')}
            >
              Total Content: {getFilterCount('all')}
            </button>
            <div className="mycontent-stat-separator"></div>
            <button 
              className={`mycontent-filter-tab ${activeFilter === 'published' ? 'active' : ''}`}
              onClick={() => handleFilterChange('published')}
            >
              Published: {getFilterCount('published')}
            </button>
            <div className="mycontent-stat-separator"></div>
            <button 
              className={`mycontent-filter-tab ${activeFilter === 'draft' ? 'active' : ''}`}
              onClick={() => handleFilterChange('draft')}
            >
              Drafts: {getFilterCount('draft')}
            </button>
            <div className="mycontent-stat-separator"></div>
            <button 
              className={`mycontent-filter-tab ${activeFilter === 'pending' ? 'active' : ''}`}
              onClick={() => handleFilterChange('pending')}
            >
              Under Review: {getFilterCount('pending')}
            </button>
            <div className="mycontent-stat-separator"></div>
            
            {/* Additional Filters Dropdown */}
            <div className="mycontent-additional-filters">
              <button 
                className="mycontent-additional-filters-button"
                onClick={handleAdditionalFiltersToggle}
              >
                <svg 
                  className={`mycontent-additional-filters-arrow ${showAdditionalFilters ? 'rotated' : ''}`}
                  width="16" 
                  height="16" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2"
                >
                  <polyline points="6,9 12,15 18,9"></polyline>
                </svg>
              </button>
              
              {showAdditionalFilters && (
                <div className="mycontent-additional-filters-menu">
                  <button 
                    className={`mycontent-additional-filters-item ${activeFilter === 'needs_revision' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('needs_revision')}
                  >
                    <span>Needs Revision</span>
                    <span className="mycontent-additional-filters-count">{getFilterCount('needs_revision')}</span>
                  </button>
                  
                  <button 
                    className={`mycontent-additional-filters-item ${activeFilter === 'archived' ? 'active' : ''}`}
                    onClick={() => handleFilterChange('archived')}
                  >
                    <span>Archived</span>
                    <span className="mycontent-additional-filters-count">{getFilterCount('archived')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Filter Popup */}
          {showFilterDropdown && (
            <div className="mycontent-filter-backdrop" onClick={handleBackdropClick}>
              <div className="mycontent-filter-popup">
                <button 
                  className="mycontent-filter-close"
                  onClick={closeFilterPopup}
                  title="Close"
                >
                  ×
                </button>
                
                <h3 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: '600', color: '#111827' }}>
                  Filter Content
                </h3>

                <div className="mycontent-filter-section">
                  <h4 className="mycontent-filter-title">Date Range</h4>
                  <div className="mycontent-date-inputs">
                    <div className="mycontent-date-input-group">
                      <label className="mycontent-date-label">From:</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => handleDateRangeChange('start', e.target.value)}
                        className="mycontent-date-input"
                      />
                    </div>
                    <div className="mycontent-date-input-group">
                      <label className="mycontent-date-label">To:</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => handleDateRangeChange('end', e.target.value)}
                        className="mycontent-date-input"
                      />
                    </div>
                  </div>
                </div>

                <div className="mycontent-filter-section">
                  <h4 className="mycontent-filter-title">Categories</h4>
                  <div className="mycontent-checkbox-group">
                    {categories.map(category => (
                      <label key={category.id} className="mycontent-checkbox-item">
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                          className="mycontent-checkbox"
                        />
                        <span className="mycontent-checkbox-label">{category.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="mycontent-filter-section">
                  <h4 className="mycontent-filter-title">Author Role</h4>
                  <div className="mycontent-checkbox-group">
                    <label className="mycontent-checkbox-item">
                      <input
                        type="radio"
                        name="authorRole"
                        checked={authorRoleFilter === 'primary_author'}
                        onChange={() => handleAuthorRoleChange('primary_author')}
                        className="mycontent-checkbox"
                      />
                      <span className="mycontent-checkbox-label">Primary Author</span>
                    </label>
                    <label className="mycontent-checkbox-item">
                      <input
                        type="radio"
                        name="authorRole"
                        checked={authorRoleFilter === 'co_author'}
                        onChange={() => handleAuthorRoleChange('co_author')}
                        className="mycontent-checkbox"
                      />
                      <span className="mycontent-checkbox-label">Co-Author</span>
                    </label>
                    <label className="mycontent-checkbox-item">
                      <input
                        type="radio"
                        name="authorRole"
                        checked={authorRoleFilter === 'all'}
                        onChange={() => handleAuthorRoleChange('all')}
                        className="mycontent-checkbox"
                      />
                      <span className="mycontent-checkbox-label">All Roles</span>
                    </label>
                  </div>
                </div>

                <div className="mycontent-filter-actions">
                  <button 
                    onClick={clearAllFilters}
                    className="mycontent-clear-filters-btn"
                  >
                    Clear All Filters
                  </button>
                  <button 
                    onClick={closeFilterPopup}
                    className="mycontent-apply-filters-btn"
                  >
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}

          
          <div className="mycontent-controls">
            <div className="mycontent-search-container">
              <MagnifyingGlassIcon className="mycontent-search-icon" />
              <input 
                type="text" 
                placeholder="Search" 
                className="mycontent-search-input"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            <button 
              className={`mycontent-filter-btn ${(dateRange.start || dateRange.end || selectedCategories.length > 0) ? 'active' : ''}`} 
              onClick={handleFilterToggle}
            >
              <FunnelIcon className="mycontent-filter-icon" />
              {(dateRange.start || dateRange.end || selectedCategories.length > 0) && (
                <span className="mycontent-filter-indicator"></span>
              )}
            </button>
            <button
              onClick={handleCreateContent}
              className="mycontent-new-content-btn"
            >
              <PlusIcon className="mycontent-plus-icon" />
              New Content
            </button>
          </div>
        </div>

        {/* Articles List */}
        {getFilteredArticles().length === 0 ? (
          <div className="mycontent-empty">
            <DocumentTextIcon className="mycontent-empty-icon" />
            <h3 className="mycontent-empty-title">No content yet</h3>
            <p className="mycontent-empty-description">
              Start writing your first article to share your thoughts with the world.
            </p>
          </div>
        ) : (
          <div className="mycontent-list">
            {getFilteredArticles().map((article) => {
              // Debug logging
              if (user?.role === 'STAFF' && article.status === 'IN_REVIEW') {
                console.log('STAFF user with IN_REVIEW article:', {
                  articleId: article.id,
                  articleTitle: article.title,
                  articleStatus: article.status,
                  userRole: user?.role
                });
              }
              return (
              <div key={article.id} className="mycontent-article-card">
                <div className="mycontent-article-icon">
                  <UserGroupIcon className="mycontent-group-icon" />
                </div>
                
                <div className="mycontent-article-content">
                  <h3 className="mycontent-article-title">
                    {article.title}
                  </h3>
                  
                  <div className="mycontent-article-meta">
                    <span>
                      {article.allAuthors && article.allAuthors.length > 1 ? (
                        <span>
                          {article.allAuthors.map((author, index) => (
                            <span key={`${article.id}-${author.id}-${index}`}>
                              {author.name}
                              {author.id === user?.id && (
                                <span className="mycontent-author-role">
                                  {author.isPrimary ? ' (Primary Author)' : ' (Co-Author)'}
                                </span>
                              )}
                              {index < article.allAuthors.length - 1 && ', '}
                            </span>
                          ))}
                        </span>
                      ) : (
                        <span>
                          By {article.author?.name || 'Author Name'}
                          {article.author?.isCoAuthor && (
                            <span className="mycontent-author-role"> (Co-Author)</span>
                          )}
                        </span>
                      )}
                    </span>
                    <span className="mycontent-meta-separator">•</span>
                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    <span className="mycontent-meta-separator">•</span>
                    <span>{getStatusLabel(article.status)}</span>
                    <span className="mycontent-meta-separator">•</span>
                    <span>{article.viewCount || 0} views</span>
                  </div>
                </div>
                
                <div className="mycontent-article-actions">
                  {/* Edit Button */}
                  {article.status.toLowerCase() === 'archived' ? (
                    <button
                      className="mycontent-action-btn mycontent-action-btn-disabled"
                      title="Cannot edit archived articles. Restore to draft first."
                      disabled
                    >
                      <PencilIcon className="mycontent-action-icon mycontent-action-icon-disabled" />
                    </button>
                  ) : article.author?.isCoAuthor ? (
                    <button
                      className="mycontent-action-btn mycontent-action-btn-disabled"
                      title="Co-authors can only view articles. Only primary authors can edit."
                      disabled
                    >
                      <PencilIcon className="mycontent-action-icon mycontent-action-icon-disabled" />
                    </button>
                  ) : (user?.role === 'STAFF' || user?.role === 'SECTION_HEAD') && article.status === 'IN_REVIEW' ? (
                    <button
                      className="mycontent-action-btn mycontent-action-btn-disabled"
                      title={user?.role === 'STAFF' 
                        ? "Cannot edit articles under review. Wait for section head feedback."
                        : "Cannot edit articles under review. Wait for EIC feedback or revision request."
                      }
                      disabled
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`Edit button clicked but disabled for ${user?.role} user with IN_REVIEW article`);
                      }}
                    >
                      <PencilIcon className="mycontent-action-icon mycontent-action-icon-disabled" />
                    </button>
                  ) : (
                    <Link
                      to={`/content/${article.id}/edit`}
                      className="mycontent-action-btn"
                      title="Edit"
                    >
                      <PencilIcon className="mycontent-action-icon" />
                    </Link>
                  )}
                  <button
                    onClick={() => handlePreview(article)}
                    className="mycontent-action-btn"
                    title={previewLoading ? "Loading..." : "Preview"}
                    disabled={previewLoading}
                  >
                    <EyeIcon className="mycontent-action-icon" />
                  </button>
                  {/* Archive/Restore Button */}
                  {article.status.toLowerCase() === 'archived' ? (
                    <button
                      onClick={() => handleRestoreArticle(article.id)}
                      className="mycontent-action-btn"
                      title="Restore to Draft"
                    >
                      <ArrowUturnLeftIcon className="mycontent-action-icon" />
                    </button>
                  ) : article.author?.isCoAuthor ? (
                    <button
                      className="mycontent-action-btn mycontent-action-btn-disabled"
                      title="Co-authors can only view articles. Only primary authors can archive."
                      disabled
                    >
                      <ArchiveBoxIcon className="mycontent-action-icon mycontent-action-icon-disabled" />
                    </button>
                  ) : (user?.role === 'STAFF' || user?.role === 'SECTION_HEAD') && article.status === 'IN_REVIEW' ? (
                    <button
                      className="mycontent-action-btn mycontent-action-btn-disabled"
                      title={user?.role === 'STAFF' 
                        ? "Cannot archive articles under review. Wait for section head feedback."
                        : "Cannot archive articles under review. Wait for EIC feedback or revision request."
                      }
                      disabled
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`Archive button clicked but disabled for ${user?.role} user with IN_REVIEW article`);
                      }}
                    >
                      <ArchiveBoxIcon className="mycontent-action-icon mycontent-action-icon-disabled" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleArchiveArticle(article.id)}
                      className="mycontent-action-btn"
                      title="Archive Article"
                    >
                      <ArchiveBoxIcon className="mycontent-action-icon" />
                    </button>
                  )}
                  {/* Delete Button */}
                  {article.author?.isCoAuthor ? (
                    <button
                      className="mycontent-action-btn mycontent-action-btn-disabled"
                      title="Co-authors can only view articles. Only primary authors can delete."
                      disabled
                    >
                      <TrashIcon className="mycontent-action-icon mycontent-action-icon-disabled" />
                    </button>
                  ) : (user?.role === 'STAFF' || user?.role === 'SECTION_HEAD') && article.status === 'IN_REVIEW' ? (
                    <button
                      className="mycontent-action-btn mycontent-action-btn-disabled"
                      title={user?.role === 'STAFF' 
                        ? "Cannot delete articles under review. Wait for section head feedback."
                        : "Cannot delete articles under review. Wait for EIC feedback or revision request."
                      }
                      disabled
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        console.log(`Delete button clicked but disabled for ${user?.role} user with IN_REVIEW article`);
                      }}
                    >
                      <TrashIcon className="mycontent-action-icon mycontent-action-icon-disabled" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleDeleteArticle(article.id)}
                      className="mycontent-action-btn"
                      title="Delete Article"
                    >
                      <TrashIcon className="mycontent-action-icon" />
                    </button>
                  )}
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {previewArticle && createPortal(
        <ArticlePreviewModal
          isOpen={showPreview}
          onClose={handleClosePreview}
          articleData={previewArticle}
        />,
        document.body
      )}

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showNotificationModal}
        onClose={closeNotification}
        title={notificationData.title}
        message={notificationData.message}
        type={notificationData.type}
        duration={3000}
      />

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onClose={cancelDeleteArticle}
        onConfirm={confirmDeleteArticle}
        title="Delete Article"
        message="Are you sure you want to delete this article? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Archive Confirmation Modal */}
      <ConfirmationModal
        isOpen={showArchiveModal}
        onClose={cancelArchiveArticle}
        onConfirm={confirmArchiveArticle}
        title="Archive Article"
        message="Are you sure you want to archive this article? You can restore it later if needed."
        confirmText="Archive"
        cancelText="Cancel"
        type="warning"
      />

      {/* Restore Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRestoreModal}
        onClose={cancelRestoreArticle}
        onConfirm={confirmRestoreArticle}
        title="Restore Article"
        message="Are you sure you want to restore this article to draft status?"
        confirmText="Restore"
        cancelText="Cancel"
        type="info"
      />
    </div>
  );
};

export default MyContent;
