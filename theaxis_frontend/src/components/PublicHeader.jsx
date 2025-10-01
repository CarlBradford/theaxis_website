import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import theaxisLogo from '../assets/theaxis_wordmark.png';
import { Bars3Icon, XMarkIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import '../styles/public-header.css';
import siteSettingsService from '../services/siteSettingsService';

const PublicHeader = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [wordmarkUrl, setWordmarkUrl] = useState(theaxisLogo);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Load site assets on component mount
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const { assets } = await siteSettingsService.initialize();
        console.log('PublicHeader - Loaded assets:', assets);
        if (assets && assets.length > 0) {
          const wordmarkAsset = assets.find(asset => asset.assetType === 'wordmark' && asset.isActive);
          console.log('PublicHeader - Found wordmark asset:', wordmarkAsset);
          
          if (wordmarkAsset) {
            const newWordmarkUrl = `http://localhost:3001/uploads/${wordmarkAsset.fileName}`;
            console.log('PublicHeader - Setting wordmark URL:', newWordmarkUrl);
            setWordmarkUrl(newWordmarkUrl);
          }
        }
      } catch (error) {
        console.error('Failed to load site assets:', error);
      }
    };

    loadAssets();
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Logo Section - Separate from header, hides on scroll */}
      <div className={`public-header-logo-section ${isScrolled ? 'hidden' : ''}`}>
        <div className="public-header-container">
          <div className="public-header-logo">
            <Link to="/" className="public-header-logo-link" onClick={handleLinkClick}>
              <img 
                src={wordmarkUrl} 
                alt="The AXIS Wordmark" 
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
              <Link to="/" onClick={handleLinkClick}>
                <img 
                  src={wordmarkUrl} 
                  alt="The AXIS" 
                  className="public-header-mobile-logo-image"
                />
              </Link>
            </div>

            {/* Mobile Search Button */}
            <button 
              className="public-header-mobile-search-button" 
              title="Search"
              onClick={() => navigate('/search')}
            >
              <MagnifyingGlassIcon className="public-page-search-icon" />
            </button>

            {/* Desktop Navigation */}
            <nav className="public-header-categories">
              <Link to="/news" className="public-header-category-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                News
              </Link>
              <Link to="/opinion" className="public-header-category-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Opinion
              </Link>
              <Link to="/editorial" className="public-header-category-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Editorial
              </Link>
              <Link to="/feature" className="public-header-category-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Feature
              </Link>
              <Link to="/literary" className="public-header-category-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Literary
              </Link>
              <Link to="/devcomm" className="public-header-category-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                DevCom
              </Link>
              <Link to="/sports" className="public-header-category-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Sports
              </Link>
              <Link to="/gallery" className="public-header-category-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Gallery
              </Link>
              <Link to="/the-axis-online" className="public-header-category-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                The AXIS Online
              </Link>
              <Link to="/annual-editions" className="public-header-category-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Annual Editions
              </Link>
              <button 
                className="public-header-search" 
                title="Search"
                onClick={() => navigate('/search')}
              >
                <MagnifyingGlassIcon className="public-page-search-icon" />
              </button>
            </nav>
          </div>

          {/* Mobile Menu Overlay */}
          <div 
            className={`public-header-mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
            onClick={closeMobileMenu}
          ></div>

          {/* Mobile Menu Sidebar */}
          <div className={`public-header-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>


            {/* Navigation Categories */}
            <nav className="public-header-mobile-nav">
              <Link to="/news" className="public-header-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                News
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/opinion" className="public-header-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Opinion
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/editorial" className="public-header-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Editorial
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/feature" className="public-header-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Feature
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/literary" className="public-header-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Literary
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/devcomm" className="public-header-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                DevCom
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/sports" className="public-header-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Sports
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/gallery" className="public-header-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Gallery
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/the-axis-online" className="public-header-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                The AXIS Online
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/annual-editions" className="public-header-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Annual Editions
              </Link>
              <div className="public-header-mobile-separator"></div>
              
              <Link to="/offline" className="public-header-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
                Offline Articles
              </Link>
            </nav>
          </div>
        </div>
      </header>
    </>
  );
};

export default PublicHeader;
