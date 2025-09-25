import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../services/apiService';
import '../styles/login.css';
import theaxisLogo from '../assets/theaxis_wordmark.png';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [token, setToken] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    } else {
      setError('Invalid reset link. Please request a new password reset.');
    }
  }, [searchParams]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    setLoading(true);

    try {
      await authAPI.resetPassword(token, formData.password);
      
      setIsSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/admin-portal');
      }, 3000);
      
    } catch (error) {
      console.error('Reset password error:', error);
      
      // Handle different types of errors
      if (error.response?.data?.message) {
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

  const handleLogoClick = () => {
    navigate('/');
  };

  if (isSuccess) {
    return (
      <div className={`login-container ${isSuccess ? 'login-container-success' : ''}`}>
        {/* AXIS Logo in top-left */}
        <div className="login-logo" onClick={handleLogoClick} style={{ cursor: 'pointer' }}>
          <img 
            src={theaxisLogo} 
            alt="The AXIS Group of Publications" 
            className="login-logo-image"
          />
        </div>

        {/* Success message */}
        <div className={`login-card ${isSuccess ? 'login-card-success' : ''}`}>
          <div className="login-header">
            <h2 className="login-title">Password Reset</h2>
          </div>

          <div className="login-form">
            <p style={{ 
              textAlign: 'center', 
              color: '#374151', 
              marginBottom: '1.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.5'
            }}>
              Your password has been successfully reset. You can now log in with your new password.
            </p>
            
            <button 
              onClick={() => navigate('/admin-portal')}
              className="login-button"
            >
              Go to Login
            </button>
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

      {/* Main reset password card */}
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <h2 className="login-title">Reset Password</h2>
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
            <label htmlFor="password" className="login-label">
              New Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              className="login-input"
              placeholder="Enter new password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className="login-form-group">
            <label htmlFor="confirmPassword" className="login-label">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              required
              className="login-input"
              placeholder="Confirm new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || !token}
            className="login-button"
          >
            {loading ? (
              <div className="login-button-loading">
                <div className="login-spinner"></div>
                Resetting Password...
              </div>
            ) : (
              'Reset Password'
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

export default ResetPassword;
