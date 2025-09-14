import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/login.css';
import theaxisLogo from '../assets/theaxis_wordmark.png';

const Login = () => {
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
        setLoading(false);
      }
    } catch (error) {
      console.error('Login error:', error);
      if (error.message?.includes('Rate limit')) {
        setError('Too many requests. Please wait a moment and try again.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className={`login-container ${isSuccess ? 'login-container-success' : ''}`}>
      {/* AXIS Logo in top-left */}
      <div className="login-logo">
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
          <div className={`login-icon ${isSuccess ? 'login-success-animation' : ''}`}>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="login-title">Login</h2>
          <p className="login-subtitle">Welcome back! Please login to your account.</p>
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
              USERNAME OR EMAIL
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
              PASSWORD
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
            onClick={() => navigate(-1)}
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
