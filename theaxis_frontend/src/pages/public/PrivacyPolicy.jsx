import React, { useState, useEffect } from 'react';
import PublicHeader from '../../components/PublicHeader';
import PublicFooter from '../../components/PublicFooter';
import siteSettingsService from '../../services/siteSettingsService';
import './legal-pages.css';

const PrivacyPolicy = () => {
  const [content, setContent] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        // First try to get from localStorage (faster)
        const storedContent = siteSettingsService.getCurrentLegalContent();
        if (storedContent?.privacy_policy) {
          setContent(storedContent.privacy_policy);
          if (storedContent.lastUpdated) {
            setLastUpdated(new Date(storedContent.lastUpdated));
          }
        }

        // Then try to get fresh data from API
        const legalContent = await siteSettingsService.getLegalContent();
        if (legalContent?.privacy_policy) {
          setContent(legalContent.privacy_policy);
          if (legalContent.lastUpdated) {
            setLastUpdated(new Date(legalContent.lastUpdated));
          }
          siteSettingsService.applyLegalContent(legalContent);
        }
      } catch (error) {
        console.error('Failed to load privacy policy content:', error);
        // Fallback to localStorage if API fails
        const fallbackContent = siteSettingsService.getCurrentLegalContent();
        if (fallbackContent?.privacy_policy) {
          setContent(fallbackContent.privacy_policy);
        }
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const renderMarkdownContent = (text) => {
    if (!text) return '';
    
    return text
      .split('\n')
      .map((line, index) => {
        // Handle headers
        if (line.startsWith('## ')) {
          return <h2 key={index} className="legal-h2">{line.substring(3)}</h2>;
        }
        if (line.startsWith('### ')) {
          return <h3 key={index} className="legal-h3">{line.substring(4)}</h3>;
        }
        
        // Handle lists
        if (line.startsWith('- ')) {
          return <li key={index} className="legal-li">{line.substring(2)}</li>;
        }
        
        // Handle paragraphs
        if (line.trim() === '') {
          return <br key={index} />;
        }
        
        return <p key={index} className="legal-p">{line}</p>;
      });
  };

  if (loading) {
    return (
      <div className="legal-page">
        <PublicHeader />
        <main className="legal-main">
          <div className="legal-container">
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Loading privacy policy...</p>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="legal-page">
      <PublicHeader />
      
      <main className="legal-main">
        <div className="legal-container">
          <header className="legal-header">
            <h1 className="legal-title">Privacy Policy</h1>
            <div className="legal-date">
              Last updated: {lastUpdated ? lastUpdated.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : 'Loading...'}
            </div>
          </header>

          <div className="legal-content">
            {content ? (
              <div className="legal-markdown">
                {renderMarkdownContent(content)}
              </div>
            ) : (
              <div className="legal-fallback">
                <p>Privacy policy content is not available at the moment.</p>
                <p>Please contact us for more information.</p>
              </div>
            )}
          </div>
        </div>
      </main>
      
      <PublicFooter />
    </div>
  );
};

export default PrivacyPolicy;
