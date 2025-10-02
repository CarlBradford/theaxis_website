import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { TrashIcon, BookmarkIcon } from '@heroicons/react/24/outline';
import PublicPageHeader from '../../components/PublicPageHeader';
import usePageTitle from '../../hooks/usePageTitle';
import './offline-articles.css';

const OfflineArticles = () => {
  usePageTitle('Offline Articles');
  
  const navigate = useNavigate();
  const [offlineArticles, setOfflineArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOfflineArticles();
  }, []);

  const loadOfflineArticles = async () => {
    if (!('caches' in window)) {
      setLoading(false);
      return;
    }

    try {
      const cache = await caches.open('offline-articles');
      const requests = await cache.keys();
      const articles = [];

      for (const request of requests) {
        const response = await cache.match(request);
        if (response) {
          const articleData = await response.json();
          const slug = request.url.split('/content/')[1];
          articles.push({
            ...articleData,
            slug,
            savedDate: new Date().toISOString() // You could store this when saving
          });
        }
      }

      setOfflineArticles(articles);
    } catch (error) {
      console.error('Failed to load offline articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeOfflineArticle = async (slug) => {
    if (!('caches' in window)) return;

    try {
      const cache = await caches.open('offline-articles');
      await cache.delete(`/content/${slug}`);
      setOfflineArticles(prev => prev.filter(article => article.slug !== slug));
    } catch (error) {
      console.error('Failed to remove offline article:', error);
    }
  };

  const clearAllOfflineArticles = async () => {
    if (!('caches' in window)) return;

    try {
      await caches.delete('offline-articles');
      setOfflineArticles([]);
    } catch (error) {
      console.error('Failed to clear offline articles:', error);
    }
  };


  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };


  if (loading) {
    return (
      <div className="offline-articles-page">
        <PublicPageHeader />
        <main className="offline-articles-main">
          <div className="offline-articles-container">
            <div className="offline-articles-loading">
              <div className="offline-articles-spinner"></div>
              <p>Loading offline articles...</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="offline-articles-page">
      <PublicPageHeader />
      
      <main className="offline-articles-main">
        <div className="offline-articles-container">
          {/* Header */}
          <div className="offline-articles-page-header">
            <h1 className="offline-articles-title">Offline Articles</h1>
            <p className="offline-articles-subtitle">
              Articles saved for offline reading
            </p>
            {offlineArticles.length > 0 && (
              <button 
                className="offline-articles-clear-all"
                onClick={clearAllOfflineArticles}
                title="Clear all offline articles"
              >
                <TrashIcon className="w-4 h-4" />
                Clear All
              </button>
            )}
          </div>

          {/* Articles List */}
          {offlineArticles.length === 0 ? (
            <div className="offline-articles-empty">
              <BookmarkIcon className="offline-articles-empty-icon" />
              <h2>No offline articles</h2>
              <p>Articles you save for offline reading will appear here.</p>
              <Link to="/" className="offline-articles-browse-link">
                Browse Articles
              </Link>
            </div>
          ) : (
            <div className="offline-articles-list">
              {offlineArticles.map((article) => (
                <div key={article.slug} className="offline-articles-item">
                  <div className="offline-articles-item-content">
                    <h3 className="offline-articles-item-title">
                      <Link to={`/content/${article.slug}`}>
                        {article.title}
                      </Link>
                    </h3>
                    
                    {article.excerpt && (
                      <p className="offline-articles-item-excerpt">
                        {article.excerpt}
                      </p>
                    )}
                    
                    <div className="offline-articles-item-meta">
                      <span className="offline-articles-item-date">
                        Published {formatDate(article.publicationDate)}
                      </span>
                      {article.categories && article.categories.length > 0 && (
                        <>
                          <span className="offline-articles-meta-separator">•</span>
                          <span className="offline-articles-item-category">
                            {article.categories[0].name}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div className="offline-articles-item-actions">
                    <button 
                      className="offline-articles-remove-btn"
                      onClick={() => removeOfflineArticle(article.slug)}
                      title="Remove from offline"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default OfflineArticles;
