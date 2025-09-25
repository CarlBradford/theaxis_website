import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/apiService';
import '../styles/login.css';
import theaxisLogo from '../assets/theaxis_wordmark.png';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [rateLimitCountdown, setRateLimitCountdown] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const navigate = useNavigate();

  // Rate limiting countdown timer
  useEffect(() => {
    let interval = null;
    if (rateLimitCountdown > 0) {
      interval = setInterval(() => {
        setRateLimitCountdown(countdown => countdown - 1);
      }, 1000);
    } else if (rateLimitCountdown === 0) {
      setIsRateLimited(false);
    }
    return () => clearInterval(interval);
  }, [rateLimitCountdown]);

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Please enter a valid email address';
    } else if (email.length > 254) {
      errors.email = 'Email address is too long';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setValidationErrors({});

    if (!validateForm()) {
      return;
    }

    if (isRateLimited) {
      setError(`Please wait ${rateLimitCountdown} seconds before requesting another reset link.`);
      return;
    }

    setLoading(true);

    try {
      const data = await authAPI.forgotPassword(email.trim().toLowerCase());
      
      setIsSuccess(true);
      // Start rate limiting countdown (5 minutes)
      setRateLimitCountdown(300);
      setIsRateLimited(true);
      // Redirect to login after 5 seconds
      setTimeout(() => {
        navigate('/admin-portal');
      }, 5000);
      
    } catch (error) {
      console.error('Forgot password error:', error);
      
      // Handle different types of errors
      if (error.response?.status === 429) {
        // Rate limited by server
        const retryAfter = error.response.headers['retry-after'] || 300;
        setRateLimitCountdown(parseInt(retryAfter));
        setIsRateLimited(true);
        setError(`Too many requests. Please wait ${retryAfter} seconds before trying again.`);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    
    // Clear validation error when user starts typing
    if (validationErrors.email) {
      setValidationErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  if (isSuccess) {
    return (
      <div className="login-container">
        {/* AXIS Logo in top-left */}
        <div className="login-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <img 
            src={theaxisLogo} 
            alt="The AXIS Group of Publications" 
            className="login-logo-image"
          />
        </div>

        {/* Success message */}
        <div className="login-card">
          <div className="login-header">
            <h2 className="login-title">Check Your Email</h2>
          </div>

          <div className="login-form">
            <div style={{ 
              textAlign: 'center', 
              color: '#374151', 
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.6',
              padding: '1rem',
              backgroundColor: 'rgba(16, 185, 129, 0.1)',
              borderRadius: '0.5rem',
              border: '1px solid rgba(16, 185, 129, 0.2)'
            }}>
              <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>
                Password reset link sent!
              </p>
              <p style={{ margin: '0', fontSize: '0.8rem' }}>
                If an account with <strong>{email}</strong> exists, we've sent you a password reset link. 
                Check your email and follow the instructions to reset your password.
              </p>
            </div>
            
            <button 
              onClick={() => navigate('/admin-portal')}
              className="login-button"
              style={{ marginBottom: '1rem' }}
            >
              Back to Login
            </button>

            <div style={{ 
              textAlign: 'center', 
              fontSize: '0.75rem', 
              color: '#6b7280',
              marginTop: '1rem'
            }}>
              Didn't receive the email? Check your spam folder or{' '}
              <button 
                onClick={() => {
                  setIsSuccess(false);
                  setEmail('');
                  setError('');
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#215d55', 
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  fontSize: '0.75rem'
                }}
              >
                try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      {/* AXIS Logo in top-left */}
      <div className="login-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
        <img 
          src={theaxisLogo} 
          alt="The AXIS Group of Publications" 
          className="login-logo-image"
        />
      </div>

      {/* Main forgot password card */}
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <h2 className="login-title">Forgot Password</h2>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error">
              <svg fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          
          <div className="login-form-group">
            <label htmlFor="email" className="login-label">
              Email Address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`login-input ${validationErrors.email ? 'login-input-error' : ''}`}
              placeholder="Enter your email address"
              value={email}
              onChange={handleEmailChange}
              disabled={loading || isRateLimited}
              maxLength={254}
            />
            {validationErrors.email && (
              <div style={{ 
                fontSize: '0.75rem', 
                color: '#dc2626', 
                marginTop: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem'
              }}>
                <svg width="12" height="12" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {validationErrors.email}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || isRateLimited || !email.trim()}
            className="login-button"
          >
            {loading ? (
              <div className="login-button-loading">
                <div className="login-spinner"></div>
                Sending Reset Link...
              </div>
            ) : isRateLimited ? (
              `Wait ${rateLimitCountdown}s`
            ) : (
              'Send Reset Link'
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <button 
            onClick={() => navigate('/admin-portal')}
            className="login-back-link"
            disabled={loading}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;