import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bars3Icon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import theaxisWordmark from '../assets/theaxis_wordmark.png';
import '../styles/public-page-header.css';
import siteSettingsService from '../services/siteSettingsService';

const PublicPageHeader = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [wordmarkUrl, setWordmarkUrl] = useState(theaxisWordmark);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Load site assets on component mount
  useEffect(() => {
    const loadAssets = async () => {
      try {
        const { assets } = await siteSettingsService.initialize();
        console.log('PublicPageHeader - Loaded assets:', assets);
        if (assets && assets.length > 0) {
          const wordmarkAsset = assets.find(asset => asset.assetType === 'wordmark' && asset.isActive);
          console.log('PublicPageHeader - Found wordmark asset:', wordmarkAsset);
          
          if (wordmarkAsset) {
            const newWordmarkUrl = `http://localhost:3001/uploads/${wordmarkAsset.fileName}`;
            console.log('PublicPageHeader - Setting wordmark URL:', newWordmarkUrl);
            setWordmarkUrl(newWordmarkUrl);
          }
        }
      } catch (error) {
        console.error('Failed to load site assets:', error);
      }
    };

    loadAssets();
  }, []);

  return (
    <header className="public-page-header">
      <div className="public-page-header-container">
        {/* Menu Button */}
        <button 
          className={`public-page-menu-button ${isMobileMenuOpen ? 'menu-open' : ''}`}
          title="Sections"
          onClick={toggleMobileMenu}
          aria-label="Toggle sections menu"
        >
          {isMobileMenuOpen ? (
            <XMarkIcon className="public-page-menu-icon" />
          ) : (
            <Bars3Icon className="public-page-menu-icon" />
          )}
          <span className="public-page-menu-text">SECTIONS</span>
        </button>
        
        {/* Logo/Center */}
        <div className="public-page-logo">
          <Link to="/" className="public-page-logo-link" onClick={handleLinkClick}>
            <img 
              src={wordmarkUrl} 
              alt="The AXIS" 
              className="public-page-logo-image"
            />
          </Link>
        </div>
        
        {/* Search Button */}
        <button 
          className="public-page-search-button" 
          title="Search"
          onClick={() => navigate('/search')}
        >
          <MagnifyingGlassIcon className="public-page-search-icon" />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`public-page-mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
        onClick={closeMobileMenu}
      ></div>

      {/* Mobile Menu Sidebar */}
      <div className={`public-page-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>

        {/* Navigation Categories */}
        <nav className="public-page-mobile-nav">
          <Link to="/news" className="public-page-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
            News
          </Link>
          <div className="public-page-mobile-separator"></div>
          
          <Link to="/opinion" className="public-page-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
            Opinion
          </Link>
          <div className="public-page-mobile-separator"></div>
          
          <Link to="/editorial" className="public-page-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
            Editorial
          </Link>
          <div className="public-page-mobile-separator"></div>
          
          <Link to="/feature" className="public-page-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
            Feature
          </Link>
          <div className="public-page-mobile-separator"></div>
          
          <Link to="/literary" className="public-page-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
            Literary
          </Link>
          <div className="public-page-mobile-separator"></div>
          
          <Link to="/devcom" className="public-page-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
            DevCom
          </Link>
          <div className="public-page-mobile-separator"></div>
          
          <Link to="/sports" className="public-page-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
            Sports
          </Link>
          <div className="public-page-mobile-separator"></div>
          
          <Link to="/gallery" className="public-page-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
            Gallery
          </Link>
          <div className="public-page-mobile-separator"></div>
          
          <Link to="/the-axis-online" className="public-page-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
            The AXIS Online
          </Link>
          <div className="public-page-mobile-separator"></div>
          
          <Link to="/annual-editions" className="public-page-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
            Annual Editions
          </Link>
          <div className="public-page-mobile-separator"></div>
          
          <Link to="/offline" className="public-page-mobile-link" onClick={() => { closeMobileMenu(); handleLinkClick(); }}>
            Offline Articles
          </Link>
        </nav>
      </div>
    </header>
  );
};

export default PublicPageHeader;
