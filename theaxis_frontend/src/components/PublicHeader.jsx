import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/public-header.css';

const PublicHeader = () => {
  const { isAuthenticated } = useAuth();

  return (
    <header className="public-header">
      <div className="public-header-container">
        <div className="public-header-content">
          {/* Logo */}
          <div className="public-header-logo">
            <Link to="/" className="public-header-logo-link">
              <div className="public-header-logo-icon">
                <span className="public-header-logo-icon-text">A</span>
              </div>
              <div className="public-header-logo-text">
                <span className="public-header-logo-title">The AXIS</span>
                <span className="public-header-logo-subtitle">GROUP OF PUBLICATIONS</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="public-header-nav">
            <Link 
              to="/" 
              className="public-header-nav-link"
            >
              Home
            </Link>
            <Link 
              to="/content" 
              className="public-header-nav-link"
            >
              Articles
            </Link>
            <Link 
              to="/about" 
              className="public-header-nav-link"
            >
              About
            </Link>
            <Link 
              to="/contact" 
              className="public-header-nav-link"
            >
              Contact
            </Link>
          </nav>

        </div>
      </div>
    </header>
  );
};

export default PublicHeader;
