import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { articlesAPI } from '../services/apiService';
import MediaDisplay from '../components/MediaDisplay';
import CreateAnnouncementModal from '../components/CreateAnnouncementModal';
import { 
  PlusIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ClockIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChartBarSquareIcon,
  NewspaperIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';
import '../styles/dashboard.css';
import '../styles/media-display.css';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [selectedTimeRange, setSelectedTimeRange] = useState('last7days');
  const [recentArticles, setRecentArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalContent: 0,
    totalViews: 0,
    pendingReviews: 0,
    thisWeek: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Debug user role
  useEffect(() => {
    console.log('Dashboard - Current user:', user);
    console.log('Dashboard - User role:', user?.role);
    console.log('Dashboard - Has SECTION_HEAD role:', hasRole(['SECTION_HEAD']));
  }, [user, hasRole]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setArticlesLoading(true);
        setStatsLoading(true);

        // Calculate date range based on selectedTimeRange
        const getDateRange = () => {
          const now = new Date();
          switch (selectedTimeRange) {
            case 'last7days':
              return {
                start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                end: now.toISOString()
              };
            case 'last30days':
              return {
                start: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(),
                end: now.toISOString()
              };
            case 'last3months':
              return {
                start: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString(),
                end: now.toISOString()
              };
            case 'lastyear':
              return {
                start: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                end: now.toISOString()
              };
            default:
              return null; // All time
          }
        };

        const dateRange = getDateRange();

        // Fetch recent articles with publication date filtering
        const articlesResponse = await articlesAPI.getRecentArticles({
          authorId: user?.id, // Get user's own articles
          sortBy: 'publicationDate', // Sort by publication date instead of creation date
          sortOrder: 'desc',
          ...(dateRange && {
            publicationDateStart: dateRange.start,
            publicationDateEnd: dateRange.end
          })
        });
        
        // Transform articles for display
        const transformedArticles = articlesResponse.data?.items?.map(article => {
          // Handle image URL - prepend base URL if it's a relative path
          let imageUrl = article.featuredImage;
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
            imageUrl = `http://localhost:3001${imageUrl}`;
          }
          
          return {
            id: article.id,
            title: article.title,
            status: article.status.toLowerCase(),
            createdAt: article.createdAt,
            publishedAt: article.publishedAt,
            publicationDate: article.publicationDate,
            views: article.viewCount || 0,
            thumbnail: imageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop",
            category: article.categories?.[0]?.name || "Uncategorized"
          };
        }) || [];

        setRecentArticles(transformedArticles);

        // Fetch dashboard statistics with publication date filtering
        const statsResponse = await articlesAPI.getArticleStats({
          authorId: user?.id,
          ...(dateRange && {
            publicationDateStart: dateRange.start,
            publicationDateEnd: dateRange.end
          })
        });

        const stats = statsResponse.data;
        setDashboardStats({
          totalContent: stats.totalContent || 0,
          totalViews: stats.totalViews || 0,
          pendingReviews: stats.inReview || 0,
          thisWeek: stats.published || 0 // Using published as "this week" for now
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        // Set fallback data
        setRecentArticles([]);
        setDashboardStats({
          totalContent: 0,
          totalViews: 0,
          pendingReviews: 0,
          thisWeek: 0
        });
      } finally {
        setArticlesLoading(false);
        setStatsLoading(false);
      }
    };

    if (user?.id) {
      fetchDashboardData();
    }
  }, [user?.id, selectedTimeRange]);

  const formatDateTime = (date) => {
    return date.toLocaleString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const formatArticleDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'published': return '#10b981';
      case 'draft': return '#f59e0b';
      case 'review': return '#3b82f6';
      default: return '#6b7280';
    }
  };

  const timeRangeOptions = [
    { value: 'last7days', label: 'Last 7 days' },
    { value: 'last30days', label: 'Last 30 days' },
    { value: 'last3months', label: 'Last 3 months' },
    { value: 'lastyear', label: 'Last year' },
    { value: 'alltime', label: 'All time' }
  ];

  const handleQuickAction = (action) => {
    switch (action) {
      case 'new-content':
        navigate('/content/create');
        break;
      case 'review-pending':
        navigate('/content/pending');
        break;
      case 'create-announcement':
        setShowAnnouncementModal(true);
        break;
      case 'view-analytics':
        navigate('/analytics');
        break;
      default:
        break;
    }
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-content">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="dashboard-header-left">
            <div className="dashboard-header-info">
              <div className="dashboard-time-range">
                <select 
                  value={selectedTimeRange} 
                  onChange={(e) => setSelectedTimeRange(e.target.value)}
                  className="dashboard-time-range-select"
                >
                  {timeRangeOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="dashboard-dropdown-icon" />
            </div>
        
              <div className="dashboard-current-time">
                <ClockIcon className="dashboard-time-icon" />
                <span className="dashboard-time-text">{formatDateTime(currentDateTime)}</span>
            </div>
            </div>
          </div>

          <div className="dashboard-header-controls">
            <div className="dashboard-quick-actions">
              {!hasRole(['EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN']) && (
                <button 
                  className="dashboard-quick-action-btn"
                  onClick={() => handleQuickAction('new-content')}
                >
                  <PlusIcon className="dashboard-action-icon" />
                  <span>New Content</span>
                </button>
              )}
              
              {hasRole(['EDITOR_IN_CHIEF']) && (
                <button 
                  className="dashboard-quick-action-btn"
                  onClick={() => handleQuickAction('create-announcement')}
                >
                  <SpeakerWaveIcon className="dashboard-action-icon" />
                  <span>Create Announcement</span>
          </button>
              )}
              
              {hasRole(['SECTION_HEAD', 'EDITOR_IN_CHIEF', 'ADVISER', 'SYSTEM_ADMIN']) && (
                <button 
                  className="dashboard-quick-action-btn"
                  onClick={() => handleQuickAction('review-pending')}
                >
                  <DocumentTextIcon className="dashboard-action-icon" />
                  <span>Review Pending</span>
          </button>
              )}
              
              <button 
                className="dashboard-quick-action-btn"
                onClick={() => handleQuickAction('view-analytics')}
              >
                <ChartBarIcon className="dashboard-action-icon" />
                <span>View Analytics</span>
          </button>
            </div>
            </div>
          </div>

        {/* Dashboard Content Area */}
        <div className="dashboard-main-content">
          {/* Key Metrics Section */}
          <div className="dashboard-key-metrics">
            <div className="dashboard-key-metrics-header">
              <ChartBarSquareIcon className="dashboard-key-metrics-icon" />
              <h2 className="dashboard-key-metrics-title">Key Metrics</h2>
            </div>
            
            <div className="dashboard-personal-stats">
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon">
                  <DocumentTextIcon className="dashboard-stat-icon-svg" />
                </div>
                <div className="dashboard-stat-content">
                  <div className="dashboard-stat-number">
                    {statsLoading ? '...' : dashboardStats.totalContent}
                  </div>
                  <div className="dashboard-stat-label">Articles Written</div>
                </div>
      </div>
      
              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon">
                  <ChartBarIcon className="dashboard-stat-icon-svg" />
                </div>
                <div className="dashboard-stat-content">
                  <div className="dashboard-stat-number">
                    {statsLoading ? '...' : dashboardStats.totalViews.toLocaleString()}
                  </div>
                  <div className="dashboard-stat-label">Total Views</div>
                </div>
        </div>

              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon">
                  <ClockIcon className="dashboard-stat-icon-svg" />
                </div>
                <div className="dashboard-stat-content">
                  <div className="dashboard-stat-number">
                    {statsLoading ? '...' : dashboardStats.pendingReviews}
                  </div>
                  <div className="dashboard-stat-label">Pending Reviews</div>
                </div>
        </div>

              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon">
                  <CalendarIcon className="dashboard-stat-icon-svg" />
                </div>
                <div className="dashboard-stat-content">
                  <div className="dashboard-stat-number">
                    {statsLoading ? '...' : dashboardStats.thisWeek}
                  </div>
                  <div className="dashboard-stat-label">This Week</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Articles Section */}
          <div className="dashboard-recent-articles">
            <div className="dashboard-recent-articles-header">
              <NewspaperIcon className="dashboard-recent-articles-icon" />
              <h2 className="dashboard-recent-articles-title">Recent Articles</h2>
      </div>

            <div className="dashboard-recent-articles-list">
              {articlesLoading ? (
                <div className="dashboard-loading">
                  <div className="dashboard-loading-spinner"></div>
                  <p>Loading articles...</p>
                </div>
              ) : recentArticles.length > 0 ? (
                recentArticles.map((article) => (
                  <div key={article.id} className="dashboard-article-item">
                    <div className="dashboard-article-thumbnail">
                      <MediaDisplay
                        mediaUrl={article.thumbnail}
                        alt={article.title}
                        className="dashboard-article-thumbnail"
                        imageClassName="dashboard-article-image"
                        videoClassName="dashboard-article-image"
                        iconClassName="w-4 h-4"
                        showVideoIcon={true}
                      />
                    </div>
                    <div className="dashboard-article-content">
                      <div className="dashboard-article-header">
                        <h3 className="dashboard-article-title">{article.title}</h3>
                        <span 
                          className="dashboard-article-status"
                          style={{ color: getStatusColor(article.status) }}
                        >
                          {article.status.charAt(0).toUpperCase() + article.status.slice(1)}
                        </span>
        </div>
                      <div className="dashboard-article-meta">
                        <span className="dashboard-article-category">{article.category}</span>
                        <span className="dashboard-article-date">
                          {formatArticleDate(article.publishedAt || article.publicationDate || article.createdAt)}
                        </span>
                        {article.views > 0 && (
                          <span className="dashboard-article-views">
                            {article.views} views
                          </span>
                        )}
        </div>
      </div>
    </div>
                ))
              ) : (
                <div className="dashboard-empty-state">
                  <p>No articles found. Create your first article!</p>
                </div>
              )}
            </div>
          </div>
          </div>
      </div>

      {/* Create Announcement Modal */}
      <CreateAnnouncementModal
        isOpen={showAnnouncementModal}
        onClose={() => setShowAnnouncementModal(false)}
        onSuccess={(announcement) => {
          console.log('Announcement created:', announcement);
          // You can add a success notification here
        }}
      />
    </div>
  );
};

export default Dashboard;