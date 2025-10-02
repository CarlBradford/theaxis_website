import { useState } from 'react';
import usePageTitle from '../hooks/usePageTitle';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { trackLogin, trackError } from '../config/analytics';
import '../styles/login.css';
import theaxisLogo from '../assets/theaxis_wordmark.png';

const Login = () => {
  // Set page title
  usePageTitle('Login');

  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await login(formData.usernameOrEmail, formData.password);
      
      if (result.success) {
        setIsSuccess(true);
        // Track successful login
        trackLogin('email');
        // Add a small delay to show the success animation before navigating
        setTimeout(() => {
          navigate('/dashboard');
        }, 800);
      } else {
        // Handle different types of errors
        if (result.error.includes('Rate limit') || result.error.includes('Too many')) {
          setError('Too many login attempts. Please wait a moment and try again.');
        } else {
          setError(result.error);
        }
        // Track login error
        trackError(result.error, 'LOGIN_ERROR', 'login');
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      // Track login error
      trackError(error.message || 'Login failed', 'LOGIN_EXCEPTION', 'login');
      if (error.message?.includes('Rate limit')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

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

      {/* Main login card */}
      <div className={`login-card ${isSuccess ? 'login-card-success' : ''}`}>
        {/* Sign-in icon and title */}
        <div className="login-header">
          <h2 className="login-title">Login</h2>
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
            <label htmlFor="usernameOrEmail" className="login-label">
              Username or Email
            </label>
            <input
              id="usernameOrEmail"
              name="usernameOrEmail"
              type="text"
              autoComplete="username"
              required
              className="login-input"
              placeholder="Username or Email"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              disabled={isSuccess}
            />
          </div>
          
          <div className="login-form-group">
            <label htmlFor="password" className="login-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="login-input"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              disabled={isSuccess}
            />
            <div className="login-forgot-password">
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isSuccess}
            className="login-button"
          >
            {loading ? (
              <div className="login-button-loading">
                <div className="login-spinner"></div>
                Logging in...
              </div>
            ) : isSuccess ? (
              <div className="login-button-loading">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '1.25rem', height: '1.25rem'}}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Success!
              </div>
            ) : (
              'Login'
            )}
          </button>
        </form>
        
        <div className="login-footer">
          <button 
            onClick={() => navigate('/')}
            className="login-back-link"
            disabled={isSuccess}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Go back
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
