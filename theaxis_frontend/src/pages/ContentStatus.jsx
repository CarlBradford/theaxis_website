import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { articlesAPI } from '../services/apiService';
import ArticlePreviewModal from '../components/ArticlePreviewModal';
import SuccessModal from '../components/SuccessModal';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  PencilIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';
import FilterModal from '../components/FilterModal';
import '../styles/content-status.css';
import '../styles/filter-modal.css';

const ContentStatus = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [articles, setArticles] = useState([]);
  const [filteredArticles, setFilteredArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load articles from API
  const loadArticles = async (filters = {}, showLoading = false) => {
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
      if (filters.sortBy) {
        params.sortBy = filters.sortBy;
      }
      if (filters.sortOrder) {
        params.sortOrder = filters.sortOrder;
      }
      
      console.log('ContentStatus API params:', params);
      const response = await articlesAPI.getMyContent(params);
        
        console.log('Article status articles loaded:', response.data.items);
        
        // Transform the data to match expected structure
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
          updatedAt: article.updatedAt,
          publishedAt: article.publishedAt,
          excerpt: article.excerpt || createExcerpt(article.content) || article.title,
          content: article.content,
          wordCount: calculateWordCount(article.content),
          readTime: article.readingTime ? `${article.readingTime} min read` : calculateReadTime(article.content),
          categories: article.categories || [],
          tags: article.tags || [],
          featuredImage: article.featuredImage || null,
          reviewer: article.reviewer,
          reviewerId: article.reviewerId,
          sectionHead: article.sectionHead,
          sectionHeadId: article.sectionHeadId
        }));
        
        setArticles(transformedArticles);
        setFilteredArticles(transformedArticles);
      } catch (error) {
        console.error('Error loading articles:', error);
        setError(error);
        setArticles([]);
        setFilteredArticles([]);
      } finally {
      if (showLoading) {
        setLoading(false);
      }
      }
    };

  // Load articles on mount
  useEffect(() => {
    if (user?.id) {
      loadArticles({}, true); // Show loading on initial load
    }
  }, [user?.id]);

  // Apply filters and reload articles
  useEffect(() => {
    if (user?.id) {
      loadArticles({
        search: searchTerm,
        status: selectedStatus,
        sortBy: sortBy,
        sortOrder: sortOrder
      }, false); // Don't show loading on filter changes
    }
  }, [user?.id, searchTerm, selectedStatus, sortBy, sortOrder]);

  // No need for frontend filtering since we're using database filtering

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

  const getStatusColor = (status) => {
    const colors = {
      'draft': '#6b7280',           // Draft
      'in_review': '#3b82f6',       // In Review
      'needs_revision': '#ef4444',  // Needs Revision
      'approved': '#8b5cf6',        // Approved
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

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'published':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'in_review':
        return <ClockIcon className="w-4 h-4" />;
      case 'draft':
        return <DocumentTextIcon className="w-4 h-4" />;
      case 'needs_revision':
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
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getFilterCount = (status) => {
    if (status === 'all') return articles.length;
    return articles.filter(article => article.status === status).length;
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

  const handleFilterChange = (status) => {
    setSelectedStatus(status);
  };

  if (loading) {
    return (
      <div className="content-status-container">
        <div className="content-status-loading">
          <div className="content-status-spinner"></div>
          <p>Loading content status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="content-status-container">
      {/* Header */}
      <div className="content-status-header">
        <div className="content-status-title-section">
          <h1 className="content-status-title">Content Status</h1>
          <p className="content-status-subtitle">Track your content and its current status</p>
        </div>
        <div className="content-status-stats">
          {/* Role-based stats */}
          {user?.role === 'STAFF' ? (
            // Staff: Focus on their own content workflow
            <>
              <div className="content-status-stat">
                <span className="content-status-stat-number">{filteredArticles.length}</span>
                <span className="content-status-stat-label">My Content</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'draft').length}
                </span>
                <span className="content-status-stat-label">Drafts</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'in_review').length}
                </span>
                <span className="content-status-stat-label">Under Review</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'needs_revision').length}
                </span>
                <span className="content-status-stat-label">Needs Revision</span>
              </div>
            </>
          ) : user?.role === 'SECTION_HEAD' ? (
            // Section Head: Focus on review workflow
            <>
              <div className="content-status-stat">
                <span className="content-status-stat-number">{filteredArticles.length}</span>
                <span className="content-status-stat-label">Total Content</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'in_review').length}
                </span>
                <span className="content-status-stat-label">Pending Review</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'approved').length}
                </span>
                <span className="content-status-stat-label">Approved</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'needs_revision').length}
                </span>
                <span className="content-status-stat-label">Needs Revision</span>
              </div>
            </>
          ) : (user?.role === 'EDITOR_IN_CHIEF' || user?.role === 'ADVISER' || user?.role === 'SYSTEM_ADMIN') ? (
            // EIC and higher: Focus on publication and overall status
            <>
              <div className="content-status-stat">
                <span className="content-status-stat-number">{filteredArticles.length}</span>
                <span className="content-status-stat-label">Total Content</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'published').length}
                </span>
                <span className="content-status-stat-label">Published</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'approved').length}
                </span>
                <span className="content-status-stat-label">Ready to Publish</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'archived').length}
                </span>
                <span className="content-status-stat-label">Archived</span>
              </div>
            </>
          ) : (
            // Default fallback
            <>
              <div className="content-status-stat">
                <span className="content-status-stat-number">{filteredArticles.length}</span>
                <span className="content-status-stat-label">Total Content</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'published').length}
                </span>
                <span className="content-status-stat-label">Published</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'in_review').length}
                </span>
                <span className="content-status-stat-label">Under Review</span>
              </div>
              <div className="content-status-stat-separator"></div>
              <div className="content-status-stat">
                <span className="content-status-stat-number">
                  {filteredArticles.filter(a => a.status === 'needs_revision').length}
                </span>
                <span className="content-status-stat-label">Needs Revision</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="content-status-control-bar">
        <div className="content-status-controls-left">
          <div className="content-status-search-container">
            <MagnifyingGlassIcon className="content-status-search-icon" />
            <input
              type="text"
              placeholder="Search content, categories..."
              className="content-status-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            className={`content-status-filter-btn ${showFilterModal ? 'active' : ''}`}
            onClick={() => setShowFilterModal(!showFilterModal)}
          >
            <FunnelIcon className="content-status-filter-icon" />
          </button>
        </div>

        <div className="content-status-controls-right">
          <Link
            to="/content/create"
            className="content-status-create-btn"
          >
            <DocumentTextIcon className="w-4 h-4" />
            New Content
          </Link>
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        title="Filter Content Status"
        onApply={() => setShowFilterModal(false)}
        onClear={() => {
          setSelectedStatus('all');
          setSortBy('createdAt');
          setSortOrder('desc');
        }}
      >
        {/* Left Column */}
        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Status</h4>
          <div className="filter-modal-radio-group">
            <label className={`filter-modal-radio-item ${selectedStatus === 'all' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="status"
                value="all"
                checked={selectedStatus === 'all'}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">All Content ({getFilterCount('all')})</span>
            </label>
            <label className={`filter-modal-radio-item ${selectedStatus === 'published' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="status"
                value="published"
                checked={selectedStatus === 'published'}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Published ({getFilterCount('published')})</span>
            </label>
            <label className={`filter-modal-radio-item ${selectedStatus === 'draft' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="status"
                value="draft"
                checked={selectedStatus === 'draft'}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Drafts ({getFilterCount('draft')})</span>
            </label>
            <label className={`filter-modal-radio-item ${selectedStatus === 'in_review' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="status"
                value="in_review"
                checked={selectedStatus === 'in_review'}
                onChange={(e) => handleFilterChange(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Under Review ({getFilterCount('in_review')})</span>
            </label>
            <label className={`filter-modal-radio-item ${selectedStatus === 'needs_revision' ? 'selected' : ''}`}>
              <input
                type="radio"
                name="status"
                value="needs_revision"
                checked={selectedStatus === 'needs_revision'}
              onChange={(e) => handleFilterChange(e.target.value)}
                className="filter-modal-radio-input"
              />
              <span className="filter-modal-radio-label">Needs Revision ({getFilterCount('needs_revision')})</span>
            </label>
          </div>
      </div>

        {/* Right Column */}
        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Sort By</h4>
          <div className="filter-modal-radio-group">
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
      <div className="content-status-list">
        {filteredArticles.length === 0 ? (
          <div className="content-status-empty">
            <DocumentTextIcon className="content-status-empty-icon" />
            <h3 className="content-status-empty-title">No content found</h3>
            <p className="content-status-empty-description">
              {searchTerm || selectedStatus !== 'all'
                ? 'Try adjusting your search criteria or filters.'
                : 'You haven\'t created any content yet.'}
            </p>
          </div>
        ) : (
          <div className="content-status-table">
            <div className="content-status-table-header">
              <div className="content-status-table-cell">Image</div>
              <div className="content-status-table-cell">Content</div>
              <div className="content-status-table-cell">Status</div>
              <div className="content-status-table-cell">Created</div>
              <div className="content-status-table-cell">Updated</div>
              <div className="content-status-table-cell">Views</div>
              <div className="content-status-table-cell">Action</div>
            </div>

            {filteredArticles.map((article) => (
              <div key={article.id} className="content-status-table-row">
                <div className="content-status-table-cell image-cell">
                  {article.featuredImage ? (
                    <div className="content-status-article-image">
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
                              className="content-status-featured-image"
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
                        className="content-status-featured-image"
                        onError={(e) => {
                                console.error('Image failed to load:', mediaUrl);
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                          );
                        }
                      })()}
                      <div className="content-status-article-icon" style={{ display: 'none' }}>
                        <DocumentTextIcon className="w-6 h-6" />
                      </div>
                    </div>
                  ) : (
                    <div className="content-status-article-icon">
                      <DocumentTextIcon className="w-6 h-6" />
                    </div>
                  )}
                </div>
                
                 <div className="content-status-table-cell article-cell">
                   <div className="content-status-article-info">
                     <h4 className="content-status-article-title">{article.title}</h4>
                     <div className="content-status-article-meta">
                       {article.categories.length > 0 && (
                         <>
                           <div className="content-status-article-top-line">
                             <span className="content-status-article-category">
                               {article.categories[0].name}
                             </span>
                             <span className="content-status-article-separator">•</span>
                             <span className="content-status-article-word-count">
                               {article.wordCount} words
                             </span>
                             <span className="content-status-article-separator">•</span>
                             <span className="content-status-article-read-time">
                               {article.readTime}
                             </span>
                           </div>
                           <span className="content-status-article-author">
                             By {article.author.name}
                           </span>
                         </>
                       )}
                       {article.categories.length === 0 && (
                         <span className="content-status-article-author">
                           By {article.author.name}
                         </span>
                       )}
                     </div>
                     <div className="content-status-article-tags">
                       {article.tags.slice(0, 3).map((tag, index) => (
                         <span key={index} className="content-status-tag">{tag.name}</span>
                       ))}
                       {article.tags.length > 3 && (
                         <span className="content-status-tag-more">+{article.tags.length - 3} more</span>
                       )}
                     </div>
                   </div>
                 </div>

                <div className="content-status-table-cell status-cell">
                  <div className="content-status-status-container">
                    <span
                      className="content-status-status-badge"
                      style={{ backgroundColor: getStatusColor(article.status) }}
                    >
                      {getStatusIcon(article.status)}
                      {getStatusLabel(article.status)}
                    </span>
                    
                    {/* Show reviewer information for relevant statuses */}
                    {article.status === 'approved' && article.reviewer && (
                      <div className="content-status-reviewer">
                        <span className="content-status-reviewer-label">Approved by:</span>
                        <span className="content-status-reviewer-name">{article.reviewer}</span>
                      </div>
                    )}
                    
                    {article.status === 'needs_revision' && article.reviewer && (
                      <div className="content-status-reviewer">
                        <span className="content-status-reviewer-label">Revision requested by:</span>
                        <span className="content-status-reviewer-name">{article.reviewer}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="content-status-table-cell">
                  <div className="content-status-date">
                    {formatDate(article.createdAt)}
                  </div>
                </div>

                <div className="content-status-table-cell">
                  <div className="content-status-date">
                    {formatDate(article.updatedAt)}
                  </div>
                </div>

                <div className="content-status-table-cell">
                  <div className="content-status-views">
                    <ChartBarIcon className="w-4 h-4" />
                    {article.viewCount || 0}
                  </div>
                </div>

                <div className="content-status-table-cell">
                  <div className="content-status-actions">
                    <button
                      className="content-status-action-btn"
                      onClick={() => handlePreview(article)}
                      title="Preview Content"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
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

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        title="Success"
        message={successMessage}
        buttonText="OK"
      />
    </div>
  );
};

export default ContentStatus;
