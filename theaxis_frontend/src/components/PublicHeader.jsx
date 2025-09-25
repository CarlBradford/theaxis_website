import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import theaxisLogo from '../assets/theaxis_wordmark.png';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import '../styles/public-header.css';

const PublicHeader = () => {
  const { isAuthenticated } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Logo Section - Separate from header, hides on scroll */}
      <div className={`public-header-logo-section ${isScrolled ? 'hidden' : ''}`}>
        <div className="public-header-container">
          <div className="public-header-logo">
            <Link to="/" className="public-header-logo-link">
              <img 
                src={theaxisLogo} 
                alt="The AXIS Logo" 
                className="public-header-logo-image"
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Header Section - Always visible, contains category tabs */}
      <header className="public-header">
        <div className="public-header-categories-section">
          <div className="public-header-container">
            {/* Mobile Menu Button */}
            <button 
              className="public-header-mobile-menu-button"
              onClick={toggleMobileMenu}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>

            {/* Mobile Logo */}
            <div className="public-header-mobile-logo">
              <img 
                src={theaxisLogo} 
                alt="The AXIS" 
                className="public-header-mobile-logo-image"
              />
            </div>

            {/* Mobile Search Button */}
            <button className="public-header-mobile-search-button">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>

            {/* Desktop Navigation */}
            <nav className="public-header-categories">
              <Link to="/news" className="public-header-category-link" onClick={closeMobileMenu}>
                News
              </Link>
              <Link to="/opinion" className="public-header-category-link" onClick={closeMobileMenu}>
                Opinion
              </Link>
              <Link to="/editorial" className="public-header-category-link" onClick={closeMobileMenu}>
                Editorial
              </Link>
              <Link to="/feature" className="public-header-category-link" onClick={closeMobileMenu}>
                Feature
              </Link>
              <Link to="/literary" className="public-header-category-link" onClick={closeMobileMenu}>
                Literary
              </Link>
              <Link to="/devcomm" className="public-header-category-link" onClick={closeMobileMenu}>
                DevComm
              </Link>
              <Link to="/sports" className="public-header-category-link" onClick={closeMobileMenu}>
                Sports
              </Link>
              <Link to="/art" className="public-header-category-link" onClick={closeMobileMenu}>
                Art
              </Link>
              <Link to="/the-axis-online" className="public-header-category-link" onClick={closeMobileMenu}>
                The AXIS Online
              </Link>
              <Link to="/annual-editions" className="public-header-category-link" onClick={closeMobileMenu}>
                Annual Editions
              </Link>
              <div className="public-header-search">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </nav>
          </div>

          {/* Mobile Menu Overlay */}
          <div 
            className={`public-header-mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={closeMobileMenu}
          ></div>

          {/* Mobile Menu Sidebar */}
          <div className={`public-header-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
            {/* AXIS Wordmark */}
            <div className="public-header-mobile-wordmark">
              <img 
                src={theaxisLogo} 
                alt="The AXIS" 
                className="public-header-mobile-wordmark-image"
              />
            </div>

            {/* Search Card */}
            <div className="public-header-mobile-search-card">
              <div className="public-header-mobile-search-input-container">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input 
                  type="text" 
                  placeholder="Search articles..." 
                  className="public-header-mobile-search-input"
                />
              </div>
            </div>

            {/* Navigation Categories */}
            <nav className="public-header-mobile-nav">
              <Link to="/news" className="public-header-mobile-link" onClick={closeMobileMenu}>
                News
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/opinion" className="public-header-mobile-link" onClick={closeMobileMenu}>
                Opinion
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/editorial" className="public-header-mobile-link" onClick={closeMobileMenu}>
                Editorial
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/feature" className="public-header-mobile-link" onClick={closeMobileMenu}>
                Feature
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/literary" className="public-header-mobile-link" onClick={closeMobileMenu}>
                Literary
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/devcomm" className="public-header-mobile-link" onClick={closeMobileMenu}>
                DevComm
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/sports" className="public-header-mobile-link" onClick={closeMobileMenu}>
                Sports
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/art" className="public-header-mobile-link" onClick={closeMobileMenu}>
                Art
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/the-axis-online" className="public-header-mobile-link" onClick={closeMobileMenu}>
                The AXIS Online
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/annual-editions" className="public-header-mobile-link" onClick={closeMobileMenu}>
                Annual Editions
              </Link>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
};

export default PublicHeader;
