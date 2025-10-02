import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { 
  StarIcon as StarIconSolid,
} from '@heroicons/react/24/solid';
import { articlesAPI, categoriesAPI } from '../services/apiService';
import MediaDisplay from '../components/MediaDisplay';
import FilterModal from '../components/FilterModal';
import SuccessModal from '../components/SuccessModal';
import usePageTitle from '../hooks/usePageTitle';
import '../styles/dashboard.css';
import '../styles/featured-articles-page.css';
import '../styles/filter-modal.css';

const FeaturedArticlesPage = () => {
  const navigate = useNavigate();
  const [allArticles, setAllArticles] = useState([]);
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('publicationDate');
  const [sortOrder, setSortOrder] = useState('desc');
  const [categories, setCategories] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Set page title
  usePageTitle('Manage Featured Articles');

  useEffect(() => {
    fetchAllArticles();
    fetchFeaturedArticles();
    fetchCategories();
  }, []);

  const fetchAllArticles = async (filters = {}, reset = true) => {
    try {
      if (reset) {
        setLoading(true);
        setCurrentPage(1);
      } else {
        setLoadingMore(true);
      }
      
      const params = {
        status: 'published',
        sortBy: filters.sortBy || sortBy,
        sortOrder: filters.sortOrder || sortOrder,
        limit: 10,
        page: reset ? 1 : currentPage + 1
      };
      
      // Add search parameter
      if (filters.search && filters.search.trim()) {
        params.search = filters.search.trim();
      }
      
      // Add category filter
      if (filters.category && filters.category !== 'all') {
        params.category = filters.category;
      }
      
      const response = await articlesAPI.getArticles(params);
      
      const articles = response.data?.items?.map(article => {
        // Get the best available date for display purposes
        let displayDate = article.publicationDate || article.publishedAt || article.createdAt;
        
        // Check if the date is valid and not a default/epoch date
        const dateObj = new Date(displayDate);
        const isValidDate = dateObj instanceof Date && !isNaN(dateObj.getTime());
        const isNotEpochDate = dateObj.getFullYear() > 1990; // Filter out dates before 1990
        
        if (!isValidDate || !isNotEpochDate) {
          // Use createdAt as fallback for invalid dates
          displayDate = article.createdAt;
        }
        
        return {
          id: article.id,
          title: article.title,
          content: article.content,
          featuredImage: article.featuredImage,
          publicationDate: article.publicationDate, // Keep original for sorting
          displayDate: displayDate, // Use this for display
          viewCount: article.viewCount || 0,
          categories: article.categories || [],
          status: article.status
        };
      }) || [];
      
      // Check if there are more articles
      const totalCount = response.data?.pagination?.totalCount || response.data?.pagination?.total || 0;
      const currentArticlesCount = reset ? articles.length : allArticles.length + articles.length;
      setHasMore(currentArticlesCount < totalCount);
      
      if (reset) {
        setAllArticles(articles);
        setCurrentPage(1);
      } else {
        setAllArticles(prev => [...prev, ...articles]);
        setCurrentPage(prev => prev + 1);
      }
    } catch (err) {
      setError('Failed to fetch published articles');
      console.error('Error fetching articles:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const fetchFeaturedArticles = async () => {
    try {
      const response = await articlesAPI.getFeaturedArticles();
      setFeaturedArticles(response.data || []);
    } catch (err) {
      console.error('Error fetching featured articles:', err);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await categoriesAPI.getCategories();
      setCategories(response.data?.items || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to fetch categories');
    }
  };

  const toggleFeatured = (articleId) => {
    setFeaturedArticles(prev => {
      const isFeatured = prev.some(article => article.id === articleId);
      if (isFeatured) {
        return prev.filter(article => article.id !== articleId);
      } else {
        if (prev.length >= 5) {
          setError('You can only select up to 5 featured articles');
          return prev;
        }
        const article = allArticles.find(a => a.id === articleId);
        return [...prev, article];
      }
    });
    setError('');
    setSuccess('');
    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      await articlesAPI.updateFeaturedArticles(featuredArticles.map(article => article.id));
      setHasChanges(false);
      setSuccess('Featured articles saved successfully!');
      setShowSuccessModal(true);
    } catch (err) {
      setError('Failed to save featured articles. Please try again.');
      console.error('Error saving featured articles:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (hasChanges) {
      if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
        navigate('/dashboard');
      }
    } else {
      navigate('/dashboard');
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setError('');
    setSuccess('');
    fetchAllArticles({ search: value, category: selectedCategory, sortBy, sortOrder }, true);
  };

  const handleFilterChange = (category) => {
    setSelectedCategory(category);
    setError('');
    setSuccess('');
    fetchAllArticles({ search: searchTerm, category, sortBy, sortOrder }, true);
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
    setError('');
    setSuccess('');
    fetchAllArticles({ search: searchTerm, category: selectedCategory, sortBy: newSortBy, sortOrder: newSortOrder }, true);
  };

  const handleLoadMore = () => {
    fetchAllArticles({ search: searchTerm, category: selectedCategory, sortBy, sortOrder }, false);
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

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <div className="flex items-center space-x-4">
              <div>
                <StarIconSolid className="h-8 w-8 text-black" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-black">Manage Featured Articles</h1>
                <p className="text-gray-600">Select up to 5 published articles from all categories to feature on the homepage</p>
              </div>
            </div>
            
            {/* Search and Filter Controls */}
            <div className="featured-articles-header-controls">
              <div className="featured-articles-search-container">
                <MagnifyingGlassIcon className="featured-articles-search-icon" />
                <input
                  type="text"
                  placeholder="Search articles, categories..."
                  className="featured-articles-search-input"
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
              </div>
              
              <button
                className={`featured-articles-filter-btn ${showFilterModal ? 'active' : ''}`}
                onClick={() => setShowFilterModal(!showFilterModal)}
              >
                <FunnelIcon className="featured-articles-filter-icon" />
              </button>
            </div>
          </div>
          
          <div className="dashboard-header-right">
            <div className="featured-articles-page-footer-right">
              <div className="featured-articles-buttons-row">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="featured-articles-btn featured-articles-btn-cancel"
                >
                  Back to Dashboard
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || featuredArticles.length === 0}
                  className="featured-articles-btn featured-articles-btn-save"
                >
                  {saving ? 'Saving...' : 'Save Featured Articles'}
                </button>
              </div>
              
              <div className="featured-articles-count-display">
                <StarIcon className="w-5 h-5" />
                <span>{featuredArticles.length} of 5 articles selected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="featured-articles-page-content">
          {/* Error Display */}
          {error && (
            <div className="featured-articles-error-banner">
              <XMarkIcon className="w-5 h-5" />
              <span>{error}</span>
              <button 
                onClick={() => setError('')}
                className="featured-articles-message-close"
                title="Dismiss error"
              >
                <XMarkIcon className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Articles List */}
          {loading ? (
            <div className="featured-articles-loading">
              <div className="featured-articles-spinner"></div>
              <p>Loading published articles...</p>
            </div>
          ) : (
            <div className="featured-articles-list">
              {allArticles.map((article) => {
                const isFeatured = featuredArticles.some(fa => fa.id === article.id);
                return (
                  <div 
                    key={article.id} 
                    className={`featured-article-item ${isFeatured ? 'featured' : ''}`}
                    onClick={() => toggleFeatured(article.id)}
                  >
                    <div className="featured-article-checkbox">
                      {isFeatured && <CheckIcon className="w-5 h-5" />}
                    </div>
                    
                    <div className="featured-article-thumbnail">
                      <MediaDisplay
                        mediaUrl={article.featuredImage}
                        alt={article.title}
                        className="featured-article-image"
                        imageClassName="featured-article-img"
                        videoClassName="featured-article-img"
                        iconClassName="w-4 h-4"
                        showVideoIcon={true}
                      />
                    </div>
                    
                    <div className="featured-article-content">
                      <h3 className="featured-article-title">{article.title}</h3>
                              <p className="featured-article-content-preview">
                                {article.content ? 
                                  article.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : 
                                  'No content available'
                                }
                              </p>
                      <div className="featured-article-meta">
                        <span className="featured-article-date">
                          {formatDate(article.displayDate)}
                        </span>
                        <span className="featured-article-views">
                          {article.viewCount} views
                        </span>
                        {article.categories.length > 0 && (
                          <span className="featured-article-category">
                            {article.categories[0].name}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Load More Button */}
              {hasMore && !loading && (
                <div className="featured-articles-load-more-container">
                  <button 
                    className="featured-articles-load-more-button"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load More Articles'}
                  </button>
                </div>
              )}
              
              {/* Loading More Indicator */}
              {loadingMore && (
                <div className="featured-articles-loading-more">
                  <div className="featured-articles-spinner"></div>
                  <p>Loading more articles...</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Featured Articles"
        onApply={() => setShowFilterModal(false)}
        onClear={() => {
          setSelectedCategory('all');
          setSortBy('publicationDate');
          setSortOrder('desc');
          fetchAllArticles({ search: searchTerm, category: 'all', sortBy: 'publicationDate', sortOrder: 'desc' }, true);
        }}
      >
        {/* Category Filter */}
        <div className="filter-modal-section">
          <h3 className="filter-modal-section-title">Category</h3>
          <div className="filter-modal-radio-group">
            <label className={`filter-modal-radio-item ${selectedCategory === 'all' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="category"
                value="all"
                checked={selectedCategory === 'all'}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">All Categories</span>
            </label>
            {categories.map((category) => (
              <label key={category.id} className={`filter-modal-radio-item ${selectedCategory === category.slug ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="category"
                  value={category.slug}
                  checked={selectedCategory === category.slug}
                  onChange={(e) => handleFilterChange(e.target.value)}
                  className="filter-modal-radio-input"
                />
                <span className="filter-modal-radio-label">{category.name}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Sort Options */}
        <div className="filter-modal-section">
          <h3 className="filter-modal-section-title">Sort By</h3>
          <div className="filter-modal-radio-group">
            <label className={`filter-modal-radio-item ${sortBy === 'publicationDate' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortBy"
                value="publicationDate"
                checked={sortBy === 'publicationDate'}
                onChange={(e) => handleSortChange(e.target.value, sortOrder)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Publication Date</span>
            </label>
            <label className={`filter-modal-radio-item ${sortBy === 'title' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortBy"
                value="title"
                checked={sortBy === 'title'}
                onChange={(e) => handleSortChange(e.target.value, sortOrder)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Title</span>
            </label>
            <label className={`filter-modal-radio-item ${sortBy === 'viewCount' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortBy"
                value="viewCount"
                checked={sortBy === 'viewCount'}
                onChange={(e) => handleSortChange(e.target.value, sortOrder)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">View Count</span>
            </label>
          </div>
        </div>

        {/* Sort Order */}
        <div className="filter-modal-section">
          <h3 className="filter-modal-section-title">Sort Order</h3>
          <div className="filter-modal-radio-group">
            <label className={`filter-modal-radio-item ${sortOrder === 'desc' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="sortOrder"
                value="desc"
                checked={sortOrder === 'desc'}
                onChange={(e) => handleSortChange(sortBy, e.target.value)}
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
                onChange={(e) => handleSortChange(sortBy, e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Ascending</span>
            </label>
          </div>
        </div>
      </FilterModal>

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false);
          navigate('/dashboard');
        }}
        title="Success"
        message={success}
        buttonText="OK"
      />
    </div>
  );
};

export default FeaturedArticlesPage;
