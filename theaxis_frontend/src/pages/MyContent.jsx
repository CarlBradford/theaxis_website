import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { articlesAPI, categoriesAPI } from '../services/apiService';
import ArticlePreviewModal from '../components/ArticlePreviewModal';
import NotificationModal from '../components/NotificationModal';
import ConfirmationModal from '../components/ConfirmationModal';
import FilterModal from '../components/FilterModal';
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
  ArrowUturnLeftIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import '../styles/mycontent.css';
import '../styles/filter-modal.css';

const MyContent = () => {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ title: '', message: '', type: 'success' });
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
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
      fetchMyContent({}, true); // Show loading on initial load
      fetchCategories();
    }
  }, [user?.id]);

  // Apply filters and reload articles
  useEffect(() => {
    if (user?.id) {
      fetchMyContent({
        search: searchTerm,
        status: activeFilter,
        category: selectedCategories.length === 1 ? selectedCategories[0] : 'all',
        sortBy: sortBy,
        sortOrder: sortOrder
      }, false); // Don't show loading on filter changes
    }
  }, [user?.id, searchTerm, activeFilter, selectedCategories, sortBy, sortOrder]);

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      setCategories(response.data?.items || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchMyContent = async (filters = {}, showLoading = false) => {
    try {
      if (showLoading) {
      setLoading(true);
      }
      setError(null);
      
      // Build API parameters
      const params = {
        authorId: user?.id
      };
      
      // Add filter parameters
      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      if (filters.status && filters.status !== 'all') {
        params.status = filters.status.toUpperCase();
      }
      if (filters.category && filters.category !== 'all') {
        params.category = filters.category;
      }
      if (filters.sortBy) {
        params.sortBy = filters.sortBy;
      }
      if (filters.sortOrder) {
        params.sortOrder = filters.sortOrder;
      }
      
      console.log('MyContent API params:', params);
      const response = await articlesAPI.getMyContent(params);
      console.log('Fetched articles response:', response);
      console.log('Sample article with categories:', response.data?.items?.[0]);
      
      // Transform the data to match the expected structure
      const transformedArticles = (response.data?.items || []).map(article => ({
        id: article.id,
        title: article.title,
        status: article.status?.toLowerCase() || 'draft',
        author: { 
          name: article.author 
            ? `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim() || article.author.username || 'Unknown Author'
            : `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.username || 'Unknown Author'
        },
        viewCount: article.viewCount || 0,
        createdAt: article.createdAt,
        excerpt: article.excerpt || article.title, // Use title as excerpt if no excerpt
        categories: article.categories || [], // Use categories from backend
        tags: article.tags || [], // Use tags from backend
        featuredImage: article.featuredImage || null // Add featured image
      }));
      
      setArticles(transformedArticles);
      setFilteredArticles(transformedArticles);
    } catch (error) {
      console.error('Failed to fetch my content:', error);
      setError('Failed to load your content');
      setArticles([]); // Set empty array on error
      setFilteredArticles([]);
    } finally {
      if (showLoading) {
      setLoading(false);
      }
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

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterToggle = () => {
    setShowFilterModal(!showFilterModal);
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


  // No need for frontend filtering since we're using database filtering
  const getFilteredArticles = () => {
    return filteredArticles;
  };

  const getFilterCount = (status) => {
    // For now, return count from filteredArticles since we're using database filtering
    // In the future, we could add a separate API call for filter counts
    if (status === 'all') {
      return filteredArticles.length;
    }
    
    return filteredArticles.filter(article => {
      const articleStatus = article.status.toLowerCase();
      const filterStatus = status.toLowerCase();
      
      // Map frontend filter names to backend status values
      const statusMap = {
        'published': 'published',
        'draft': 'draft', 
        'pending': 'in_review',
        'approved': 'approved',
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

  // Show uniform loading animation during transitions
  if (loading) {
    return (
      <div className="mycontent-container">
        <div className="uniform-loading">
          <div className="uniform-spinner"></div>
          <p className="uniform-loading-text">Loading your content...</p>
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
            <p className="mycontent-subtitle">Create, edit, and manage your content</p>
          </div>
          <div className="mycontent-header-controls">
            <div className="mycontent-search-container">
              <MagnifyingGlassIcon className="mycontent-search-icon" />
              <input 
                type="text" 
                placeholder="Search content, titles, or categories..." 
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

        {/* Control Bar */}
        <div className="mycontent-control-bar">
          <div className="mycontent-stats">
            {/* Role-based filter tabs */}
            {user?.role === 'EDITOR_IN_CHIEF' || user?.role === 'ADVISER' || user?.role === 'SYSTEM_ADMIN' ? (
              // EIC and higher: Total, Published, Drafts, In Review, Approved, Archived
              <>
                <button 
                  className={`mycontent-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All Content: {getFilterCount('all')}
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
                  In Review: {getFilterCount('pending')}
                </button>
                <div className="mycontent-stat-separator"></div>
                <button 
                  className={`mycontent-filter-tab ${activeFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('approved')}
                >
                  Approved: {getFilterCount('approved')}
                </button>
                <div className="mycontent-stat-separator"></div>
                <button 
                  className={`mycontent-filter-tab ${activeFilter === 'archived' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('archived')}
                >
                  Archived: {getFilterCount('archived')}
                </button>
              </>
            ) : user?.role === 'SECTION_HEAD' ? (
              // Section Head: Total, Published, Drafts, Approved, Archived
              <>
                <button 
                  className={`mycontent-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All Content: {getFilterCount('all')}
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
                  className={`mycontent-filter-tab ${activeFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('approved')}
                >
                  Approved: {getFilterCount('approved')}
                </button>
                <div className="mycontent-stat-separator"></div>
                <button 
                  className={`mycontent-filter-tab ${activeFilter === 'archived' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('archived')}
                >
                  Archived: {getFilterCount('archived')}
                </button>
              </>
            ) : (
              // Staff: Total, Published, Drafts, Under Review, Approved, Needs Revision
              <>
                <button 
                  className={`mycontent-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('all')}
                >
                  All Content: {getFilterCount('all')}
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
                <button 
                  className={`mycontent-filter-tab ${activeFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('approved')}
                >
                  Approved: {getFilterCount('approved')}
                </button>
                <div className="mycontent-stat-separator"></div>
                <button 
                  className={`mycontent-filter-tab ${activeFilter === 'needs_revision' ? 'active' : ''}`}
                  onClick={() => handleFilterChange('needs_revision')}
                >
                  Needs Revision: {getFilterCount('needs_revision')}
                </button>
              </>
            )}
          </div>
          
          {/* Filter Modal */}
          <div className="mycontent-filter-wrapper">
            <FilterModal
              isOpen={showFilterModal}
              onClose={() => setShowFilterModal(false)}
              title="Filter Content"
              onApply={() => setShowFilterModal(false)}
              onClear={clearAllFilters}
              layout="vertical"
            >
            {/* Date Range - Compact Layout */}
            <div className="filter-modal-section">
              <h4 className="filter-modal-section-title">Date Range:</h4>
              <div className="filter-modal-date-compact">
                <div className="filter-modal-date-item">
                  <label className="filter-modal-date-label">FROM:</label>
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => handleDateRangeChange('start', e.target.value)}
                    className="filter-modal-date-input"
                      />
                    </div>
                <div className="filter-modal-date-item">
                  <label className="filter-modal-date-label">TO:</label>
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => handleDateRangeChange('end', e.target.value)}
                    className="filter-modal-date-input"
                      />
                    </div>
                  </div>
                </div>

            {/* Categories - Simple Two Columns */}
            <div className="filter-modal-section">
              <h4 className="filter-modal-section-title">Categories</h4>
              <div className="filter-modal-categories-simple">
                <div className="filter-modal-categories-column">
                  {categories.slice(0, Math.ceil(categories.length / 2)).map(category => (
                    <label key={category.id} className={`filter-modal-checkbox-item ${selectedCategories.includes(category.id) ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => handleCategoryToggle(category.id)}
                        className="filter-modal-checkbox-input"
                        />
                      <span className="filter-modal-checkbox-label">{category.name}</span>
                      </label>
                    ))}
                  </div>
                <div className="filter-modal-categories-column">
                  {categories.slice(Math.ceil(categories.length / 2)).map(category => (
                    <label key={category.id} className={`filter-modal-checkbox-item ${selectedCategories.includes(category.id) ? 'selected' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category.id)}
                        onChange={() => handleCategoryToggle(category.id)}
                        className="filter-modal-checkbox-input"
                      />
                      <span className="filter-modal-checkbox-label">{category.name}</span>
                    </label>
                  ))}
                </div>
                </div>
              </div>
            </FilterModal>
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
                {/* Featured Image */}
                {article.featuredImage ? (
                  <div className="mycontent-article-image">
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
                            className="mycontent-featured-image"
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
                      className="mycontent-featured-image"
                      onError={(e) => {
                              console.error('Image failed to load:', mediaUrl);
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                        );
                      }
                    })()}
                    <div className="mycontent-article-icon" style={{ display: 'none' }}>
                      <UserGroupIcon className="mycontent-group-icon" />
                    </div>
                  </div>
                ) : (
                  <div className="mycontent-article-icon">
                    <UserGroupIcon className="mycontent-group-icon" />
                  </div>
                )}
                
                <div className="mycontent-article-content">
                  <h3 className="mycontent-article-title">
                    {article.title}
                  </h3>
                  
                  <div className="mycontent-article-meta">
                    <span>By {article.author?.name || 'Author Name'}</span>
                    <span className="mycontent-meta-separator">•</span>
                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                    <span className="mycontent-meta-separator">•</span>
                    <span>{getStatusLabel(article.status)}</span>
                    <span className="mycontent-meta-separator">•</span>
                    <span>{article.viewCount || 0} views</span>
                  </div>
                </div>
                
                <div className="mycontent-article-actions">
                  {/* Edit Button - Role and status based logic */}
                  {(() => {
                    const status = article.status.toLowerCase();
                    const userRole = user?.role;
                    
                    // Staff: Enable only for draft and needs_revision
                    if (userRole === 'STAFF') {
                      if (status === 'draft' || status === 'needs_revision') {
                        return (
                          <Link
                            to={`/content/${article.id}/edit`}
                            className="mycontent-action-btn"
                            title="Edit"
                          >
                            <PencilIcon className="mycontent-action-icon" />
                          </Link>
                        );
                      } else {
                        return (
                    <button
                      className="mycontent-action-btn mycontent-action-btn-disabled"
                            title={`Cannot edit articles with status: ${getStatusLabel(article.status)}`}
                      disabled
                    >
                      <PencilIcon className="mycontent-action-icon mycontent-action-icon-disabled" />
                    </button>
                        );
                      }
                    }
                    
                    // Section Head: Enable only for draft
                    if (userRole === 'SECTION_HEAD') {
                      if (status === 'draft') {
                        return (
                          <Link
                            to={`/content/${article.id}/edit`}
                            className="mycontent-action-btn"
                            title="Edit"
                          >
                            <PencilIcon className="mycontent-action-icon" />
                          </Link>
                        );
                      } else {
                        return (
                    <button
                      className="mycontent-action-btn mycontent-action-btn-disabled"
                            title={`Cannot edit articles with status: ${getStatusLabel(article.status)}`}
                      disabled
                    >
                      <PencilIcon className="mycontent-action-icon mycontent-action-icon-disabled" />
                    </button>
                        );
                      }
                    }
                    
                    // EIC and higher: Enable only for draft, published, and approved
                    if (userRole === 'EDITOR_IN_CHIEF' || userRole === 'ADVISER' || userRole === 'SYSTEM_ADMIN') {
                      if (status === 'draft' || status === 'published' || status === 'approved') {
                        return (
                  <Link
                    to={`/content/${article.id}/edit`}
                    className="mycontent-action-btn"
                    title="Edit"
                  >
                    <PencilIcon className="mycontent-action-icon" />
                  </Link>
                        );
                      } else {
                        return (
                  <button
                            className="mycontent-action-btn mycontent-action-btn-disabled"
                            title={`Cannot edit articles with status: ${getStatusLabel(article.status)}`}
                            disabled
                          >
                            <PencilIcon className="mycontent-action-icon mycontent-action-icon-disabled" />
                  </button>
                        );
                      }
                    }
                    
                    // Default: Disabled for unknown roles
                    return (
                        <button
                          className="mycontent-action-btn mycontent-action-btn-disabled"
                        title="Edit not available for your role"
                          disabled
                        >
                        <PencilIcon className="mycontent-action-icon mycontent-action-icon-disabled" />
                        </button>
                    );
                  })()}
                      <button
                    onClick={() => handlePreview(article)}
                        className="mycontent-action-btn"
                    title={previewLoading ? "Loading..." : "Preview"}
                    disabled={previewLoading}
                      >
                    <EyeIcon className="mycontent-action-icon" />
                      </button>
                  {/* Delete Button - Only show for draft articles */}
                  {article.status === 'draft' && (
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
