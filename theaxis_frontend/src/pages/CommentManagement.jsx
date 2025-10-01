import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import commentService from '../services/commentService';
import FilterModal from '../components/FilterModal';
import ConfirmationModal from '../components/ConfirmationModal';
import NotificationModal from '../components/NotificationModal';
import { 
  ChatBubbleLeftRightIcon, 
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrashIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { 
  ChatBubbleLeftRightIcon as ChatBubbleLeftRightIconSolid,
} from '@heroicons/react/24/solid';
import '../styles/comment-management.css';

const CommentManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedComments, setExpandedComments] = useState(new Set());
  const [actionLoading, setActionLoading] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    rejected: 0
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    type: 'success'
  });
  const isInitialLoadRef = useRef(true);

  const statusOptions = [
    { value: 'all', label: 'All Comments' },
    { value: 'approved', label: 'Active Comments' },
    { value: 'pending', label: 'Auto-Flagged Comments' },
    { value: 'rejected', label: 'Removed Comments' }
  ];

  const sortOptions = [
    { value: 'createdAt', label: 'Date Created' },
    { value: 'updatedAt', label: 'Last Updated' },
    { value: 'author', label: 'Author' },
    { value: 'article', label: 'Article' }
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Categories' },
    { value: 'news', label: 'News' },
    { value: 'sports', label: 'Sports' },
    { value: 'features', label: 'Features' },
    { value: 'opinion', label: 'Opinion' },
    { value: 'literary', label: 'Literary' },
    { value: 'art', label: 'Art' }
  ];

  const showNotificationMessage = (title, message, type = 'success') => {
    setNotificationData({ title, message, type });
    setShowNotification(true);
  };

  const closeNotification = () => {
    setShowNotification(false);
  };

  const fetchStats = async () => {
    try {
      // Fetch stats for all comments (without filters)
      const statsData = await commentService.getAllComments({
        page: 1,
        limit: 1, // We only need the total count
        status: 'all'
      });
      
      const totalComments = statsData.data?.pagination?.total || 0;
      
      // Fetch counts for each status
      const [approvedData, rejectedData] = await Promise.all([
        commentService.getAllComments({ page: 1, limit: 1, status: 'approved' }),
        commentService.getAllComments({ page: 1, limit: 1, status: 'rejected' })
      ]);
      
      setStats({
        total: totalComments,
        approved: approvedData.data?.pagination?.total || 0,
        pending: 0, // No longer used
        rejected: rejectedData.data?.pagination?.total || 0
      });
    } catch (error) {
      console.error('❌ Error fetching stats:', error);
    }
  };

  const fetchComments = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      setError(null);
      
      console.log('🔍 Fetching comments with params:', {
        page: currentPage,
        limit: 1000, // Increased limit to get all comments
        status: selectedStatus,
        sortBy,
        sortOrder,
        searchTerm,
        category: selectedCategory
      });
      
      const params = {
        page: currentPage,
        limit: 1000, // Increased limit to get all comments
        status: selectedStatus,
        sortBy,
        sortOrder,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && selectedCategory !== 'all' && { category: selectedCategory })
      };

      const data = await commentService.getAllComments(params);
      console.log('📊 Comments API response:', data);
      console.log('📊 Comments API response.data:', data.data);
      console.log('📊 Comments API response.data.comments:', data.data?.comments);
      console.log('📊 Comments API response.data.comments length:', data.data?.comments?.length);
      
      setComments(data.data?.comments || []);
      setTotalPages(data.data?.pagination?.totalPages || 1);
    } catch (error) {
      console.error('❌ Error fetching comments:', error);
      setError(error.response?.data?.message || error.message || 'Failed to fetch comments');
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log('🚀 CommentManagement mounted, user:', user);
    console.log('🔐 User authenticated:', isAuthenticated);
    console.log('👤 User role:', user?.role);
    fetchStats();
    fetchComments(isInitialLoadRef.current); // Show loading only on initial load
    isInitialLoadRef.current = false; // Mark as no longer initial load
  }, [currentPage, selectedStatus, sortBy, sortOrder, selectedCategory]);

  // Separate effect for search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm !== undefined) {
        fetchComments(false); // Don't show loading for search
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    console.log('🔄 CommentManagement useEffect triggered with dependencies:', {
      currentPage,
      selectedStatus,
      sortBy,
      sortOrder,
      searchTerm,
      selectedCategory
    });
  }, [currentPage, selectedStatus, sortBy, sortOrder, searchTerm, selectedCategory]);

  const handleCommentAction = async (commentId, action) => {
    try {
      console.log(`🚀 CommentManagement: Starting ${action} action for comment:`, commentId);
      setActionLoading(commentId);
      setError(null);
      
      if (action === 'approve') {
        console.log('📝 CommentManagement: Calling approveComment API');
        await commentService.approveComment(commentId);
        console.log('✅ CommentManagement: Comment approved successfully');
        showNotificationMessage(
          'Comment Restored',
          'The comment has been successfully restored and is now visible to the public.',
          'success'
        );
      } else if (action === 'reject') {
        console.log('📝 CommentManagement: Calling rejectComment API');
        await commentService.rejectComment(commentId, 'Removed by staff');
        console.log('✅ CommentManagement: Comment rejected successfully');
        showNotificationMessage(
          'Comment Removed',
          'The comment has been successfully removed and is no longer visible to the public.',
          'success'
        );
      }

      // Refresh comments and stats after action
      console.log('🔄 CommentManagement: Refreshing comments and stats');
      console.log('🔍 Current comments before refresh:', comments.length);
      
      // Simple refresh - just call the functions
      fetchComments();
      fetchStats();
      
      console.log('✅ CommentManagement: Refresh completed');
    } catch (error) {
      console.error(`❌ CommentManagement: Error ${action}ing comment:`, error);
      const errorMessage = error.response?.data?.message || error.message || `Failed to ${action} comment`;
      setError(errorMessage);
      showNotificationMessage(
        'Action Failed',
        errorMessage,
        'error'
      );
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteComment = async (commentId) => {
    console.log('🚀 CommentManagement: Requesting delete confirmation for comment:', commentId);
    console.log('🔍 Setting showDeleteModal to true');
    setCommentToDelete(commentId);
    setShowDeleteModal(true);
    console.log('✅ Modal state set, showDeleteModal should be true');
  };

  const confirmDeleteComment = async () => {
    if (!commentToDelete) return;

    try {
      console.log('🚀 CommentManagement: Starting delete action for comment:', commentToDelete);
      setActionLoading(commentToDelete);
      setError(null);
      
      console.log('📝 CommentManagement: Calling deleteComment API');
      await commentService.deleteComment(commentToDelete);
      console.log('✅ CommentManagement: Comment deleted successfully');

      // Refresh comments and stats after deletion
      console.log('🔄 CommentManagement: Refreshing comments and stats');
      
      // Simple refresh - just call the functions
      fetchComments();
      fetchStats();
      
      console.log('✅ CommentManagement: Refresh completed');
      
      showNotificationMessage(
        'Comment Deleted',
        'The comment has been permanently deleted from the database.',
        'success'
      );
    } catch (error) {
      console.error('❌ CommentManagement: Error deleting comment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete comment';
      setError(errorMessage);
      showNotificationMessage(
        'Delete Failed',
        errorMessage,
        'error'
      );
    } finally {
      setActionLoading(null);
      setShowDeleteModal(false);
      setCommentToDelete(null);
    }
  };

  const cancelDeleteComment = () => {
    setShowDeleteModal(false);
    setCommentToDelete(null);
  };

  const toggleCommentExpansion = (commentId) => {
    const newExpanded = new Set(expandedComments);
    if (newExpanded.has(commentId)) {
      newExpanded.delete(commentId);
    } else {
      newExpanded.add(commentId);
    }
    setExpandedComments(newExpanded);
  };

  const getStatusBadge = (comment) => {
    if (comment.isApproved) {
      return <span className="comment-status-badge approved">Approved</span>;
    } else if (comment.isModerated) {
      return <span className="comment-status-badge rejected">Rejected</span>;
    } else {
      return <span className="comment-status-badge pending">Pending</span>;
    }
  };

  const getStatusIcon = (comment) => {
    if (comment.isApproved) {
      return <CheckCircleIcon className="w-4 h-4" />;
    } else if (comment.isModerated) {
      return <XCircleIcon className="w-4 h-4" />;
    } else {
      return <ClockIcon className="w-4 h-4" />;
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

  const truncateText = (text, maxLength = 150) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading && comments.length === 0) {
    return (
      <div className="comment-management-container">
        <div className="comment-management-loading">
          <div className="uniform-spinner"></div>
          <p>Loading comments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="comment-management-container">
      <div className="comment-management-content">
        {/* Header */}
        <div className="comment-management-header">
          <div className="flex items-center space-x-4">
            <div>
              <ChatBubbleLeftRightIconSolid className="h-8 w-8 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-black">Comment Management</h1>
              <p className="text-gray-600">Monitor and manage comments posted on articles</p>
            </div>
          </div>
        
        <div className="comment-management-stats">
          <div className="comment-management-stat">
            <span className="comment-management-stat-number">{stats.total}</span>
            <span className="comment-management-stat-label">Total Comments</span>
          </div>
          <div className="comment-management-stat-separator"></div>
          <div className="comment-management-stat">
            <span className="comment-management-stat-number">{stats.approved}</span>
            <span className="comment-management-stat-label">Active</span>
          </div>
          <div className="comment-management-stat-separator"></div>
          <div className="comment-management-stat">
            <span className="comment-management-stat-number">{stats.rejected}</span>
            <span className="comment-management-stat-label">Removed</span>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="comment-management-control-bar">
        <div className="comment-management-controls-left">
          <div className="comment-management-search-container">
            <MagnifyingGlassIcon className="comment-management-search-icon" />
            <input
              type="text"
              placeholder="Search comments, authors, or articles..."
              className="comment-management-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button
            className={`comment-management-filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FunnelIcon className="comment-management-filter-icon" />
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        title="Filter Comments"
        onApply={() => setShowFilters(false)}
        onClear={() => {
          setSelectedStatus('all');
          setSortBy('createdAt');
          setSortOrder('desc');
          setSearchTerm('');
          setSelectedCategory('all');
        }}
      >
        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Category</h4>
          <div className="filter-modal-radio-group">
            {categoryOptions.map(option => (
              <label key={option.value} className={`filter-modal-radio-item ${selectedCategory === option.value ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="category"
                  value={option.value}
                  checked={selectedCategory === option.value}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="filter-modal-radio-input"
                />
                <span className="filter-modal-radio-label">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Status</h4>
          <div className="filter-modal-radio-group">
            {statusOptions.map(option => (
              <label key={option.value} className={`filter-modal-radio-item ${selectedStatus === option.value ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="status"
                  value={option.value}
                  checked={selectedStatus === option.value}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="filter-modal-radio-input"
                />
                <span className="filter-modal-radio-label">{option.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="filter-modal-section">
          <h4 className="filter-modal-section-title">Sort By</h4>
          <div className="filter-modal-radio-group">
            {sortOptions.map(option => (
              <label key={option.value} className={`filter-modal-radio-item ${sortBy === option.value ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="sortBy"
                  value={option.value}
                  checked={sortBy === option.value}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-modal-radio-input"
                />
                <span className="filter-modal-radio-label">{option.label}</span>
              </label>
            ))}
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

      {/* Comments List */}
      <div className="comment-management-content">
        {error && (
          <div className="comment-error">
            <p>Error: {error}</p>
            <button onClick={fetchComments} className="comment-retry-btn">
              Retry
            </button>
          </div>
        )}

        {comments.length === 0 ? (
          <div className="comment-empty">
            <ChatBubbleLeftRightIcon className="w-12 h-12" />
            <p>No comments found</p>
            <small>Try adjusting your filters or search terms</small>
          </div>
        ) : (
          <div className="comment-list">
            {comments.map((comment) => (
              <div key={comment.id} className="comment-item">
                <div className="comment-header">
                  <div className="comment-meta">
                    <div className="comment-author">
                      <UserIcon className="w-4 h-4" />
                      <span className="comment-author-name">
                        {comment.guestName || (comment.author ? `${comment.author.firstName} ${comment.author.lastName}`.trim() : 'Anonymous') || (comment.author?.username || 'Anonymous')}
                      </span>
                      {comment.author && (
                        <span className="comment-author-username">@{comment.author.username}</span>
                      )}
                      <span className="comment-author-email">
                        {comment.guestEmail || comment.author?.email || 'No email provided'}
                      </span>
                    </div>
                    <div className="comment-article">
                      <DocumentTextIcon className="w-4 h-4" />
                      <span className="comment-article-title">{comment.article.title}</span>
                    </div>
                    <div className="comment-date">
                      <CalendarIcon className="w-4 h-4" />
                      <span>{formatDate(comment.createdAt)}</span>
                    </div>
                  </div>
                  <div className="comment-status">
                    {getStatusIcon(comment)}
                    {getStatusBadge(comment)}
                  </div>
                </div>

                <div className="comment-content">
                  <p>{expandedComments.has(comment.id) ? comment.content : truncateText(comment.content)}</p>
                  {comment.content.length > 150 && (
                    <button
                      onClick={() => toggleCommentExpansion(comment.id)}
                      className="comment-expand-btn"
                    >
                      {expandedComments.has(comment.id) ? (
                        <>
                          <ChevronUpIcon className="w-4 h-4" />
                          Show Less
                        </>
                      ) : (
                        <>
                          <ChevronDownIcon className="w-4 h-4" />
                          Show More
                        </>
                      )}
                    </button>
                  )}
                  
                  {/* Show moderation reason if flagged */}
                  {comment.moderationReason && (
                    <div className="comment-moderation-warning">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span>Auto-flagged: {comment.moderationReason}</span>
                    </div>
                  )}
                </div>

                {comment.parentComment && (
                  <div className="comment-parent">
                    <div className="comment-parent-header">
                      <span>Reply to:</span>
                      <span className="comment-parent-author">
                        {comment.parentComment.guestName || 
                         (comment.parentComment.author ? `${comment.parentComment.author.firstName} ${comment.parentComment.author.lastName}`.trim() : 'Anonymous') || 
                         (comment.parentComment.author?.username || 'Anonymous')}
                      </span>
                    </div>
                    <p className="comment-parent-content">{truncateText(comment.parentComment.content, 100)}</p>
                  </div>
                )}

                {comment.replies.length > 0 && (
                  <div className="comment-replies">
                    <div className="comment-replies-header">
                      <span>{comment.replyCount} {comment.replyCount === 1 ? 'Reply' : 'Replies'}</span>
                    </div>
                    {expandedComments.has(comment.id) && (
                      <div className="comment-replies-list">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="comment-reply">
                            <div className="comment-reply-author">
                              <UserIcon className="w-3 h-3" />
                              <span>
                                {reply.guestName || (reply.author ? `${reply.author.firstName} ${reply.author.lastName}`.trim() : 'Anonymous') || (reply.author?.username || 'Anonymous')}
                              </span>
                              <span className="comment-reply-email">
                                {reply.guestEmail || reply.author?.email || 'No email'}
                              </span>
                              <span className="comment-reply-date">{formatDate(reply.createdAt)}</span>
                            </div>
                            <p>{reply.content}</p>
                            {!reply.isApproved && (
                              <span className="comment-reply-status pending">Pending</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className="comment-actions">
                  {comment.isApproved && !comment.isModerated && (
                    <button
                      onClick={() => handleCommentAction(comment.id, 'reject')}
                      disabled={actionLoading === comment.id}
                      className="comment-action-btn reject"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      Remove Comment
                    </button>
                  )}
                  
                  {(!comment.isApproved && !comment.isModerated) && (
                    <button
                      onClick={() => handleCommentAction(comment.id, 'approve')}
                      disabled={actionLoading === comment.id}
                      className="comment-action-btn approve"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Approve Comment
                    </button>
                  )}
                  
                  {comment.isModerated && (
                    <button
                      onClick={() => handleCommentAction(comment.id, 'approve')}
                      disabled={actionLoading === comment.id}
                      className="comment-action-btn approve"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      Restore Comment
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    disabled={actionLoading === comment.id}
                    className="comment-action-btn delete"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Permanently
                  </button>

                  {actionLoading === comment.id && (
                    <div className="comment-action-loading">
                      <div className="uniform-spinner-small"></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteComment}
        onConfirm={confirmDeleteComment}
        title="Delete Comment"
        message="Are you sure you want to delete this comment? This action cannot be undone and will permanently remove the comment from the database."
        confirmText="Delete Permanently"
        cancelText="Cancel"
        type="danger"
        isLoading={actionLoading === commentToDelete}
      />

      {/* Success/Error Notification Modal */}
      <NotificationModal
        isOpen={showNotification}
        onClose={closeNotification}
        title={notificationData.title}
        message={notificationData.message}
        type={notificationData.type}
        duration={4000}
      />
    </div>
  );
};

export default CommentManagement;
