import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { articlesAPI } from '../../services/apiService';
import MediaDisplay from '../../components/MediaDisplay';
import PublicFooter from '../../components/PublicFooter';
import PublicPageHeader from '../../components/PublicPageHeader';
import usePageTitle from '../../hooks/usePageTitle';
import './search-page.css';
import './article-detail.css';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Set page title
  usePageTitle('Search');

  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [searchResults, setSearchResults] = useState([]);
  const [additionalResults, setAdditionalResults] = useState([]);
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [totalResultsCount, setTotalResultsCount] = useState(0);

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
      setAdditionalResults([]);
      setHasSearched(false);
      setHasMore(true);
      setTotalResultsCount(0);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    setAdditionalResults([]);
    
    try {
      const response = await articlesAPI.searchArticles(query, { limit: 10, page: 1 });
      const results = response.data?.items || [];
      setSearchResults(results);
      
      // Check if there are more results
      const totalCount = response.data?.pagination?.totalCount || response.data?.pagination?.total || response.pagination?.total || 0;
      console.log('Search debug:', {
        resultsLength: results.length,
        totalCount: totalCount,
        hasMore: totalCount > results.length,
        response: response,
        pagination: response.data?.pagination,
        data: response.data
      });
      setTotalResultsCount(totalCount);
      setHasMore(totalCount > results.length);
    } catch (error) {
      console.error('Error searching articles:', error);
      setSearchResults([]);
      setHasMore(false);
      setTotalResultsCount(0);
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

  const loadMoreResults = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const currentUniqueResults = getUniqueResults();
      const currentPage = Math.floor(currentUniqueResults.length / 10) + 1;
      
      const response = await articlesAPI.searchArticles(searchQuery, { 
        limit: 10, 
        page: currentPage 
      });
      
      const newResults = response.data?.items || [];
      setAdditionalResults(prev => [...prev, ...newResults]);
      
      // Check if there are more results
      const totalCount = response.data?.pagination?.totalCount || response.data?.pagination?.total || response.pagination?.total || 0;
      const updatedUniqueResults = getUniqueResults();
      setHasMore(updatedUniqueResults.length < totalCount);
      
    } catch (error) {
      console.error('Error loading more results:', error);
    } finally {
      setLoadingMore(false);
    }
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

  // Helper function to get unique results
  const getUniqueResults = () => {
    const allResults = [...searchResults, ...additionalResults];
    return allResults.filter((article, index, self) => 
      index === self.findIndex(a => a.id === article.id)
    );
  };

  return (
    <div className="search-page">
      <PublicPageHeader />

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
                  {totalResultsCount} article{totalResultsCount !== 1 ? 's' : ''} found
                </p>
              </div>

              {getUniqueResults().length === 0 ? (
                <div className="search-page-no-results">
                  <p>No articles found matching your search.</p>
                  <p>Try different keywords or browse our suggested topics above.</p>
                </div>
              ) : (
                <div className="search-page-articles-list">
                  {getUniqueResults().map((article) => (
                    <Link
                      key={article.id}
                      to={`/content/${article.slug}`}
                      className="search-page-article-item"
                    >
                      <div className="search-page-article-image">
                        <MediaDisplay
                          mediaUrl={article.featuredImage}
                          alt={article.title}
                          className="search-page-article-img"
                          imageClassName="search-page-article-img-element"
                          videoClassName="search-page-article-img-element"
                          iconClassName="w-6 h-6"
                          showVideoIcon={true}
                        />
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
                  
                  {/* Load More Button */}
                  {console.log('Render debug:', { hasMore, loadingMore, uniqueResults: getUniqueResults().length })}
                  {hasMore && (
                    <div className="search-page-load-more-container">
                      <button 
                        className="search-page-load-more-button"
                        onClick={loadMoreResults}
                        disabled={loadingMore}
                      >
                        {loadingMore ? 'Loading...' : 'Load More'}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {!hasSearched && !loading && (
            <div className="search-page-welcome">
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
