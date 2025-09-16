import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { articlesAPI, categoriesAPI } from '../services/apiService';
import flipbookService from '../services/flipbookService';
import ArticlePreviewModal from '../components/ArticlePreviewModal';
import NotificationModal from '../components/NotificationModal';
import ConfirmationModal from '../components/ConfirmationModal';
import FlipbookDisplay from '../components/FlipbookDisplay';
import FlipbookInputForm from '../components/FlipbookInputForm';
import MediaDisplay from '../components/MediaDisplay';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  PencilIcon,
  ArchiveBoxIcon,
  ArrowUturnLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  TrashIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import FilterModal from '../components/FilterModal';
import '../styles/published-content.css';
import '../styles/media-display.css';
import '../styles/filter-modal.css';
import '../styles/flipbook-display.css';
import '../styles/flipbook-input-form.css';

const PublishedContent = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('publishedAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('published');
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ title: '', message: '', type: 'success' });
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [articleToArchive, setArticleToArchive] = useState(null);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [articleToRestore, setArticleToRestore] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [filterCounts, setFilterCounts] = useState({
    published: 0,
    archived: 0,
    annual_editions: 0
  });
  const [filterLoading, setFilterLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    totalArticles: 0,
    totalViews: 0,
    avgViews: 0
  });
  
  // Flipbook related state
  const [showFlipbookModal, setShowFlipbookModal] = useState(false);
  const [showFlipbookForm, setShowFlipbookForm] = useState(false);
  const [currentFlipbook, setCurrentFlipbook] = useState(null);

  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        console.log('Categories API response:', response);
        
        // Handle different possible response structures
        let categoriesData = [];
        if (response.data) {
          if (Array.isArray(response.data)) {
            categoriesData = response.data;
          } else if (response.data.items && Array.isArray(response.data.items)) {
            categoriesData = response.data.items;
          } else if (response.data.categories && Array.isArray(response.data.categories)) {
            categoriesData = response.data.categories;
          }
        }
        
        console.log('Processed categories data:', categoriesData);
        setCategories(categoriesData);
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  // Load published articles from API
  const loadPublishedArticles = async (filters = {}, showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
      } else {
        setFilterLoading(true);
      }
      setError(null);
      console.log('Loading published articles...');
      console.log('User:', user);
      console.log('Token:', localStorage.getItem('token'));
      
      // Build API parameters
      const params = {};
      
      // Determine status filter based on active filter
      let statusFilter = 'PUBLISHED'; // Default to published
      if (filters.activeFilter === 'archived') {
        statusFilter = 'ARCHIVED';
      } else if (filters.activeFilter === 'published') {
        statusFilter = 'PUBLISHED';
      } else if (filters.activeFilter === 'annual_editions') {
        // For annual editions, we'll fetch all published articles and filter by category
        statusFilter = 'PUBLISHED';
      }
      
      params.status = statusFilter;
      
      // Add other filter parameters
      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
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
      
      console.log('API params:', params);
      const response = await articlesAPI.getPublishedContent(params);
        
        console.log('API Response:', response);
        console.log('Published articles loaded:', response.data?.items);
        
        // Debug: Check date fields for each article
        (response.data?.items || []).forEach((article, index) => {
          console.log(`Article ${index + 1} date fields:`, {
            title: article.title,
            status: article.status,
            publishedAt: article.publishedAt,
            publicationDate: article.publicationDate,
            createdAt: article.createdAt,
            updatedAt: article.updatedAt
          });
        });
        
        // Transform the data to match expected structure
        const transformedArticles = (response.data?.items || []).map(article => ({
          id: article.id,
          title: article.title,
          status: article.status?.toLowerCase() || 'published',
          author: { 
            name: article.author 
              ? `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim() || article.author.username || 'Unknown Author'
              : 'Unknown Author'
          },
          viewCount: article.viewCount || 0,
          createdAt: article.createdAt,
          updatedAt: article.updatedAt,
          publishedAt: article.publishedAt || article.publicationDate,
          excerpt: article.excerpt || createExcerpt(article.content) || article.title,
          content: article.content,
          wordCount: calculateWordCount(article.content),
          readTime: article.readingTime ? `${article.readingTime} min read` : calculateReadTime(article.content),
          categories: article.categories || [],
          tags: article.tags || [],
          featuredImage: article.featuredImage || null,
          reviewer: article.reviewer,
          reviewerId: article.reviewerId
        }));
        
        // Apply annual_editions filter if needed (still frontend since it's a special case)
        let finalArticles = transformedArticles;
        if (filters.activeFilter === 'annual_editions') {
          finalArticles = transformedArticles.filter(article => 
            article.categories.some(cat => 
              cat.name.toLowerCase().includes('annual') || 
              cat.name.toLowerCase().includes('edition')
            )
          );
        }
        
        console.log('Transformed articles:', finalArticles);
        setArticles(finalArticles);
        setFilteredArticles(finalArticles);
      } catch (error) {
        console.error('Error loading published articles:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        setError(error);
        setArticles([]);
        setFilteredArticles([]);
      } finally {
        if (showLoading) {
          setLoading(false);
        } else {
          setFilterLoading(false);
        }
      }
    };

  // Load articles on mount
  useEffect(() => {
    if (user?.id) {
      loadPublishedArticles({ activeFilter }, true); // Show loading on initial load
    }
  }, [user?.id, activeFilter]);

  // Load stats and filter counts
  useEffect(() => {
    const loadStatsAndCounts = async () => {
      try {
        // Load database stats
        const statsResponse = await articlesAPI.getArticleStats();
        setStats(statsResponse.data);

        // Load filter counts
        const [publishedCount, archivedCount, annualCount] = await Promise.all([
          getFilterCount('published'),
          getFilterCount('archived'),
          getFilterCount('annual_editions')
        ]);
        
        setFilterCounts({
          published: publishedCount,
          archived: archivedCount,
          annual_editions: annualCount
        });
      } catch (error) {
        console.error('Error loading stats and filter counts:', error);
      }
    };

    loadStatsAndCounts();
  }, []);

  // Apply filters and reload articles
  useEffect(() => {
    if (user?.id) {
      loadPublishedArticles({
        activeFilter: activeFilter,
        search: searchTerm,
        category: selectedCategory,
        sortBy: sortBy,
        sortOrder: sortOrder
      }, false); // Don't show loading on filter changes
    }
  }, [user?.id, searchTerm, sortBy, sortOrder, selectedCategory]);

  const handlePreview = async (article) => {
    console.log('Previewing article:', article);
    
    try {
      // Increment view count when previewing
      try {
        await articlesAPI.incrementViewCount(article.id);
      } catch (viewError) {
        console.warn('Failed to increment view count:', viewError);
        // Don't block preview if view tracking fails
      }
      
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

  const handleArchive = (article) => {
    setArticleToArchive(article.id);
    setShowArchiveModal(true);
  };

  const confirmArchiveArticle = async () => {
    if (!articleToArchive) return;

    try {
      await articlesAPI.updateArticleStatus(articleToArchive, 'ARCHIVED');
      
      // Remove the archived article from the current list since it's no longer published
      setArticles(articles.filter(article => article.id !== articleToArchive));
      setFilteredArticles(filteredArticles.filter(article => article.id !== articleToArchive));
      
      // Refresh filter counts
      const [publishedCount, archivedCount, annualCount] = await Promise.all([
        getFilterCount('published'),
        getFilterCount('archived'),
        getFilterCount('annual_editions')
      ]);
      
      setFilterCounts({
        published: publishedCount,
        archived: archivedCount,
        annual_editions: annualCount
      });
      
      showNotification('Success', 'Article archived successfully', 'success');
      
      // Navigate back to published content after successful archive
      setTimeout(() => {
        navigate('/published-content');
      }, 1500); // Wait 1.5 seconds to show the success notification
    } catch (error) {
      console.error('Error archiving article:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        articleId: articleToArchive
      });
      
      let errorMessage = 'Failed to archive article';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid status transition. Please try again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to archive this article';
      } else if (error.response?.status === 404) {
        errorMessage = 'Article not found';
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

  const handleRestoreArticle = (article) => {
    setArticleToRestore(article.id);
    setShowRestoreModal(true);
  };

  const confirmRestoreArticle = async () => {
    if (!articleToRestore) return;

    try {
      await articlesAPI.updateArticleStatus(articleToRestore, 'IN_REVIEW');
      
      // Remove the restored article from the current list since it's no longer archived
      setArticles(articles.filter(article => article.id !== articleToRestore));
      setFilteredArticles(filteredArticles.filter(article => article.id !== articleToRestore));
      
      // Refresh filter counts
      const [publishedCount, archivedCount, annualCount] = await Promise.all([
        getFilterCount('published'),
        getFilterCount('archived'),
        getFilterCount('annual_editions')
      ]);
      
      setFilterCounts({
        published: publishedCount,
        archived: archivedCount,
        annual_editions: annualCount
      });
      
      showNotification('Success', 'Article restored and sent for review', 'success');
      
      // Navigate back to published content after successful restore
      setTimeout(() => {
        navigate('/published-content');
      }, 1500); // Wait 1.5 seconds to show the success notification
    } catch (error) {
      console.error('Error restoring article:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        articleId: articleToRestore
      });
      
      let errorMessage = 'Failed to restore article';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid status transition. Please try again.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to restore this article';
      } else if (error.response?.status === 404) {
        errorMessage = 'Article not found';
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

  const handleDeleteArticle = (article) => {
    setArticleToDelete(article.id);
    setShowDeleteModal(true);
  };

  const confirmDeleteArticle = async () => {
    if (!articleToDelete) return;

    try {
      await articlesAPI.deleteArticle(articleToDelete);
      
      // Update both articles and filteredArticles states
      setArticles(articles.filter(article => article.id !== articleToDelete));
      setFilteredArticles(filteredArticles.filter(article => article.id !== articleToDelete));
      
      // Refresh filter counts
      const [publishedCount, archivedCount, annualCount] = await Promise.all([
        getFilterCount('published'),
        getFilterCount('archived'),
        getFilterCount('annual_editions')
      ]);
      
      setFilterCounts({
        published: publishedCount,
        archived: archivedCount,
        annual_editions: annualCount
      });
      
      showNotification('Success', 'Article deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting article:', error);
      
      let errorMessage = 'Failed to delete article';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this article';
      } else if (error.response?.status === 404) {
        errorMessage = 'Article not found';
      }
      
      showNotification('Error', errorMessage, 'error');
    } finally {
      setShowDeleteModal(false);
      setArticleToDelete(null);
    }
  };

  const cancelDeleteArticle = () => {
    setShowDeleteModal(false);
    setArticleToDelete(null);
  };

  const handleUpdate = (article) => {
    navigate(`/content/${article.id}/edit?returnTo=published`);
  };

  const showNotification = (title, message, type) => {
    setNotificationData({ title, message, type });
    setShowNotificationModal(true);
  };

  const getFilterCount = async (filter) => {
    try {
      let statusFilter = 'PUBLISHED';
      if (filter === 'archived') {
        statusFilter = 'ARCHIVED';
      } else if (filter === 'published') {
        statusFilter = 'PUBLISHED';
      } else if (filter === 'annual_editions') {
        statusFilter = 'PUBLISHED';
      }
      
      const response = await articlesAPI.getPublishedContent({ status: statusFilter });
      const articles = response.data?.items || [];
      
      if (filter === 'annual_editions') {
        return articles.filter(article => 
          article.categories.some(cat => 
            cat.name.toLowerCase().includes('annual') || 
            cat.name.toLowerCase().includes('edition')
          )
        ).length;
      }
      
      return articles.length;
    } catch (error) {
      console.error('Error getting filter count:', error);
      return 0;
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
  };

  // Flipbook handling functions
  const handlePublishAnnualEdition = () => {
    setShowFlipbookForm(true);
  };

  const handleFlipbookFormSubmit = async (formData) => {
    try {
      // Debug: Log user information
      console.log('🔍 Frontend Debug - User Info:');
      console.log('   User:', user);
      console.log('   User role:', user?.role);
      console.log('   Has SECTION_HEAD role:', hasRole('SECTION_HEAD'));
      console.log('   Token exists:', !!localStorage.getItem('token'));
      
      // Check user role before proceeding
      if (!hasRole('SECTION_HEAD')) {
        throw new Error('Access denied. Only Section Heads and higher roles can publish online issues.');
      }

      // Save flipbook to database
      const response = await flipbookService.createFlipbook({
        name: formData.name,
        embedUrl: formData.embedLink,
        type: formData.type.toUpperCase(),
        releaseDate: formData.releaseDate || null
      });

      // Create flipbook object for display
      const flipbook = {
        id: response.data.id,
        title: response.data.name,
        url: response.data.embedUrl,
        embedCode: `<iframe src="${response.data.embedUrl}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>`,
        embed_url: response.data.embedUrl,
        createdAt: response.data.createdAt,
        created_at: response.data.createdAt,
        fileSize: 0,
        file_size: 0,
        fileName: response.data.name,
        file_name: response.data.name,
        status: 'completed',
        type: response.data.type,
        releaseDate: response.data.releaseDate,
        isActive: response.data.isActive
      };

      setCurrentFlipbook(flipbook);
      setShowFlipbookModal(true);

      showNotification(
        'Success', 
        `${formData.name} published successfully!`, 
        'success'
      );
    } catch (error) {
      console.error('Error creating flipbook:', error);
      
      let errorMessage = 'Failed to create flipbook';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check your inputs.';
      } else if (error.response?.status === 401) {
        errorMessage = 'You are not authorized to publish flipbooks.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to publish flipbooks.';
      } else if (error.response?.status === 409) {
        errorMessage = 'A flipbook with this name already exists.';
      } else if (error.response?.status === 422) {
        errorMessage = 'Invalid embed URL format.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Server error. Please try again later.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Re-throw the error so the form can handle it
      throw new Error(errorMessage);
    }
  };

  const handleCloseFlipbook = () => {
    setShowFlipbookModal(false);
    setCurrentFlipbook(null);
  };

  const handleShareFlipbook = (flipbook) => {
    console.log('Sharing flipbook:', flipbook);
    // Additional sharing logic can be implemented here
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'N/A';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return 'N/A';
    }
  };

  // Helper function to create excerpt from content
  const createExcerpt = (content, maxLength = 150) => {
    if (!content) return '';
    
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '');
    
    if (plainText.length <= maxLength) {
      return plainText;
    }
    
    // Find the last complete word within the limit
    const truncated = plainText.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    
    if (lastSpaceIndex > maxLength * 0.8) {
      return truncated.substring(0, lastSpaceIndex) + '...';
    }
    
    return truncated + '...';
  };

  // Helper function to calculate word count
  const calculateWordCount = (content) => {
    if (!content) return 0;
    
    // Remove HTML tags and get plain text
    const plainText = content.replace(/<[^>]*>/g, '');
    
    // Split by whitespace and filter out empty strings
    const words = plainText.trim().split(/\s+/).filter(word => word.length > 0);
    
    return words.length;
  };

  // Helper function to calculate read time (average 200 words per minute)
  const calculateReadTime = (content) => {
    const wordCount = calculateWordCount(content);
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    
    if (minutes === 1) {
      return '1 min read';
    } else if (minutes < 60) {
      return `${minutes} min read`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours} hr read`;
      } else {
        return `${hours} hr ${remainingMinutes} min read`;
      }
    }
  };

  if (loading) {
    return (
      <div className="published-content-container">
        <div className="published-content-loading">
          <div className="published-content-spinner"></div>
          <p>Loading published content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`published-content-container ${showFilters ? 'filters-open' : ''}`}>
      {/* Header */}
      <div className="published-content-header">
        <div className="published-content-title-section">
          <h1 className="published-content-title">Published Content</h1>
          <p className="published-content-subtitle">Manage all published contents</p>
        </div>
        <div className="published-content-header-stats">
          <div className="published-content-stat">
            <span className="published-content-stat-number">{stats.totalArticles || filteredArticles.length}</span>
            <span className="published-content-stat-label">Published Articles</span>
          </div>
          <div className="published-content-stat-separator"></div>
          <div className="published-content-stat">
            <span className="published-content-stat-number">
              {stats.totalViews || filteredArticles.reduce((sum, article) => sum + (article.viewCount || 0), 0)}
            </span>
            <span className="published-content-stat-label">Total Views</span>
          </div>
          <div className="published-content-stat-separator"></div>
          <div className="published-content-stat">
            <span className="published-content-stat-number">
              {stats.avgViews || (filteredArticles.length > 0 ? Math.round(filteredArticles.reduce((sum, article) => sum + (article.viewCount || 0), 0) / filteredArticles.length) : 0)}
            </span>
            <span className="published-content-stat-label">Avg Views</span>
          </div>
        </div>
      </div>

       {/* Control Bar */}
       <div className="published-content-control-bar">
         <div className="published-content-control-stats">
           {/* Filter tabs */}
           <button 
             className={`published-content-filter-tab ${activeFilter === 'published' ? 'active' : ''}`}
             onClick={() => handleFilterChange('published')}
           >
             Published: {filterCounts.published}
           </button>
           <div className="published-content-stat-separator"></div>
           <button 
             className={`published-content-filter-tab ${activeFilter === 'archived' ? 'active' : ''}`}
             onClick={() => handleFilterChange('archived')}
           >
             Archived: {filterCounts.archived}
           </button>
           <div className="published-content-stat-separator"></div>
           <button 
             className={`published-content-filter-tab ${activeFilter === 'annual_editions' ? 'active' : ''}`}
             onClick={() => handleFilterChange('annual_editions')}
           >
             Annual Editions: {filterCounts.annual_editions}
           </button>
         </div>
         
         <div className="published-content-controls">
           <div className="published-content-search-container">
             <MagnifyingGlassIcon className="published-content-search-icon" />
             <input
               type="text"
               placeholder="Search published articles..."
               className="published-content-search-input"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
           
           <button
             className={`published-content-filter-btn ${showFilters ? 'active' : ''}`}
             onClick={() => setShowFilters(!showFilters)}
           >
             <FunnelIcon className="published-content-filter-icon" />
             {filterLoading && (
               <div className="published-content-filter-loading">
                 <div className="published-content-loading-spinner"></div>
               </div>
             )}
           </button>

           {hasRole('SECTION_HEAD') && (
             <button
               className="published-content-create-btn"
               onClick={handlePublishAnnualEdition}
             >
               <CloudArrowUpIcon className="w-4 h-4" />
               Publish Online Issue
             </button>
           )}
         </div>
       </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Published Content"
        onApply={() => setShowFilters(false)}
        onClear={() => {
          setSelectedCategory('all');
          setSortBy('publishedAt');
          setSortOrder('desc');
        }}
      >
        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Category</h4>
          <div className="filter-modal-radio-group">
            <label className={`filter-modal-radio-item ${selectedCategory === 'all' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="category"
                value="all"
                checked={selectedCategory === 'all'}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">All Categories</span>
            </label>
            {Array.isArray(categories) && categories.map(category => (
              <label key={category.id} className={`filter-modal-radio-item ${selectedCategory === category.name ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="category"
                  value={category.name}
                  checked={selectedCategory === category.name}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="filter-modal-radio-input"
                />
                <span className="filter-modal-radio-label">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Sort By</h4>
          <div className="filter-modal-radio-group">
            <label className={`filter-modal-radio-item ${sortBy === 'publishedAt' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortBy"
                value="publishedAt"
                checked={sortBy === 'publishedAt'}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Published Date</span>
            </label>
            <label className={`filter-modal-radio-item ${sortBy === 'createdAt' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortBy"
                value="createdAt"
                checked={sortBy === 'createdAt'}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Created Date</span>
            </label>
            <label className={`filter-modal-radio-item ${sortBy === 'updatedAt' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortBy"
                value="updatedAt"
                checked={sortBy === 'updatedAt'}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Last Updated</span>
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
            <label className={`filter-modal-radio-item ${sortBy === 'viewCount' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortBy"
                value="viewCount"
                checked={sortBy === 'viewCount'}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">View Count</span>
            </label>
          </div>
          
          <h4 className="filter-modal-section-title" style={{ marginTop: '16px', marginBottom: '8px' }}>Order</h4>
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
              <span className="filter-modal-radio-label">Newest First</span>
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
              <span className="filter-modal-radio-label">Oldest First</span>
            </label>
          </div>
        </div>
      </FilterModal>

      {/* Articles List */}
      <div className="published-content-list">
        {filteredArticles.length === 0 ? (
          <div className="published-content-empty">
            <DocumentTextIcon className="published-content-empty-icon" />
            <h3 className="published-content-empty-title">No published articles found</h3>
            <p className="published-content-empty-description">
              {searchTerm
                ? 'Try adjusting your search criteria.'
                : 'No articles have been published yet.'}
            </p>
          </div>
        ) : (
          <div className="published-content-table">
            <div className="published-content-table-header">
              <div className="published-content-table-cell">Content</div>
              <div className="published-content-table-cell">Author</div>
              <div className="published-content-table-cell">Published</div>
              <div className="published-content-table-cell">Views</div>
              <div className="published-content-table-cell">Actions</div>
            </div>

            {filteredArticles.map((article) => (
              <div key={article.id} className="published-content-table-row">
                <div className="published-content-table-cell">
                  <div className="published-content-content-cell">
                    <MediaDisplay
                      mediaUrl={article.featuredImage}
                      alt={article.title}
                      className="published-content-article-image"
                      imageClassName="published-content-featured-image"
                      videoClassName="published-content-featured-image"
                      iconClassName="w-6 h-6"
                    />
                    
                    <div className="published-content-article-info">
                      <h4 
                        className="published-content-article-title"
                        onClick={() => handlePreview(article)}
                        style={{ cursor: 'pointer' }}
                        title="Click to view article"
                      >
                        {article.title}
                      </h4>
                      <div className="published-content-article-meta">
                        {article.categories.length > 0 && (
                          <>
                            <div className="published-content-article-top-line">
                              <span className="published-content-article-category">
                                {article.categories[0].name}
                              </span>
                              <span className="published-content-article-separator">•</span>
                              <span className="published-content-article-word-count">
                                {article.wordCount} words
                              </span>
                              <span className="published-content-article-separator">•</span>
                              <span className="published-content-article-read-time">
                                {article.readTime}
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                      <div className="published-content-article-tags">
                        {article.tags.slice(0, 3).map((tag, index) => (
                          <span key={index} className="published-content-tag">{tag.name}</span>
                        ))}
                        {article.tags.length > 3 && (
                          <span className="published-content-tag-more">+{article.tags.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="published-content-table-cell">
                  <div className="published-content-author">
                    {article.author.name}
                  </div>
                </div>

                <div className="published-content-table-cell">
                  <div className="published-content-date">
                    {article.status === 'archived' 
                      ? formatDate(article.publishedAt || article.createdAt || article.updatedAt)
                      : formatDate(article.publishedAt || article.createdAt)
                    }
                  </div>
                </div>

                <div className="published-content-table-cell">
                  <div className="published-content-views">
                    <ChartBarIcon className="w-4 h-4" />
                    <span>{article.viewCount || 0}</span>
                  </div>
                </div>

                <div className="published-content-table-cell">
                  <div className="published-content-actions">
                    <button
                      className="published-content-action-btn view"
                      onClick={() => handlePreview(article)}
                      title="View Article"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                    {article.status === 'archived' ? (
                      <button
                        className="published-content-action-btn update published-content-action-btn-disabled"
                        title="Cannot edit archived articles. Restore to review first."
                        disabled
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        className="published-content-action-btn update"
                        onClick={() => handleUpdate(article)}
                        title="Update Content"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                    )}
                    {article.status === 'archived' ? (
                      (user?.role?.toUpperCase() === 'SECTION_HEAD' || user?.role?.toUpperCase() === 'EDITOR_IN_CHIEF' || user?.role?.toUpperCase() === 'ADVISER' || user?.role?.toUpperCase() === 'SYSTEM_ADMIN') && (
                        <button
                          className="published-content-action-btn restore"
                          onClick={() => handleRestoreArticle(article)}
                          title="Restore Article"
                        >
                          <ArrowUturnLeftIcon className="w-4 h-4" />
                        </button>
                      )
                    ) : (
                      <button
                        className="published-content-action-btn archive"
                        onClick={() => handleArchive(article)}
                        title="Archive Article"
                      >
                        <ArchiveBoxIcon className="w-4 h-4" />
                      </button>
                    )}
                    {(user?.role?.toUpperCase() === 'EDITOR_IN_CHIEF' || user?.role?.toUpperCase() === 'ADVISER' || user?.role?.toUpperCase() === 'SYSTEM_ADMIN') && (
                      <button
                        className="published-content-action-btn delete"
                        onClick={() => handleDeleteArticle(article)}
                        title="Delete Article"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
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

      {/* Archive Confirmation Modal */}
      <ConfirmationModal
        isOpen={showArchiveModal}
        onClose={cancelArchiveArticle}
        onConfirm={confirmArchiveArticle}
        title="Archive Article"
        message={`Are you sure you want to archive this article? This will remove it from the published content list.`}
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
        message="Are you sure you want to restore this article? It will be sent back to the review queue for EIC approval."
        confirmText="Restore"
        cancelText="Cancel"
        type="info"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteArticle}
        onConfirm={confirmDeleteArticle}
        title="Delete Article"
        message="Are you sure you want to permanently delete this article? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Notification Modal */}
      <NotificationModal
        key="notification-modal"
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        title={notificationData.title}
        message={notificationData.message}
        type={notificationData.type}
      />

      {/* Flipbook Input Form Modal */}
      <FlipbookInputForm
        key="flipbook-input-form"
        isOpen={showFlipbookForm}
        onClose={() => setShowFlipbookForm(false)}
        onSubmit={handleFlipbookFormSubmit}
      />

      {/* Flipbook Display Modal */}
      {currentFlipbook && createPortal(
        <FlipbookDisplay
          key="flipbook-display"
          flipbook={currentFlipbook}
          onClose={handleCloseFlipbook}
          onShare={handleShareFlipbook}
        />,
        document.body
      )}
    </div>
  );
};

export default PublishedContent;
