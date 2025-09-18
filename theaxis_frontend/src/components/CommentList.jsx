import React, { useState, useEffect } from 'react';
import commentService from '../services/commentService';
import { 
  ChatBubbleLeftRightIcon,
  UserIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import '../styles/comment-list.css';

const CommentList = ({ articleId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedComments, setExpandedComments] = useState(new Set());

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await commentService.getArticleComments(articleId, false); // false = only approved comments
      setComments(data.data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError('Failed to load comments');
    } finally {
      setLoading(false);
    }
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

  if (loading) {
    return (
      <div className="comment-list-loading">
        <div className="uniform-spinner"></div>
        <p>Loading comments...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comment-list-error">
        <p>Error: {error}</p>
        <button onClick={fetchComments} className="comment-retry-btn">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="comment-list-container">
      <div className="comment-list-header">
        <h3 className="comment-list-title">
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          Comments ({comments.length})
        </h3>
      </div>

      {comments.length === 0 ? (
        <div className="comment-list-empty">
          <ChatBubbleLeftRightIcon className="w-12 h-12" />
          <p>No comments yet</p>
          <small>Be the first to share your thoughts!</small>
        </div>
      ) : (
        <div className="comment-list">
          {comments.map((comment) => (
            <div key={comment.id} className="comment-item">
              <div className="comment-header">
                <div className="comment-author">
                  <UserIcon className="w-4 h-4" />
                  <span className="comment-author-name">
                    {comment.guestName || `${comment.author.firstName} ${comment.author.lastName}`.trim() || comment.author.username}
                  </span>
                  <span className="comment-author-username">@{comment.author.username}</span>
                </div>
                <div className="comment-date">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(comment.createdAt)}</span>
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
              </div>

              {comment.parentComment && (
                <div className="comment-parent">
                  <div className="comment-parent-header">
                    <span>Reply to:</span>
                    <span className="comment-parent-author">{comment.parentComment.author.name}</span>
                  </div>
                  <p className="comment-parent-content">{truncateText(comment.parentComment.content, 100)}</p>
                </div>
              )}

              {comment.replies && comment.replies.length > 0 && (
                <div className="comment-replies">
                  <div className="comment-replies-header">
                    <span>{comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}</span>
                  </div>
                  {expandedComments.has(comment.id) && (
                    <div className="comment-replies-list">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="comment-reply">
                          <div className="comment-reply-author">
                            <UserIcon className="w-3 h-3" />
                            <span>{reply.guestName || reply.author.name}</span>
                            <span className="comment-reply-date">{formatDate(reply.createdAt)}</span>
                          </div>
                          <p>{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentList;
