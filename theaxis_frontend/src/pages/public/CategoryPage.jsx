import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CalendarIcon, EyeIcon } from '@heroicons/react/24/outline';
import { articlesAPI, categoriesAPI } from '../../services/apiService';
import MediaDisplay from '../../components/MediaDisplay';
import PublicPageHeader from '../../components/PublicPageHeader';
import PublicFooter from '../../components/PublicFooter';
import './category-page.css';

// Helper function to create excerpt from content
const createExcerpt = (content, maxLength = 150) => {
  if (!content) return '';
  
  // Remove HTML tags and get plain text
  const plainText = content.replace(/<[^>]*>/g, '');
  
  if (plainText.length <= maxLength) {
    return plainText;
  }
  
  // Find the last complete word within the limit
  const truncated = plainText.substring(0, maxLength);
  const lastSpaceIndex = truncated.lastIndexOf(' ');
  
  if (lastSpaceIndex > maxLength * 0.8) {
    return truncated.substring(0, lastSpaceIndex) + '...';
  }
  
  return truncated + '...';
};

const CategoryPage = () => {
  const { categorySlug } = useParams();
  const [articles, setArticles] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [additionalArticles, setAdditionalArticles] = useState([]);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [popularArticles, setPopularArticles] = useState([]);

  useEffect(() => {
    if (categorySlug) {
      fetchCategoryAndArticles();
    }
  }, [categorySlug]);

  const fetchCategoryAndArticles = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch category details
      const categoryResponse = await categoriesAPI.getCategories();
      const categories = categoryResponse.data?.items || categoryResponse.items || [];
      const foundCategory = categories.find(cat => cat.slug === categorySlug);
      
      if (!foundCategory) {
        setError('Category not found');
        return;
      }
      
      setCategory(foundCategory);

      // Fetch articles for this category
      const articlesResponse = await articlesAPI.getArticles({
        status: 'published',
        category: categorySlug,
        sortBy: 'publicationDate',
        sortOrder: 'desc',
        limit: 20 // Get enough articles for both grids
      });

      const articlesData = articlesResponse.data?.items || articlesResponse.items || [];
      
      // Transform articles for display
      const transformedArticles = articlesData.map(article => {
        // Handle image URL - prepend base URL if it's a relative path
        let imageUrl = article.featuredImage;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          imageUrl = `http://localhost:3001${imageUrl}`;
        }
        
        // Check if it's a video before adding image parameters
        const isVideo = imageUrl && (
          /\.(mp4|webm|ogg|avi|mov|quicktime)$/i.test(imageUrl) || 
          imageUrl.includes('video/') ||
          imageUrl.includes('.mp4') ||
          imageUrl.includes('.webm') ||
          imageUrl.includes('.ogg')
        );

        // Resize image for category page (only for images, not videos)
        if (imageUrl && imageUrl.includes('http') && !isVideo) {
          if (imageUrl.includes('unsplash.com')) {
            imageUrl = imageUrl.replace(/w=\d+&h=\d+/, 'w=400&h=250');
          } else if (imageUrl.includes('localhost:3001')) {
            imageUrl = `${imageUrl}?w=400&h=250&fit=crop&quality=90`;
          }
        }
        
        // Enhanced author information - handle multiple authors
        const authors = article.articleAuthors && article.articleAuthors.length > 0 
          ? article.articleAuthors.map(authorData => ({
              id: authorData.user.id,
              firstName: authorData.user.firstName || '',
              lastName: authorData.user.lastName || '',
              username: authorData.user.username || '',
            }))
          : article.author 
            ? [{
                id: article.author.id,
                firstName: article.author.firstName || '',
                lastName: article.author.lastName || '',
                username: article.author.username || '',
              }]
            : [];

        return {
          ...article,
          featuredImage: imageUrl,
          authors: authors,
          authorDisplay: authors.length > 0 
            ? authors.map(author => 
                `${author.firstName} ${author.lastName}`.trim() || author.username
              ).join(', ')
            : 'Unknown Author',
          contentSnippet: createExcerpt(article.content, 120)
        };
      });

      setArticles(transformedArticles.slice(0, 4)); // Only use first 4 articles for first grid
      
      // Get additional articles for the second grid (articles 5-7) from the same fetch
      const additionalArticlesData = articlesData.slice(4, 7); // Get articles 5-7 (indices 4-6)
      const transformedAdditionalArticles = additionalArticlesData.map(article => {
        // Handle image URL - prepend base URL if it's a relative path
        let imageUrl = article.featuredImage;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          imageUrl = `http://localhost:3001${imageUrl}`;
        }
        
        // Check if it's a video before adding image parameters
        const isVideo = imageUrl && (
          /\.(mp4|webm|ogg|avi|mov|quicktime)$/i.test(imageUrl) || 
          imageUrl.includes('video/') ||
          imageUrl.includes('.mp4') ||
          imageUrl.includes('.webm') ||
          imageUrl.includes('.ogg')
        );

        // Resize image for category page (only for images, not videos)
        if (imageUrl && imageUrl.includes('http') && !isVideo) {
          if (imageUrl.includes('unsplash.com')) {
            imageUrl = imageUrl.replace(/w=\d+&h=\d+/, 'w=400&h=250');
          } else if (imageUrl.includes('localhost:3001')) {
            imageUrl = `${imageUrl}?w=400&h=250&fit=crop&quality=90`;
          }
        }
        
        // Enhanced author information - handle multiple authors
        const authors = article.articleAuthors && article.articleAuthors.length > 0 
          ? article.articleAuthors.map(authorData => ({
              id: authorData.user.id,
              firstName: authorData.user.firstName || '',
              lastName: authorData.user.lastName || '',
              username: authorData.user.username || '',
            }))
          : article.author 
            ? [{
                id: article.author.id,
                firstName: article.author.firstName || '',
                lastName: article.author.lastName || '',
                username: article.author.username || '',
              }]
            : [];

        return {
          ...article,
          featuredImage: imageUrl,
          authors: authors,
          authorDisplay: authors.length > 0 
            ? authors.map(author => 
                `${author.firstName} ${author.lastName}`.trim() || author.username
              ).join(', ')
            : 'Unknown Author',
          contentSnippet: createExcerpt(article.content, 120)
        };
      });

      setAdditionalArticles(transformedAdditionalArticles);
      setHasMore(articlesData.length > 7); // Check if there are more articles beyond the first 7
      
      // Fetch popular articles (most viewed) for the popular column
      const popularResponse = await articlesAPI.getArticles({
        status: 'published',
        category: categorySlug,
        sortBy: 'viewCount',
        sortOrder: 'desc',
        limit: 5 // Get top 5 most viewed articles
      });

      const popularArticlesData = popularResponse.data?.items || popularResponse.items || [];
      const transformedPopularArticles = popularArticlesData.map(article => {
        // Handle image URL - prepend base URL if it's a relative path
        let imageUrl = article.featuredImage;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          imageUrl = `http://localhost:3001${imageUrl}`;
        }
        
        // Check if it's a video before adding image parameters
        const isVideo = imageUrl && (
          /\.(mp4|webm|ogg|avi|mov|quicktime)$/i.test(imageUrl) || 
          imageUrl.includes('video/') ||
          imageUrl.includes('.mp4') ||
          imageUrl.includes('.webm') ||
          imageUrl.includes('.ogg')
        );

        // Resize image for category page (only for images, not videos)
        if (imageUrl && imageUrl.includes('http') && !isVideo) {
          if (imageUrl.includes('unsplash.com')) {
            imageUrl = imageUrl.replace(/w=\d+&h=\d+/, 'w=400&h=250');
          } else if (imageUrl.includes('localhost:3001')) {
            imageUrl = `${imageUrl}?w=400&h=250&fit=crop&quality=90`;
          }
        }
        
        // Enhanced author information - handle multiple authors
        const authors = article.articleAuthors && article.articleAuthors.length > 0 
          ? article.articleAuthors.map(authorData => ({
              id: authorData.user.id,
              firstName: authorData.user.firstName || '',
              lastName: authorData.user.lastName || '',
              username: authorData.user.username || '',
            }))
          : article.author 
            ? [{
                id: article.author.id,
                firstName: article.author.firstName || '',
                lastName: article.author.lastName || '',
                username: article.author.username || '',
              }]
            : [];

        return {
          ...article,
          featuredImage: imageUrl,
          authors: authors,
          authorDisplay: authors.length > 0 
            ? authors.map(author => 
                `${author.firstName} ${author.lastName}`.trim() || author.username
              ).join(', ')
            : 'Unknown Author',
          contentSnippet: createExcerpt(article.content, 120)
        };
      });

      setPopularArticles(transformedPopularArticles);
    } catch (error) {
      console.error('Error fetching category data:', error);
      setError('Failed to load category articles');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreArticles = async () => {
    if (loadingMore || !hasMore) return;
    
    try {
      setLoadingMore(true);
      const currentCount = additionalArticles.length;
      
      const response = await articlesAPI.getArticles({
        status: 'published',
        category: categorySlug,
        sortBy: 'publicationDate',
        sortOrder: 'desc',
        limit: 20 // Fetch more articles to ensure we have enough
      });

      const allArticlesData = response.data?.items || response.items || [];
      const startIndex = 7 + currentCount; // Skip first 7 + already loaded articles
      const newArticlesData = allArticlesData.slice(startIndex, startIndex + 3); // Get next 3 articles
      const transformedNewArticles = newArticlesData.map(article => {
        // Handle image URL - prepend base URL if it's a relative path
        let imageUrl = article.featuredImage;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          imageUrl = `http://localhost:3001${imageUrl}`;
        }
        
        // Check if it's a video before adding image parameters
        const isVideo = imageUrl && (
          /\.(mp4|webm|ogg|avi|mov|quicktime)$/i.test(imageUrl) || 
          imageUrl.includes('video/') ||
          imageUrl.includes('.mp4') ||
          imageUrl.includes('.webm') ||
          imageUrl.includes('.ogg')
        );

        // Resize image for category page (only for images, not videos)
        if (imageUrl && imageUrl.includes('http') && !isVideo) {
          if (imageUrl.includes('unsplash.com')) {
            imageUrl = imageUrl.replace(/w=\d+&h=\d+/, 'w=400&h=250');
          } else if (imageUrl.includes('localhost:3001')) {
            imageUrl = `${imageUrl}?w=400&h=250&fit=crop&quality=90`;
          }
        }
        
        // Enhanced author information - handle multiple authors
        const authors = article.articleAuthors && article.articleAuthors.length > 0 
          ? article.articleAuthors.map(authorData => ({
              id: authorData.user.id,
              firstName: authorData.user.firstName || '',
              lastName: authorData.user.lastName || '',
              username: authorData.user.username || '',
            }))
          : article.author 
            ? [{
                id: article.author.id,
                firstName: article.author.firstName || '',
                lastName: article.author.lastName || '',
                username: article.author.username || '',
              }]
            : [];

        return {
          ...article,
          featuredImage: imageUrl,
          authors: authors,
          authorDisplay: authors.length > 0 
            ? authors.map(author => 
                `${author.firstName} ${author.lastName}`.trim() || author.username
              ).join(', ')
            : 'Unknown Author',
          contentSnippet: createExcerpt(article.content, 120)
        };
      });

      setAdditionalArticles(prev => [...prev, ...transformedNewArticles]);
      setHasMore(allArticlesData.length > startIndex + 3); // Check if there are more articles available
    } catch (error) {
      console.error('Error loading more articles:', error);
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicPageHeader />
        <main className="flex-1">
          <div className="category-page">
            <div className="category-page-container">
              <div className="category-page-loading">
                <div className="category-page-loading-spinner"></div>
                <p>Loading articles...</p>
              </div>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  if (error || !category) {
    return (
      <div className="min-h-screen flex flex-col">
        <PublicPageHeader />
        <main className="flex-1">
          <div className="category-page">
            <div className="category-page-container">
              <div className="category-page-error">
                <h1>Category Not Found</h1>
                <p>The category you're looking for doesn't exist.</p>
                <Link to="/" className="category-page-back-link">
                  ← Back to Home
                </Link>
              </div>
            </div>
          </div>
        </main>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <PublicPageHeader />
      
      <main className="flex-1">
        <div className="category-page">
          <div className="category-page-container">
            {/* Header */}
            <div className="category-page-header">
              <h1 className="category-page-title">
                WHAT'S NEW IN {category.name.toUpperCase()}?
              </h1>
              <div className="category-page-separator"></div>
            </div>

            {/* Articles Grid */}
            {articles.length === 0 ? (
              <div className="category-page-empty">
                <h2>No articles found</h2>
                <p>There are no published articles in this category yet.</p>
                <Link to="/" className="category-page-browse-link">
                  Browse Other Categories
                </Link>
              </div>
            ) : (
              <React.Fragment>
                <div className="category-page-grid">
                  {/* Left Column - Featured Article */}
                  <div className="category-page-left-column">
                    {articles.length > 0 && (
                      <React.Fragment>
                        <Link 
                          to={`/content/${articles[0].slug}`}
                          className="category-page-story-card featured"
                        >
                          <div className="category-page-story-image">
                            <MediaDisplay
                              mediaUrl={articles[0].featuredImage}
                              mediaType="image"
                              alt={articles[0].title}
                              className="category-page-story-img"
                            />
                          </div>
                         
                          <div className="category-page-story-content">
                            <div className="category-page-story-category">
                              {category.name}
                            </div>
                            
                            <h3 className="category-page-story-title">
                              {articles[0].title}
                            </h3>
                            
                            {articles[0].contentSnippet && (
                              <p className="category-page-story-excerpt">
                                {articles[0].contentSnippet}
                              </p>
                            )}
                            
                            <div className="category-page-story-author-date">
                              <span>By {articles[0].authorDisplay}</span>
                              <span className="category-page-story-author-date-separator">•</span>
                              <span>{new Date(articles[0].publicationDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}</span>
                            </div>
                          </div>
                        </Link>
                      </React.Fragment>
                    )}
                  </div>
                  
                  {/* Vertical Column Separator */}
                  <div className="category-page-column-separator"></div>
                  
                  {/* Right Column - Other Articles */}
                  <div className="category-page-right-column">
                    {articles.slice(1, 4).map((article, index) => (
                      <React.Fragment key={article.id}>
                        <Link 
                          to={`/content/${article.slug}`}
                          className="category-page-story-card"
                        >
                          <div className="category-page-story-image">
                            <MediaDisplay
                              mediaUrl={article.featuredImage}
                              mediaType="image"
                              alt={article.title}
                              className="category-page-story-img"
                            />
                          </div>
                         
                          <div className="category-page-story-content">
                            <div className="category-page-story-category">
                              {category.name}
                            </div>
                            
                            <h4 className="category-page-story-title">
                              {article.title}
                            </h4>
                            
                            {article.contentSnippet && (
                              <p className="category-page-story-excerpt">
                                {article.contentSnippet}
                              </p>
                            )}
                            
                            <div className="category-page-story-author-date">
                              <span>By {article.authorDisplay}</span>
                              <span className="category-page-story-author-date-separator">•</span>
                              <span>{new Date(article.publicationDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}</span>
                            </div>
                          </div>
                        </Link>
                        {index < articles.slice(1, 4).length - 1 && (
                          <div className="category-page-story-separator"></div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <div className="category-page-grid-separator"></div>
                
                {/* Second Grid - Additional Articles and Popular */}
                <div className="category-page-second-grid">
                  {/* Left Column - Additional Articles */}
                  <div className="category-page-second-left-column">
                    {additionalArticles.map((article, index) => (
                      <React.Fragment key={article.id}>
                        <Link 
                          to={`/content/${article.slug}`}
                          className="category-page-story-card"
                        >
                          <div className="category-page-story-image">
                            <MediaDisplay
                              mediaUrl={article.featuredImage}
                              mediaType="image"
                              alt={article.title}
                              className="category-page-story-img"
                            />
                          </div>
                         
                          <div className="category-page-story-content">
                            <div className="category-page-story-category">
                              {category.name}
                            </div>
                            
                            <h4 className="category-page-story-title">
                              {article.title}
                            </h4>
                            
                            {article.contentSnippet && (
                              <p className="category-page-story-excerpt">
                                {article.contentSnippet}
                              </p>
                            )}
                            
                            <div className="category-page-story-author-date">
                              <span>By {article.authorDisplay}</span>
                              <span className="category-page-story-author-date-separator">•</span>
                              <span>{new Date(article.publicationDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}</span>
                            </div>
                          </div>
                        </Link>
                        {(index < additionalArticles.length - 1 || index === 2) && (
                          <div className="category-page-story-separator"></div>
                        )}
                      </React.Fragment>
                    ))}
                    
                    {/* Load More Button */}
                    {hasMore && (
                      <div className="category-page-load-more-container">
                        <button 
                          className="category-page-load-more-button"
                          onClick={loadMoreArticles}
                          disabled={loadingMore}
                        >
                          {loadingMore ? 'Loading...' : 'Load More'}
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Vertical Column Separator */}
                  <div className="category-page-column-separator"></div>
                  
                  {/* Right Column - Popular Articles */}
                  <div className="category-page-popular-column">
                    <div className="category-page-popular-container-inner">
                      <div className="category-page-popular-section-title">
                        <div className="category-page-popular-green-line"></div>
                        WHAT'S POPULAR IN {category.name.toUpperCase()}?
                      </div>
                      
                      <div className="category-page-popular-articles-list">
                        {popularArticles.map((article, index) => (
                          <React.Fragment key={`popular-${article.id}`}>
                            <Link 
                              to={`/content/${article.slug}`}
                              className="category-page-popular-simple-card"
                            >
                              <div className="category-page-popular-simple-category">
                                {category.name}
                              </div>
                              <div className="category-page-popular-simple-title">
                                {article.title}
                              </div>
                            </Link>
                            {index < 4 && (
                              <div className="category-page-popular-simple-separator"></div>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </React.Fragment>
            )}
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
};

export default CategoryPage;
