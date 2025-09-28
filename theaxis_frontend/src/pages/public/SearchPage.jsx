import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { articlesAPI } from '../../services/apiService';
import theaxisWordmark from '../../assets/theaxis_wordmark.png';
import PublicFooter from '../../components/PublicFooter';
import './search-page.css';
import './article-detail.css';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState([]);
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Fetch suggested topics (most common tags)
  useEffect(() => {
    const fetchSuggestedTopics = async () => {
      try {
        const response = await articlesAPI.getSuggestedTopics();
        setSuggestedTopics(response.data?.topics || []);
      } catch (error) {
        console.error('Error fetching suggested topics:', error);
      }
    };

    fetchSuggestedTopics();
  }, []);

  // Perform search when component mounts with query parameter
  useEffect(() => {
    const query = searchParams.get('q');
    if (query) {
      setSearchQuery(query);
      performSearch(query);
    }
  }, [searchParams]);

  const performSearch = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const response = await articlesAPI.searchArticles(query);
      setSearchResults(response.data?.items || []);
    } catch (error) {
      console.error('Error searching articles:', error);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (query) {
      setSearchParams({ q: query });
    }
  };

  const handleSuggestedTopicClick = (topic) => {
    setSearchQuery(topic);
    setSearchParams({ q: topic });
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content, maxLength = 150) => {
    if (!content) return '';
    const stripped = content.replace(/<[^>]*>/g, ''); // Remove HTML tags
    return stripped.length > maxLength ? stripped.substring(0, maxLength) + '...' : stripped;
  };

  return (
    <div className="search-page">
      {/* Custom Header */}
      <div className="article-detail-custom-header">
        <div className="article-detail-header-container">
          {/* Menu Button */}
          <button 
            className="article-detail-menu-button" 
            onClick={toggleMobileMenu}
            title="Menu"
          >
            <Bars3Icon className="article-detail-menu-icon" />
          </button>
          
          {/* Logo/Center */}
          <div className="article-detail-logo">
            <Link to="/" className="article-detail-logo-link">
              <img 
                src={theaxisWordmark} 
                alt="The AXIS" 
                className="article-detail-logo-image"
              />
            </Link>
          </div>
          
          {/* Search Button */}
          <button 
            className="article-detail-search-button" 
            title="Search"
            onClick={() => navigate('/search')}
          >
            <MagnifyingGlassIcon className="article-detail-search-icon" />
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        <div 
          className={`article-detail-mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={closeMobileMenu}
        ></div>

        {/* Mobile Menu Sidebar */}
        <div className={`article-detail-mobile-menu ${isMobileMenuOpen ? 'open' : ''}`}>
          {/* AXIS Wordmark */}
          <div className="article-detail-mobile-wordmark">
            <Link to="/" onClick={closeMobileMenu}>
              <img 
                src={theaxisWordmark} 
                alt="The AXIS" 
                className="article-detail-mobile-wordmark-image"
              />
            </Link>
          </div>


          {/* Mobile Navigation */}
          <nav className="article-detail-mobile-nav">
            <Link to="/news" className="article-detail-mobile-link" onClick={closeMobileMenu}>
              News
            </Link>
            <div className="article-detail-mobile-separator"></div>
            
            <Link to="/opinion" className="article-detail-mobile-link" onClick={closeMobileMenu}>
              Opinion
            </Link>
            <div className="article-detail-mobile-separator"></div>
            
            <Link to="/editorial" className="article-detail-mobile-link" onClick={closeMobileMenu}>
              Editorial
            </Link>
            <div className="article-detail-mobile-separator"></div>
            
            <Link to="/feature" className="article-detail-mobile-link" onClick={closeMobileMenu}>
              Feature
            </Link>
            <div className="article-detail-mobile-separator"></div>
            
            <Link to="/literary" className="article-detail-mobile-link" onClick={closeMobileMenu}>
              Literary
            </Link>
            <div className="article-detail-mobile-separator"></div>
            
            <Link to="/devcomm" className="article-detail-mobile-link" onClick={closeMobileMenu}>
              DevComm
            </Link>
            <div className="article-detail-mobile-separator"></div>
            
            <Link to="/sports" className="article-detail-mobile-link" onClick={closeMobileMenu}>
              Sports
            </Link>
            <div className="article-detail-mobile-separator"></div>
            
            <Link to="/art" className="article-detail-mobile-link" onClick={closeMobileMenu}>
              Art
            </Link>
            <div className="article-detail-mobile-separator"></div>
            
            <Link to="/the-axis-online" className="article-detail-mobile-link" onClick={closeMobileMenu}>
              The AXIS Online
            </Link>
            <div className="article-detail-mobile-separator"></div>
            
            <Link to="/annual-editions" className="article-detail-mobile-link" onClick={closeMobileMenu}>
              Annual Editions
            </Link>
          </nav>
        </div>
      </div>

      <div className="search-page-container">
        {/* Search Header */}
        <div className="search-page-header">
          <h1 className="search-page-title">Search Articles</h1>
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="search-page-form">
            <div className="search-page-input-container">
              <MagnifyingGlassIcon className="search-page-search-icon" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search articles, authors, categories..."
                className="search-page-input"
              />
              <button type="submit" className="search-page-submit-btn">
                Search
              </button>
            </div>
          </form>

          {/* Suggested Topics */}
          {suggestedTopics.length > 0 && (
            <div className="search-page-suggested-topics">
              <h3 className="search-page-suggested-title">Suggested Topics</h3>
              <div className="search-page-topics-list">
                {suggestedTopics.map((topic, index) => (
                  <React.Fragment key={topic}>
                    <button
                      onClick={() => handleSuggestedTopicClick(topic)}
                      className="search-page-topic-btn"
                    >
                      {topic}
                    </button>
                    {index < suggestedTopics.length - 1 && (
                      <span className="search-page-topic-separator">|</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Search Results */}
        <div className="search-page-results">
          {loading && (
            <div className="search-page-loading">
              <div className="search-page-spinner"></div>
              <p>Searching articles...</p>
            </div>
          )}

          {!loading && hasSearched && (
            <>
              <div className="search-page-results-header">
                <h2 className="search-page-results-title">
                  Search Results for "{searchParams.get('q') || ''}"
                </h2>
                <p className="search-page-results-count">
                  {searchResults.length} article{searchResults.length !== 1 ? 's' : ''} found
                </p>
              </div>

              {searchResults.length === 0 ? (
                <div className="search-page-no-results">
                  <p>No articles found matching your search.</p>
                  <p>Try different keywords or browse our suggested topics above.</p>
                </div>
              ) : (
                <div className="search-page-articles-list">
                  {searchResults.map((article) => (
                    <Link
                      key={article.id}
                      to={`/content/${article.slug}`}
                      className="search-page-article-item"
                    >
                      <div className="search-page-article-image">
                        {article.featuredImage ? (
                          <img
                            src={article.featuredImage}
                            alt={article.title}
                            onError={(e) => {
                              e.target.src = '/placeholder-article.svg';
                            }}
                          />
                        ) : (
                          <img src="/placeholder-article.svg" alt="No image" />
                        )}
                      </div>
                      
                      <div className="search-page-article-content">
                        <div className="search-page-article-category">
                          {article.categories && article.categories.length > 0 
                            ? article.categories[0].name 
                            : 'Uncategorized'}
                        </div>
                        
                        <h3 className="search-page-article-title">
                          {article.title}
                        </h3>
                        
                        <p className="search-page-article-excerpt">
                          {truncateContent(article.excerpt || article.content)}
                        </p>
                        
                        <div className="search-page-article-meta">
                          <div className="search-page-article-author">
                            By {article.author?.firstName} {article.author?.lastName}
                            {article.articleAuthors && article.articleAuthors.length > 0 && (
                              <span>
                                {article.articleAuthors
                                  .filter(coAuthor => coAuthor.user.id !== article.author?.id)
                                  .map((coAuthor, index) => (
                                    <span key={coAuthor.user.id}>
                                      , {coAuthor.user.firstName} {coAuthor.user.lastName}
                                    </span>
                                  ))}
                              </span>
                            )}
                          </div>
                          <div className="search-page-article-date">
                            {formatDate(article.publicationDate || article.createdAt)}
                          </div>
                        </div>
                        
                        {article.tags && article.tags.length > 0 && (
                          <div className="search-page-article-tags">
                            {article.tags.map((tag, index) => (
                              <span key={tag.id} className="search-page-article-tag">
                                {tag.name}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}

          {!hasSearched && !loading && (
            <div className="search-page-welcome">
              <h2>Welcome to The Axis Search</h2>
              <p>Search through our collection of articles, features, and stories.</p>
            </div>
          )}
        </div>
      </div>

      <PublicFooter />
    </div>
  );
};

export default SearchPage;
