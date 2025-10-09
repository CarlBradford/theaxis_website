import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/public-footer.css';
import theaxisWordmark from '../assets/theaxis_wordmark.png';
import siteSettingsService from '../services/siteSettingsService';

const PublicFooter = () => {
  const [wordmarkUrl, setWordmarkUrl] = useState(theaxisWordmark);
  const [siteInfo, setSiteInfo] = useState({
    site_name: 'The AXIS',
    site_description: 'The AXIS, the Official Student Publication of the Batangas State University–The National Engineering University Alangilan Campus, is a student-funded, student-run, written and produced group of publications that attempts to bring comprehensive coverage of the news and events affecting the campus.',
    contact_email: 'theaxispub.alangilan@g.batstate-u.edu.ph',
    address: 'Alangilan, Batangas City, Philippines',
    year_copyright: '2025',
    facebook_link: 'https://www.facebook.com/TheAXISPublications',
    instagram_link: 'https://www.instagram.com/theaxispub/',
    x_link: 'https://x.com/theaxispub'
  });

  // Load site assets and info on component mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // First try to get from localStorage (faster)
        const storedSiteInfo = siteSettingsService.getCurrentSiteInfo();
        if (storedSiteInfo) {
          setSiteInfo(prev => ({ ...prev, ...storedSiteInfo }));
        }

        // Then try to get fresh data from API
        const { assets, siteInfo: loadedSiteInfo } = await siteSettingsService.initialize();
        console.log('PublicFooter - Loaded assets:', assets);
        console.log('PublicFooter - Loaded site info:', loadedSiteInfo);
        
        if (assets && assets.length > 0) {
          const wordmarkAsset = assets.find(asset => asset.assetType === 'wordmark' && asset.isActive);
          console.log('PublicFooter - Found wordmark asset:', wordmarkAsset);
          
          if (wordmarkAsset) {
            const newWordmarkUrl = `http://localhost:3001/uploads/${wordmarkAsset.fileName}`;
            console.log('PublicFooter - Setting wordmark URL:', newWordmarkUrl);
            setWordmarkUrl(newWordmarkUrl);
          }
        }

        if (loadedSiteInfo) {
          setSiteInfo(prev => ({ ...prev, ...loadedSiteInfo }));
        }
      } catch (error) {
        console.error('Failed to load site data:', error);
        // Fallback to localStorage if API fails
        const fallbackSiteInfo = siteSettingsService.getCurrentSiteInfo();
        if (fallbackSiteInfo) {
          setSiteInfo(prev => ({ ...prev, ...fallbackSiteInfo }));
        }
      }
    };

    loadData();
  }, []);

  return (
    <footer className="public-footer">
      <div className="public-footer-container">
        <div className="public-footer-content">
          {/* Logo and Description */}
          <div className="public-footer-brand">
            <div className="public-footer-logo">
              <Link to="/" className="public-footer-logo-link">
                <img 
                  src={wordmarkUrl} 
                  alt="The AXIS Wordmark" 
                  className="public-footer-wordmark"
                />
              </Link>
            </div>
            <p className="public-footer-description">
              {siteInfo.site_description}
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
                <Link to="/news" className="public-footer-link">
                  News
                </Link>
              </li>
              <li>
                <Link to="/opinion" className="public-footer-link">
                  Opinion
                </Link>
              </li>
              <li>
                <Link to="/editorial" className="public-footer-link">
                  Editorial
                </Link>
              </li>
              <li>
                <Link to="/feature" className="public-footer-link">
                  Feature
                </Link>
              </li>
              <li>
                <Link to="/literary" className="public-footer-link">
                  Literary
                </Link>
              </li>
              <li>
                <Link to="/sports" className="public-footer-link">
                  Sports
                </Link>
              </li>
              <li>
                <Link to="/gallery" className="public-footer-link">
                  Gallery
                </Link>
              </li>
              <li>
                <Link to="/the-axis-online" className="public-footer-link">
                  The AXIS Online
                </Link>
              </li>
              <li>
                <Link to="/annual-editions" className="public-footer-link">
                  Annual Editions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="public-footer-contact">
            <h3 className="public-footer-section-title">Contact</h3>
            <div className="public-footer-contact-info">
              <div className="public-footer-contact-item">
                <span>Email: {siteInfo.contact_email}</span>
              </div>
              <div className="public-footer-contact-item">
                <span>Address: {siteInfo.address}</span>
              </div>
            </div>
            
            {/* Social Media Links */}
            <div className="public-footer-social">
              <h4 className="public-footer-social-title">Follow Us</h4>
              <div className="public-footer-social-links">
                {siteInfo.facebook_link && (
                  <a 
                    href={siteInfo.facebook_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="public-footer-social-link"
                    aria-label="Facebook"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                )}
                {siteInfo.instagram_link && (
                  <a 
                    href={siteInfo.instagram_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="public-footer-social-link"
                    aria-label="Instagram"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.69 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                  </a>
                )}
                {siteInfo.x_link && (
                  <a 
                    href={siteInfo.x_link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="public-footer-social-link"
                    aria-label="X (Twitter)"
                  >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="public-footer-bottom">
          <p className="public-footer-copyright">
            © {siteInfo.year_copyright} {siteInfo.site_name}. All rights reserved.
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
