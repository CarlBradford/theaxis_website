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
import '../styles/content-status.css';

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
  const [showFilters, setShowFilters] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewArticle, setPreviewArticle] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Load articles from API
  useEffect(() => {
    const loadArticles = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await articlesAPI.getMyContent({ authorId: user?.id });
        
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
          readTime: calculateReadTime(article.content),
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
        setLoading(false);
      }
    };

    if (user?.id) {
      loadArticles();
    }
  }, [user?.id]);

  // Filter and sort articles
  useEffect(() => {
    let filtered = articles.filter(article => {
      const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           article.author.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (article.categories.length > 0 && article.categories.some(cat => 
                             cat.name.toLowerCase().includes(searchTerm.toLowerCase())
                           ));
      
      const matchesStatus = selectedStatus === 'all' || article.status === selectedStatus;
      
      return matchesSearch && matchesStatus;
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
          aValue = a.author.name.toLowerCase();
          bValue = b.author.name.toLowerCase();
          break;
        case 'createdAt':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'updatedAt':
          aValue = new Date(a.updatedAt);
          bValue = new Date(b.updatedAt);
          break;
        case 'publishedAt':
          aValue = new Date(a.publishedAt || 0);
          bValue = new Date(b.publishedAt || 0);
          break;
        case 'viewCount':
          aValue = a.viewCount || 0;
          bValue = b.viewCount || 0;
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
  }, [articles, searchTerm, selectedStatus, sortBy, sortOrder]);

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
    <div className={`content-status-container ${showFilters ? 'filters-open' : ''}`}>
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
            className={`content-status-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
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

      {/* Filters */}
      {showFilters && (
        <div className="content-status-filters">
          <div className="content-status-filter-group">
            <label className="content-status-filter-label">Status</label>
            <select
              className="content-status-filter-select"
              value={selectedStatus}
              onChange={(e) => handleFilterChange(e.target.value)}
            >
              <option value="all">All Content ({getFilterCount('all')})</option>
              <option value="published">Published ({getFilterCount('published')})</option>
              <option value="draft">Drafts ({getFilterCount('draft')})</option>
              <option value="in_review">Under Review ({getFilterCount('in_review')})</option>
              <option value="needs_revision">Needs Revision ({getFilterCount('needs_revision')})</option>
            </select>
      </div>

          <div className="content-status-filter-group">
            <label className="content-status-filter-label">Sort By</label>
            <select
              className="content-status-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="createdAt">Created Date</option>
              <option value="updatedAt">Last Updated</option>
              <option value="publishedAt">Published Date</option>
              <option value="title">Title</option>
              <option value="viewCount">View Count</option>
            </select>
          </div>

          <div className="content-status-filter-group">
            <label className="content-status-filter-label">Order</label>
            <select
              className="content-status-filter-select"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Newest First</option>
              <option value="asc">Oldest First</option>
            </select>
          </div>
        </div>
      )}

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
                      <img 
                        src={article.featuredImage} 
                        alt={article.title}
                        className="content-status-featured-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
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
