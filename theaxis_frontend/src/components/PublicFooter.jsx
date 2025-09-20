import { Link } from 'react-router-dom';
import '../styles/public-footer.css';
import theaxisWordmark from '../assets/theaxis_wordmark.png';
import theaxisLogo from '../assets/theaxis_logo.png';

const PublicFooter = () => {
  return (
    <footer className="public-footer">
      <div className="public-footer-container">
        <div className="public-footer-content">
          {/* Logo and Description */}
          <div className="public-footer-brand">
            <div className="public-footer-logo">
              <img 
                src={theaxisWordmark} 
                alt="The AXIS Wordmark" 
                className="public-footer-wordmark"
              />
            </div>
            <p className="public-footer-description">
              Your student publication platform for sharing stories, ideas, and perspectives. 
              Connect, create, and inspire through the power of words.
            </p>
          </div>

          {/* Quick Links */}
          <div className="public-footer-links">
            <h3 className="public-footer-section-title">Quick Links</h3>
            <ul className="public-footer-links-list">
              <li>
                <Link to="/" className="public-footer-link">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/content" className="public-footer-link">
                  Articles
                </Link>
              </li>
              <li>
                <Link to="/about" className="public-footer-link">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="public-footer-link">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="public-footer-contact">
            <h3 className="public-footer-section-title">Contact</h3>
            <div className="public-footer-contact-info">
              <div className="public-footer-contact-item">
                <span>Email: info@theaxis.com</span>
              </div>
              <div className="public-footer-contact-item">
                <span>Phone: (555) 123-4567</span>
              </div>
              <div className="public-footer-contact-item">
                <span>Address: University Campus</span>
              </div>
            </div>
          </div>

          {/* Login Logo */}
          <div className="public-footer-login">
            <div className="public-footer-login-logo">
              <Link to="/login" className="public-footer-login-link">
                <img 
                  src={theaxisLogo} 
                  alt="The AXIS Logo - Login" 
                  className="public-footer-login-img"
                />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="public-footer-bottom">
          <p className="public-footer-copyright">
            © 2024 The AXIS Group of Publications. All rights reserved.
          </p>
          <div className="public-footer-legal">
            <Link to="/privacy" className="public-footer-legal-link">
              Privacy Policy
            </Link>
            <Link to="/terms" className="public-footer-legal-link">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
