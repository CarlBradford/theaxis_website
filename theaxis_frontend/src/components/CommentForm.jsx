import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import commentService from '../services/commentService';
import { 
  PaperAirplaneIcon,
  UserIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import '../styles/comment-form.css';

const CommentForm = ({ articleId, onCommentAdded }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user ? `${user.firstName} ${user.lastName}`.trim() || user.username : '',
    email: user ? user.email : '',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.content.trim()) {
      newErrors.content = 'Comment content is required';
    } else if (formData.content.trim().length < 10) {
      newErrors.content = 'Comment must be at least 10 characters long';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setErrors({});
    
    try {
      const response = await commentService.createComment({
        articleId,
        content: formData.content,
        name: formData.name,
        email: formData.email
      });
      
      // Check if content was cleaned based on response message
      const responseMessage = response?.message || 'Comment posted successfully!';
      const successMessage = responseMessage.includes('cleaned') 
        ? 'Your comment has been posted (inappropriate content was automatically cleaned)!'
        : 'Your comment has been posted successfully! Thank you!';
      
      setSuccessMessage(successMessage);
      setFormData(prev => ({
        ...prev,
        content: ''
      }));
      
      // Notify parent component
      if (onCommentAdded) {
        onCommentAdded();
      }
      
    } catch (error) {
      console.error('Error submitting comment:', error);
      
      // Handle profanity filter errors
      if (error.response?.status === 400 && error.response?.data?.message?.includes('blocked')) {
        setErrors({
          submit: `Comment blocked: ${error.response.data.details?.reason || 'Inappropriate content detected'}`
        });
      } else {
        setErrors({
          submit: error.response?.data?.message || 'Failed to submit comment. Please try again.'
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="comment-form-container">
      <h3 className="comment-form-title">Leave a Comment</h3>
      
      {successMessage && (
        <div className="comment-form-success">
          {successMessage}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="comment-form">
        <div className="comment-form-row">
          <div className="comment-form-field">
            <label htmlFor="name" className="comment-form-label">
              <UserIcon className="w-4 h-4" />
              Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className={`comment-form-input ${errors.name ? 'error' : ''}`}
              placeholder="Your full name"
              disabled={!!user} // Disable if user is logged in
            />
            {errors.name && <span className="comment-form-error">{errors.name}</span>}
          </div>
          
          <div className="comment-form-field">
            <label htmlFor="email" className="comment-form-label">
              <EnvelopeIcon className="w-4 h-4" />
              Email *
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className={`comment-form-input ${errors.email ? 'error' : ''}`}
              placeholder="your.email@example.com"
              disabled={!!user} // Disable if user is logged in
            />
            {errors.email && <span className="comment-form-error">{errors.email}</span>}
          </div>
        </div>
        
        <div className="comment-form-field">
          <label htmlFor="content" className="comment-form-label">
            Comment *
          </label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleInputChange}
            className={`comment-form-textarea ${errors.content ? 'error' : ''}`}
            placeholder="Share your thoughts on this article..."
            rows={4}
          />
          {errors.content && <span className="comment-form-error">{errors.content}</span>}
        </div>
        
        {errors.submit && (
          <div className="comment-form-error-message">
            {errors.submit}
          </div>
        )}
        
        <div className="comment-form-actions">
          <button
            type="submit"
            disabled={isSubmitting}
            className="comment-form-submit-btn"
          >
            <PaperAirplaneIcon className="w-4 h-4" />
            {isSubmitting ? 'Submitting...' : 'Submit Comment'}
          </button>
        </div>
      </form>
      
      <p className="comment-form-note">
        * Comments are posted immediately. Inappropriate content is automatically filtered or blocked.
      </p>
    </div>
  );
};

export default CommentForm;
