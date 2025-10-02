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
import usePageTitle from '../hooks/usePageTitle';
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
  CloudArrowUpIcon,
  PowerIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline';
import { 
  GlobeAltIcon as GlobeAltIconSolid,
} from '@heroicons/react/24/solid';
import { useAuth } from '../hooks/useAuth';
import FilterModal from '../components/FilterModal';
import '../styles/published-content.css';
import '../styles/media-display.css';
import '../styles/filter-modal.css';
import '../styles/flipbook-display.css';
import '../styles/flipbook-input-form.css';
import '../styles/mycontent.css';

const PublishedContent = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  // Set page title
  usePageTitle('Published Content');
  
  // Debug: Log current user info
  console.log('🔍 PublishedContent Debug:');
  console.log('   Current user:', user);
  console.log('   User role:', user?.role);
  console.log('   User role uppercase:', user?.role?.toUpperCase());
  
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('publicationDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilter, setActiveFilter] = useState('published');
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationData, setNotificationData] = useState({ title: '', message: '', type: 'success' });
  const [showArchiveModal, setShowArchiveModal] = useState(false);
  const [articleToArchive, setArticleToArchive] = useState(null);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [articleToRestore, setArticleToRestore] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [filterCounts, setFilterCounts] = useState({
    published: 0,
    archived: 0,
    online_issues: 0
  });
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
  const [flipbooks, setFlipbooks] = useState([]);
  const [flipbooksLoading, setFlipbooksLoading] = useState(false);
  const [showDeleteFlipbookModal, setShowDeleteFlipbookModal] = useState(false);
  const [flipbookToDelete, setFlipbookToDelete] = useState(null);
  const [showToggleFlipbookModal, setShowToggleFlipbookModal] = useState(false);
  const [flipbookToToggle, setFlipbookToToggle] = useState(null);

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

  // Load flipbooks from API
  const loadFlipbooks = async (filters = {}) => {
    try {
      setFlipbooksLoading(true);
      console.log('🔍 Loading flipbooks with filters:', filters);
      
      // Build API parameters for flipbooks
      const params = {};
      
      // Add search parameter
      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      
      // Add type filter (map from category to flipbook type)
      if (filters.category && filters.category !== 'all') {
        // Map category names to flipbook types
        const categoryToTypeMap = {
          'Newsletter': 'NEWSLETTER',
          'Tabloid': 'TABLOID', 
          'Magazine': 'MAGAZINE',
          'Literary Folio': 'LITERARY_FOLIO',
          'Art Compilation': 'ART_COMPILATION',
          'Special Editions': 'SPECIAL_EDITIONS'
        };
        
        if (categoryToTypeMap[filters.category]) {
          params.type = categoryToTypeMap[filters.category];
        }
      }
      
      // Add sorting parameters
      if (filters.sortBy) {
        // Map article sort fields to flipbook sort fields
        const sortFieldMap = {
          'publishedAt': 'createdAt',
          'createdAt': 'createdAt',
          'updatedAt': 'createdAt', // Flipbooks don't have updatedAt, use createdAt
          'title': 'title', // Use 'title' for flipbook name sorting
          'type': 'type',
          'isActive': 'isActive',
          'author': 'title', // Sort by name for flipbooks
          'viewCount': 'createdAt' // Flipbooks don't have viewCount, use createdAt
        };
        params.sortBy = sortFieldMap[filters.sortBy] || 'createdAt';
      }
      
      if (filters.sortOrder) {
        params.sortOrder = filters.sortOrder;
      }
      
      console.log('🔍 Flipbook API params:', params);
      const response = await flipbookService.getFlipbooks(params);
      console.log('🔍 Flipbooks API response:', response);
      console.log('🔍 Response data:', response.data);
      
      const flipbooksData = response.data?.items || [];
      console.log('🔍 Number of flipbooks:', flipbooksData.length);
      console.log('🔍 First flipbook data:', flipbooksData[0]);
      console.log('🔍 First flipbook thumbnailUrl:', flipbooksData[0]?.thumbnailUrl);
      
      flipbooksData.forEach((flipbook, index) => {
        console.log(`🔍 Flipbook ${index + 1}:`, {
          id: flipbook.id,
          name: flipbook.name,
          embedUrl: flipbook.embedUrl,
          embed_url: flipbook.embed_url, // Check both possible field names
          type: flipbook.type,
          isActive: flipbook.isActive
        });
      });
      
      setFlipbooks(flipbooksData);
    } catch (error) {
      console.error('Error loading flipbooks:', error);
      setFlipbooks([]);
    } finally {
      setFlipbooksLoading(false);
    }
  };

  // Load published articles from API
  const loadPublishedArticles = async (filters = {}, showLoading = false) => {
    try {
      if (showLoading) {
        setLoading(true);
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
      } else if (filters.activeFilter === 'online_issues') {
        // For online issues, we'll fetch all published articles and filter by category
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
          excerpt: createExcerpt(article.content) || article.title,
          content: article.content,
          wordCount: calculateWordCount(article.content),
          readTime: article.readingTime ? `${article.readingTime} min read` : calculateReadTime(article.content),
          categories: article.categories || [],
          tags: article.tags || [],
          featuredImage: article.featuredImage || null,
          reviewer: article.reviewer,
          reviewerId: article.reviewerId
        }));
        
        // Apply online_issues filter if needed (still frontend since it's a special case)
        let finalArticles = transformedArticles;
        if (filters.activeFilter === 'online_issues') {
          finalArticles = transformedArticles.filter(article => 
            article.categories.some(cat => 
              cat.name.toLowerCase().includes('online') || 
              cat.name.toLowerCase().includes('issue')
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
        }
      }
    };

  // Load articles or flipbooks on mount
  useEffect(() => {
    if (user?.id) {
      if (activeFilter === 'online_issues') {
        loadFlipbooks({
          search: searchTerm,
          category: selectedCategory,
          sortBy: sortBy,
          sortOrder: sortOrder
        });
      } else {
        loadPublishedArticles({ activeFilter }, true); // Show loading on initial load
      }
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
        const [publishedCount, archivedCount, onlineIssuesCount] = await Promise.all([
          getFilterCount('published'),
          getFilterCount('archived'),
          getFilterCount('online_issues')
        ]);
        
        setFilterCounts({
          published: publishedCount,
          archived: archivedCount,
          online_issues: onlineIssuesCount
        });
      } catch (error) {
        console.error('Error loading stats and filter counts:', error);
      }
    };

    loadStatsAndCounts();
  }, []);

  // Apply filters and reload articles or flipbooks
  useEffect(() => {
    if (user?.id) {
      if (activeFilter === 'online_issues') {
        loadFlipbooks({
          search: searchTerm,
          category: selectedCategory,
          sortBy: sortBy,
          sortOrder: sortOrder
        });
      } else {
        loadPublishedArticles({
          activeFilter: activeFilter,
          search: searchTerm,
          category: selectedCategory,
          sortBy: sortBy,
          sortOrder: sortOrder
        }, false); // Don't show loading on filter changes
      }
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
      setArchiveLoading(true);
      await articlesAPI.updateArticleStatus(articleToArchive, 'ARCHIVED');
      
      // Remove the archived article from the current list since it's no longer published
      setArticles(articles.filter(article => article.id !== articleToArchive));
      setFilteredArticles(filteredArticles.filter(article => article.id !== articleToArchive));
      
      // Refresh filter counts
        const [publishedCount, archivedCount, onlineIssuesCount] = await Promise.all([
        getFilterCount('published'),
        getFilterCount('archived'),
        getFilterCount('online_issues')
      ]);
      
      setFilterCounts({
        published: publishedCount,
        archived: archivedCount,
        online_issues: onlineIssuesCount
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
      setArchiveLoading(false);
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
      setRestoreLoading(true);
      await articlesAPI.updateArticleStatus(articleToRestore, 'IN_REVIEW');
      
      // Remove the restored article from the current list since it's no longer archived
      setArticles(articles.filter(article => article.id !== articleToRestore));
      setFilteredArticles(filteredArticles.filter(article => article.id !== articleToRestore));
      
      // Refresh filter counts
        const [publishedCount, archivedCount, onlineIssuesCount] = await Promise.all([
        getFilterCount('published'),
        getFilterCount('archived'),
        getFilterCount('online_issues')
      ]);
      
      setFilterCounts({
        published: publishedCount,
        archived: archivedCount,
        online_issues: onlineIssuesCount
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
      setRestoreLoading(false);
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
      setDeleteLoading(true);
      await articlesAPI.deleteArticle(articleToDelete);
      
      // Update both articles and filteredArticles states
      setArticles(articles.filter(article => article.id !== articleToDelete));
      setFilteredArticles(filteredArticles.filter(article => article.id !== articleToDelete));
      
      // Refresh filter counts
        const [publishedCount, archivedCount, onlineIssuesCount] = await Promise.all([
        getFilterCount('published'),
        getFilterCount('archived'),
        getFilterCount('online_issues')
      ]);
      
      setFilterCounts({
        published: publishedCount,
        archived: archivedCount,
        online_issues: onlineIssuesCount
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
      setDeleteLoading(false);
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
      if (filter === 'online_issues') {
        // Get flipbook count for online issues
        const response = await flipbookService.getFlipbooks();
        return response.data?.items?.length || 0;
      }
      
      let statusFilter = 'PUBLISHED';
      if (filter === 'archived') {
        statusFilter = 'ARCHIVED';
      } else if (filter === 'published') {
        statusFilter = 'PUBLISHED';
      }
      
      const response = await articlesAPI.getPublishedContent({ status: statusFilter });
      const articles = response.data?.items || [];
      
        return articles.length;
    } catch (error) {
      console.error('Error getting filter count:', error);
      return 0;
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    
    // Reset sort options when switching between article and flipbook views
    if (filter === 'online_issues') {
      // Set appropriate defaults for flipbook view
      if (sortBy === 'publishedAt' || sortBy === 'updatedAt' || sortBy === 'viewCount') {
        setSortBy('createdAt');
      }
    } else {
      // Set appropriate defaults for article view
      if (sortBy === 'type' || sortBy === 'isActive') {
        setSortBy('publicationDate');
      }
    }
  };

  // Flipbook handling functions
  const handlePublishOnlineIssue = () => {
    console.log('🔍 Publish Online Issue button clicked');
    console.log('🔍 Current user:', user);
    console.log('🔍 User role:', user?.role);
    console.log('🔍 Has SECTION_HEAD role:', hasRole('SECTION_HEAD'));
    
    // Reset current flipbook to ensure we're creating a new one
    setCurrentFlipbook(null);
    setShowFlipbookForm(true);
    console.log('🔍 Flipbook form should now be visible');
  };

  const handleFlipbookFormSubmit = async (formData) => {
    try {
      // Debug: Log user information
      console.log('🔍 Frontend Debug - User Info:');
      console.log('   User:', user);
      console.log('   User role:', user?.role);
      console.log('   User role uppercase:', user?.role?.toUpperCase());
      console.log('   Has SECTION_HEAD role:', hasRole('SECTION_HEAD'));
      console.log('   Required roles for flipbook:', ['SECTION_HEAD', 'ADMIN_ASSISTANT', 'ADMINISTRATOR', 'SYSTEM_ADMIN']);
      console.log('   User has required role:', ['SECTION_HEAD', 'ADMIN_ASSISTANT', 'ADMINISTRATOR', 'SYSTEM_ADMIN'].includes(user?.role?.toUpperCase()));
      console.log('   Token exists:', !!localStorage.getItem('token'));
      console.log('   Token value:', localStorage.getItem('token'));
      
      // Check user role before proceeding - use explicit role check
      const allowedRoles = ['SECTION_HEAD', 'ADMIN_ASSISTANT', 'ADMINISTRATOR', 'SYSTEM_ADMIN'];
      if (!allowedRoles.includes(user?.role?.toUpperCase())) {
        throw new Error('Access denied. Only Section Heads, Admin Assistant, Administrators, and System Admins can publish online issues.');
      }

      const flipbookData = {
        name: formData.name,
        embedUrl: formData.embedLink,
        type: formData.type.toUpperCase(),
        releaseDate: formData.releaseDate || null
      };

      // Only include thumbnailImage if a new image was uploaded
      if (formData.thumbnailImage) {
        flipbookData.thumbnailImage = formData.thumbnailImage;
      }

      let response;
      let isEdit = currentFlipbook && currentFlipbook.id;

      if (isEdit) {
        // Update existing flipbook
        response = await flipbookService.updateFlipbook(currentFlipbook.id, flipbookData);
      } else {
        // Create new flipbook
        response = await flipbookService.createFlipbook(flipbookData);
      }

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
        isActive: response.data.isActive,
        thumbnailUrl: response.data.thumbnailUrl // Include thumbnail URL
      };

      setCurrentFlipbook(flipbook);
      
      // Close the form and don't show preview for both new and edited flipbooks
      setShowFlipbookModal(false);
      setShowFlipbookForm(false);

      // Refresh flipbooks list if we're in online issues view
      if (activeFilter === 'online_issues') {
        loadFlipbooks({
          search: searchTerm,
          category: selectedCategory,
          sortBy: sortBy,
          sortOrder: sortOrder
        });
      }

      // Update filter counts after adding/updating flipbook
      const onlineIssuesCount = await getFilterCount('online_issues');
      setFilterCounts(prev => ({
        ...prev,
        online_issues: onlineIssuesCount
      }));

      showNotification(
        'Success', 
        `${formData.name} ${isEdit ? 'updated' : 'published'} successfully!`, 
        'success'
      );
    } catch (error) {
      console.error(`Error ${currentFlipbook && currentFlipbook.id ? 'updating' : 'creating'} flipbook:`, error);
      
      let errorMessage = `Failed to ${currentFlipbook && currentFlipbook.id ? 'update' : 'create'} flipbook`;
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid data provided. Please check your inputs.';
      } else if (error.response?.status === 401) {
        errorMessage = 'You are not authorized to publish flipbooks.';
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to publish flipbooks. Only Section Heads, Admin Assistant, Administrators, and System Admins can create flipbooks.';
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

  const handleEditFlipbook = (flipbook) => {
    // Convert relative thumbnail URL to full URL if needed
    const thumbnailUrl = flipbook.thumbnailUrl 
      ? (flipbook.thumbnailUrl.startsWith('http') 
          ? flipbook.thumbnailUrl 
          : `http://localhost:3001${flipbook.thumbnailUrl}`)
      : null;
    
    // Create edit data object for the form
    const editData = {
      id: flipbook.id,
      title: flipbook.name,
      url: flipbook.embedUrl,
      embedCode: `<iframe src="${flipbook.embedUrl}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>`,
      embed_url: flipbook.embedUrl,
      createdAt: flipbook.createdAt,
      created_at: flipbook.createdAt,
      fileSize: 0,
      file_size: 0,
      fileName: flipbook.name,
      file_name: flipbook.name,
      status: 'completed',
      type: flipbook.type,
      releaseDate: flipbook.releaseDate,
      isActive: flipbook.isActive,
      thumbnailUrl: thumbnailUrl, // Include existing thumbnail URL with full path
      thumbnailImage: thumbnailUrl // Include for form pre-population
    };
    
    console.log('🖼️ Edit flipbook data:', editData);
    
    // Set the edit data and show the form (no preview)
    setCurrentFlipbook(editData);
    setShowFlipbookForm(true);
    setShowFlipbookModal(false); // Ensure preview modal is closed
  };

  const handleShareFlipbook = (flipbook) => {
    console.log('Sharing flipbook:', flipbook);
    // Additional sharing logic can be implemented here
  };

  const handleDeleteFlipbook = (flipbook) => {
    setFlipbookToDelete(flipbook);
    setShowDeleteFlipbookModal(true);
  };

  const confirmDeleteFlipbook = async () => {
    if (!flipbookToDelete) return;

    try {
      await flipbookService.deleteFlipbook(flipbookToDelete.id);
      
      // Update flipbooks list
      setFlipbooks(flipbooks.filter(flipbook => flipbook.id !== flipbookToDelete.id));
      
      // Refresh filter counts
      const onlineIssuesCount = await getFilterCount('online_issues');
      setFilterCounts(prev => ({
        ...prev,
        online_issues: onlineIssuesCount
      }));
      
      showNotification('Success', 'Online issue deleted successfully', 'success');
    } catch (error) {
      console.error('Error deleting flipbook:', error);
      
      let errorMessage = 'Failed to delete online issue';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to delete this online issue';
      } else if (error.response?.status === 404) {
        errorMessage = 'Online issue not found';
      }
      
      showNotification('Error', errorMessage, 'error');
    } finally {
      setShowDeleteFlipbookModal(false);
      setFlipbookToDelete(null);
    }
  };

  const cancelDeleteFlipbook = () => {
    setShowDeleteFlipbookModal(false);
    setFlipbookToDelete(null);
  };

  const handleToggleFlipbookStatus = (flipbook) => {
    setFlipbookToToggle(flipbook);
    setShowToggleFlipbookModal(true);
  };

  const confirmToggleFlipbookStatus = async () => {
    if (!flipbookToToggle) return;

    try {
      await flipbookService.toggleFlipbookStatus(flipbookToToggle.id);
      
      // Update flipbooks list
      setFlipbooks(flipbooks.map(fb => 
        fb.id === flipbookToToggle.id 
          ? { ...fb, isActive: !fb.isActive }
          : fb
      ));
      
      showNotification(
        'Success', 
        `Online issue ${!flipbookToToggle.isActive ? 'activated' : 'deactivated'} successfully`, 
        'success'
      );
    } catch (error) {
      console.error('Error toggling flipbook status:', error);
      
      let errorMessage = 'Failed to update online issue status';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 403) {
        errorMessage = 'You do not have permission to modify this online issue';
      } else if (error.response?.status === 404) {
        errorMessage = 'Online issue not found';
      }
      
      showNotification('Error', errorMessage, 'error');
    } finally {
      setShowToggleFlipbookModal(false);
      setFlipbookToToggle(null);
    }
  };

  const cancelToggleFlipbookStatus = () => {
    setShowToggleFlipbookModal(false);
    setFlipbookToToggle(null);
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

  // Generate thumbnail URL from flipbook embed URL
  const getFlipbookThumbnail = (embedUrl) => {
    if (!embedUrl) return null;
    
    try {
      console.log('🔍 Generating thumbnail for embedUrl:', embedUrl);
      
      // For FlipHTML5 URLs, try multiple thumbnail patterns
      if (embedUrl.includes('fliphtml5.com')) {
        const baseUrl = embedUrl.replace(/\/$/, '');
        
        // Try different thumbnail patterns
        const patterns = [
          `${baseUrl}/p1.jpg`,           // Page 1 as JPG
          `${baseUrl}/p1.png`,           // Page 1 as PNG
          `${baseUrl}/thumb.jpg`,        // Thumbnail as JPG
          `${baseUrl}/thumbnail.jpg`,    // Thumbnail as JPG
          `${baseUrl}/cover.jpg`,        // Cover as JPG
          `${baseUrl}/preview.jpg`,      // Preview as JPG
          `${baseUrl}/p1`,               // Page 1 without extension
          `${baseUrl}/thumb`,            // Thumbnail without extension
        ];
        
        // For now, return the first pattern (p1.jpg) and let the error handling deal with it
        const thumbnailUrl = patterns[0];
        console.log('✅ Generated thumbnail URL:', thumbnailUrl);
        console.log('📋 All patterns to try:', patterns);
        return thumbnailUrl;
      }
      
      console.log('❌ No thumbnail pattern matched for URL:', embedUrl);
      return null;
    } catch (error) {
      console.error('Error generating thumbnail URL:', error);
      return null;
    }
  };

  // Component to handle thumbnail with uploaded image
  const FlipbookThumbnail = ({ flipbook }) => {
    // Generate a placeholder thumbnail based on flipbook type
    const getPlaceholderThumbnail = (type) => {
      const typeColors = {
        'NEWSLETTER': '#3B82F6',      // Blue
        'TABLOID': '#F59E0B',         // Amber
        'MAGAZINE': '#10B981',        // Emerald
        'LITERARY_FOLIO': '#8B5CF6',  // Violet
        'ART_COMPILATION': '#EC4899', // Pink
        'SPECIAL_EDITIONS': '#EF4444' // Red
      };
      
      const typeIcons = {
        'NEWSLETTER': '📰',
        'TABLOID': '📰',
        'MAGAZINE': '📖',
        'LITERARY_FOLIO': '📚',
        'ART_COMPILATION': '🎨',
        'SPECIAL_EDITIONS': '⭐'
      };
      
      const color = typeColors[type] || '#6B7280';
      const icon = typeIcons[type] || '📄';
      
      return {
        color,
        icon,
        text: type?.replace('_', ' ') || 'Flipbook'
      };
    };

    // Use uploaded thumbnail image if available
    if (flipbook.thumbnailUrl) {
      return (
        <div className="published-content-article-image">
          <img 
            src={`http://localhost:3001${flipbook.thumbnailUrl}`} 
            alt={`${flipbook.name} - Thumbnail`}
            className="published-content-featured-image"
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          {/* Fallback placeholder (hidden by default) */}
          <div 
            className="published-content-article-icon"
            style={{
              backgroundColor: getPlaceholderThumbnail(flipbook.type).color,
              display: 'none',
              flexDirection: 'column',
              color: 'white',
              fontSize: '20px',
              fontWeight: 'bold'
            }}
            title={`${getPlaceholderThumbnail(flipbook.type).text} - ${flipbook.name}`}
          >
            <div style={{ fontSize: '24px', marginBottom: '2px' }}>
              {getPlaceholderThumbnail(flipbook.type).icon}
            </div>
            <div style={{ fontSize: '8px', textAlign: 'center', lineHeight: '1' }}>
              {getPlaceholderThumbnail(flipbook.type).text.split(' ').map(word => word.charAt(0)).join('')}
            </div>
          </div>
        </div>
      );
    }
    
    const placeholder = getPlaceholderThumbnail(flipbook.type);
    
    return (
      <div className="published-content-article-image">
        <div 
          className="published-content-article-icon"
          style={{
            backgroundColor: placeholder.color,
            color: 'white',
            fontSize: '20px',
            fontWeight: 'bold'
          }}
          title={`${placeholder.text} - ${flipbook.name}`}
        >
          <div style={{ fontSize: '24px', marginBottom: '2px' }}>
            {placeholder.icon}
          </div>
          <div style={{ fontSize: '8px', textAlign: 'center', lineHeight: '1' }}>
            {placeholder.text.split(' ').map(word => word.charAt(0)).join('')}
          </div>
        </div>
      </div>
    );
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

  // Remove loading spinner - show content immediately
  // if (loading) {
  //   return (
  //     <div className="published-content-container">
  //       <div className="published-content-loading">
  //         <div className="published-content-spinner"></div>
  //         <p>Loading published content...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className={`published-content-container ${showFilters ? 'filters-open' : ''}`}>
      {/* Header */}
      <div className="published-content-header">
        <div className="flex items-center space-x-4">
          <div>
            <GlobeAltIconSolid className="h-8 w-8 text-black" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-black">Published Content</h1>
            <p className="text-gray-600">Manage all published contents</p>
          </div>
        </div>
        <div className="published-content-header-stats">
          {activeFilter === 'online_issues' ? (
            <>
          <div className="published-content-stat">
                <span className="published-content-stat-number">{flipbooks.length}</span>
                <span className="published-content-stat-label">Online Issues</span>
              </div>
              <div className="published-content-stat-separator"></div>
              <div className="published-content-stat">
                <span className="published-content-stat-number">
                  {flipbooks.filter(fb => fb.isActive).length}
                </span>
                <span className="published-content-stat-label">Active Issues</span>
              </div>
              <div className="published-content-stat-separator"></div>
              <div className="published-content-stat">
                <span className="published-content-stat-number">
                  {flipbooks.filter(fb => !fb.isActive).length}
                </span>
                <span className="published-content-stat-label">Inactive Issues</span>
              </div>
            </>
          ) : (
            <>
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
            </>
          )}
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
             className={`published-content-filter-tab ${activeFilter === 'online_issues' ? 'active' : ''}`}
             onClick={() => handleFilterChange('online_issues')}
           >
             Online Issues: {filterCounts.online_issues}
           </button>
         </div>
         
         <div className="published-content-controls">
           <div className="published-content-search-container">
             <MagnifyingGlassIcon className="published-content-search-icon" />
             <input
               type="text"
               placeholder={activeFilter === 'online_issues' ? "Search online issues..." : "Search published articles..."}
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
           </button>

           {hasRole('SECTION_HEAD') && (
             <>
               {console.log('🔍 Rendering Publish Online Issue button for user:', user?.role)}
               <button
             className="published-content-create-btn"
                 onClick={(e) => {
                   console.log('🔍 Button clicked directly');
                   e.preventDefault();
                   e.stopPropagation();
                   handlePublishOnlineIssue();
                 }}
                 type="button"
                 disabled={false}
               >
                 <CloudArrowUpIcon className="w-4 h-4" />
                 Publish Online Issue
               </button>
             </>
           )}
         </div>
       </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title={activeFilter === 'online_issues' ? "Filter Online Issues" : "Filter Published Content"}
        onApply={() => setShowFilters(false)}
        onClear={() => {
          setSelectedCategory('all');
          setSortBy(activeFilter === 'online_issues' ? 'createdAt' : 'publicationDate');
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
            {activeFilter === 'online_issues' ? (
              // Show flipbook types for online issues
              ['Newsletter', 'Tabloid', 'Magazine', 'Literary Folio', 'Art Compilation', 'Special Editions'].map(type => (
                <label key={type} className={`filter-modal-radio-item ${selectedCategory === type ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="category"
                    value={type}
                    checked={selectedCategory === type}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="filter-modal-radio-input"
                  />
                  <span className="filter-modal-radio-label">{type}</span>
                </label>
              ))
            ) : (
              // Show article categories for other filters
              Array.isArray(categories) && categories.map(category => (
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
              ))
            )}
          </div>
          </div>

        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Sort By</h4>
          <div className="filter-modal-radio-group">
            {activeFilter === 'online_issues' ? (
              // Show flipbook-specific sort options
              <>
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
                <label className={`filter-modal-radio-item ${sortBy === 'title' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="sortBy"
                    value="title"
                    checked={sortBy === 'title'}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="filter-modal-radio-input"
                  />
                  <span className="filter-modal-radio-label">Name</span>
                </label>
                <label className={`filter-modal-radio-item ${sortBy === 'type' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="sortBy"
                    value="type"
                    checked={sortBy === 'type'}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="filter-modal-radio-input"
                  />
                  <span className="filter-modal-radio-label">Type</span>
                </label>
                <label className={`filter-modal-radio-item ${sortBy === 'isActive' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="sortBy"
                    value="isActive"
                    checked={sortBy === 'isActive'}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="filter-modal-radio-input"
                  />
                  <span className="filter-modal-radio-label">Status</span>
                </label>
              </>
            ) : (
              // Show article-specific sort options
              <>
                <label className={`filter-modal-radio-item ${sortBy === 'publicationDate' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="sortBy"
                    value="publicationDate"
                    checked={sortBy === 'publicationDate'}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="filter-modal-radio-input"
                  />
                  <span className="filter-modal-radio-label">Publication Date</span>
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
              </>
            )}
          </div>
        </div>

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

      {/* Articles List or Flipbooks List */}
      <div className="published-content-list">
        {activeFilter === 'online_issues' ? (
          // Show flipbooks for online issues
          flipbooksLoading ? (
            <div className="uniform-loading">
              <div className="uniform-spinner"></div>
              <p className="uniform-loading-text">Loading online issues...</p>
            </div>
          ) : flipbooks.length === 0 ? (
            <div className="published-content-empty">
              <DocumentTextIcon className="published-content-empty-icon" />
              <h3 className="published-content-empty-title">No online issues found</h3>
              <p className="published-content-empty-description">
                No flipbooks have been published yet. Create your first online issue!
              </p>
            </div>
          ) : (
            <div className="published-content-table">
              <div className="published-content-table-header">
                <div className="published-content-table-cell">Content</div>
                <div className="published-content-table-cell">Type</div>
                <div className="published-content-table-cell">Created</div>
                <div className="published-content-table-cell">Status</div>
                <div className="published-content-table-cell">Actions</div>
              </div>

              {flipbooks.map((flipbook) => (
                  <div key={flipbook.id} className="published-content-table-row">
                    <div className="published-content-table-cell">
                      <div className="published-content-content-cell">
                        <FlipbookThumbnail flipbook={flipbook} />
                        <div className="published-content-article-info">
                        <h4 className="published-content-article-title">
                          {flipbook.name}
                        </h4>
                        <div className="published-content-article-meta">
                          <div className="published-content-article-top-line">
                            <span className="published-content-article-category">
                              {flipbook.user ? `${flipbook.user.firstName} ${flipbook.user.lastName}` : 'Unknown Author'}
                            </span>
                          </div>
                        </div>
                        </div>
                      </div>
                    </div>

                  <div className="published-content-table-cell">
                    <div className="published-content-author">
                      <span className={`published-content-type-badge published-content-type-badge-${flipbook.type?.toLowerCase()}`}>
                        {flipbook.type}
                      </span>
                    </div>
                  </div>

                  <div className="published-content-table-cell">
                    <div className="published-content-date">
                      {formatDate(flipbook.createdAt)}
                    </div>
                  </div>

                  <div className="published-content-table-cell">
                    <div className="published-content-views">
                      <span className={`published-content-status-badge published-content-status-badge-${flipbook.isActive ? 'active' : 'inactive'}`}>
                        <CheckCircleIcon className="w-4 h-4" />
                        {flipbook.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <div className="published-content-table-cell">
                    <div className="published-content-actions">
                      <button
                        className="published-content-action-btn view"
                        onClick={() => {
                          setCurrentFlipbook({
                            id: flipbook.id,
                            title: flipbook.name,
                            url: flipbook.embedUrl,
                            embedCode: `<iframe src="${flipbook.embedUrl}" width="100%" height="600px" frameborder="0" allowfullscreen></iframe>`,
                            embed_url: flipbook.embedUrl,
                            createdAt: flipbook.createdAt,
                            created_at: flipbook.createdAt,
                            fileSize: 0,
                            file_size: 0,
                            fileName: flipbook.name,
                            file_name: flipbook.name,
                            status: 'completed',
                            type: flipbook.type,
                            releaseDate: flipbook.releaseDate,
                            isActive: flipbook.isActive
                          });
                          setShowFlipbookModal(true);
                        }}
                        title="View Flipbook"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      {(user?.role?.toUpperCase() === 'SECTION_HEAD' || user?.role?.toUpperCase() === 'ADMIN_ASSISTANT' || user?.role?.toUpperCase() === 'ADMINISTRATOR' || user?.role?.toUpperCase() === 'SYSTEM_ADMIN') && (
                        <button
                          className="published-content-action-btn update"
                          onClick={() => handleEditFlipbook(flipbook)}
                          title="Update Online Issue"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                      {(user?.role?.toUpperCase() === 'SECTION_HEAD' || user?.role?.toUpperCase() === 'ADMIN_ASSISTANT' || user?.role?.toUpperCase() === 'ADMINISTRATOR' || user?.role?.toUpperCase() === 'SYSTEM_ADMIN') && (
                        <button
                          className="published-content-action-btn update"
                          onClick={() => handleToggleFlipbookStatus(flipbook)}
                          title={`${flipbook.isActive ? 'Deactivate' : 'Activate'} Online Issue`}
                        >
                          <PowerIcon className="w-4 h-4" />
                        </button>
                      )}
                      {(user?.role?.toUpperCase() === 'ADMIN_ASSISTANT' || user?.role?.toUpperCase() === 'ADMINISTRATOR' || user?.role?.toUpperCase() === 'SYSTEM_ADMIN') && (
                        <button
                          className="published-content-action-btn delete"
                          onClick={() => handleDeleteFlipbook(flipbook)}
                          title="Delete Online Issue"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // Show articles for other filters
          filteredArticles.length === 0 ? (
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
                      ? formatDate(article.publishedAt || article.publicationDate || article.createdAt || article.updatedAt)
                      : formatDate(article.publishedAt || article.publicationDate || article.createdAt)
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
                      title="View Content"
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
                      (user?.role?.toUpperCase() === 'SECTION_HEAD' || user?.role?.toUpperCase() === 'ADMIN_ASSISTANT' || user?.role?.toUpperCase() === 'ADMINISTRATOR' || user?.role?.toUpperCase() === 'SYSTEM_ADMIN') && (
                        <button
                          className="published-content-action-btn restore"
                          onClick={() => handleRestoreArticle(article)}
                          title="Restore Content"
                        >
                          <ArrowUturnLeftIcon className="w-4 h-4" />
                        </button>
                      )
                    ) : (
                    <button
                      className="published-content-action-btn archive"
                      onClick={() => handleArchive(article)}
                      title="Archive Content"
                    >
                      <ArchiveBoxIcon className="w-4 h-4" />
                    </button>
                    )}
                    {(user?.role?.toUpperCase() === 'ADMIN_ASSISTANT' || user?.role?.toUpperCase() === 'ADMINISTRATOR' || user?.role?.toUpperCase() === 'SYSTEM_ADMIN') && article.status === 'archived' && (
                      <button
                        className="published-content-action-btn delete"
                        onClick={() => handleDeleteArticle(article)}
                        title="Delete Content"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )
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
        title="Archive Content"
        message={`Are you sure you want to archive this article? This will remove it from the published content list.`}
        confirmText="Archive"
        cancelText="Cancel"
        type="warning"
        isLoading={archiveLoading}
      />

      {/* Restore Confirmation Modal */}
      <ConfirmationModal
        isOpen={showRestoreModal}
        onClose={cancelRestoreArticle}
        onConfirm={confirmRestoreArticle}
        title="Restore Content"
        message="Are you sure you want to restore this article? It will be sent back to the review queue for Admin approval."
        confirmText="Restore"
        cancelText="Cancel"
        type="info"
        isLoading={restoreLoading}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteArticle}
        onConfirm={confirmDeleteArticle}
        title="Delete Content"
        message="Are you sure you want to permanently delete this article? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        isLoading={deleteLoading}
      />

      {/* Delete Flipbook Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteFlipbookModal}
        onClose={cancelDeleteFlipbook}
        onConfirm={confirmDeleteFlipbook}
        title="Delete Online Issue"
        message={`Are you sure you want to permanently delete "${flipbookToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />

      {/* Toggle Flipbook Status Confirmation Modal */}
      <ConfirmationModal
        isOpen={showToggleFlipbookModal}
        onClose={cancelToggleFlipbookStatus}
        onConfirm={confirmToggleFlipbookStatus}
        title={`${flipbookToToggle?.isActive ? 'Deactivate' : 'Activate'} Online Issue`}
        message={`Are you sure you want to ${flipbookToToggle?.isActive ? 'deactivate' : 'activate'} "${flipbookToToggle?.name}"?`}
        confirmText={flipbookToToggle?.isActive ? 'Deactivate' : 'Activate'}
        cancelText="Cancel"
        type="warning"
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
        onClose={() => {
          setShowFlipbookForm(false);
          setCurrentFlipbook(null);
        }}
        onSubmit={handleFlipbookFormSubmit}
        editData={currentFlipbook}
      />

      {/* Flipbook Display Modal - Only show when viewing, not editing */}
      {currentFlipbook && showFlipbookModal && createPortal(
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
