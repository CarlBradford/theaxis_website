import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CalendarIcon, EyeIcon } from '@heroicons/react/24/outline';
import { articlesAPI } from '../../services/apiService';
import MediaDisplay from '../../components/MediaDisplay';
import './recent-stories.css';

const RecentStories = () => {
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRecentArticles();
  }, []);

  const fetchRecentArticles = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.getArticles({
        status: 'published',
        sortBy: 'publicationDate',
        sortOrder: 'desc',
        limit: 5
      });
      
      // Transform articles for display
      const articles = response.data?.items?.map(article => {
        // Handle image URL - prepend base URL if it's a relative path
        let imageUrl = article.featuredImage;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          imageUrl = `http://localhost:3001${imageUrl}`;
        }
        
        // Resize image for recent stories section
        if (imageUrl && imageUrl.includes('http')) {
          if (imageUrl.includes('unsplash.com')) {
            imageUrl = imageUrl.replace(/w=\d+&h=\d+/, 'w=300&h=200');
          } else if (imageUrl.includes('localhost:3001')) {
            imageUrl = `${imageUrl}?w=300&h=200&fit=crop&quality=90`;
          }
        }
        
        // Enhanced author information - handle multiple authors
        const authors = article.articleAuthors && article.articleAuthors.length > 0 
          ? article.articleAuthors.map(authorData => ({
              id: authorData.user.id,
              firstName: authorData.user.firstName || '',
              lastName: authorData.user.lastName || '',
              username: authorData.user.username || '',
              email: authorData.user.email || '',
              role: authorData.user.role || authorData.role || '',
              bio: authorData.user.bio || '',
              // Create display name with fallbacks
              name: `${authorData.user.firstName || ''} ${authorData.user.lastName || ''}`.trim() || authorData.user.username || 'Unknown Author',
              // Create role display name
              roleDisplay: authorData.role ? authorData.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : ''
            }))
          : article.author 
            ? [{
                id: article.author.id,
                firstName: article.author.firstName || '',
                lastName: article.author.lastName || '',
                username: article.author.username || '',
                email: article.author.email || '',
                role: article.author.role || '',
                bio: article.author.bio || '',
                name: `${article.author.firstName || ''} ${article.author.lastName || ''}`.trim() || article.author.username || 'Unknown Author',
                roleDisplay: article.author.role ? article.author.role.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()) : ''
              }]
            : [{ 
                id: null,
                firstName: '',
                lastName: '',
                username: '',
                email: '',
                role: '',
                bio: '',
                name: 'Unknown Author',
                roleDisplay: ''
              }];
        
        // Generate content snippet from article content
        const contentSnippet = article.content 
          ? article.content.length > 150 
            ? `${article.content.substring(0, 150)}...` 
            : article.content
          : article.excerpt || 'Read the full article to discover more about this story...';

        return {
          id: article.id,
          title: article.title,
          contentSnippet: contentSnippet,
          slug: article.slug,
          featuredImage: imageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop&quality=90",
          publicationDate: article.publicationDate,
          viewCount: article.viewCount || 0,
          categories: article.categories || [],
          authors: authors
        };
      }) || [];

      setRecentArticles(articles);
    } catch (err) {
      setError('Failed to load recent articles');
      console.error('Error fetching recent articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No date';
    try {
      const date = new Date(dateString);
      
      // Check if it's a valid date and not epoch date (1970)
      if (isNaN(date.getTime()) || date.getFullYear() < 1990) {
        return 'Invalid date';
      }
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error, 'Date string:', dateString);
      return 'Invalid date';
    }
  };

  if (loading) {
    return (
      <section className="recent-stories">
        <div className="recent-stories-container">
          <div className="recent-stories-header">
            <h2 className="recent-stories-title">Recent Stories</h2>
            <div className="recent-stories-title-separator"></div>
          </div>
          <div className="recent-stories-grid">
            {[...Array(5)].map((_, index) => (
              <div key={index} className="recent-story-card loading">
                <div className="recent-story-skeleton"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || recentArticles.length === 0) {
    return null; // Don't show section if no recent articles
  }

  return (
    <section className="recent-stories">
      <div className="recent-stories-container">
        <div className="recent-stories-header">
          <h2 className="recent-stories-title">Recent Stories</h2>
          <div className="recent-stories-title-separator"></div>
        </div>
        
        <div className="recent-stories-grid">
          {/* Left Column - Featured Article */}
          <div className="recent-stories-left-column">
            {recentArticles.length > 0 && (
              <React.Fragment>
                <Link 
                  to={`/content/${recentArticles[0].slug || recentArticles[0].id}`}
                  className="recent-story-card featured"
                >
                 <div className="recent-story-image">
                   <MediaDisplay
                     mediaUrl={recentArticles[0].featuredImage}
                     alt={recentArticles[0].title}
                     className="recent-story-img"
                     imageClassName="recent-story-img-element"
                     videoClassName="recent-story-img-element"
                     iconClassName="w-4 h-4"
                     showVideoIcon={true}
                   />
                 </div>
                
                 <div className="recent-story-content">
                   {recentArticles[0].categories.length > 0 && (
                     <div className="recent-story-category">
                       {recentArticles[0].categories[0].name}
                     </div>
                   )}
                   
                   <h3 className="recent-story-title">
                     {recentArticles[0].title}
                   </h3>
                   
                   {recentArticles[0].contentSnippet && (
                     <p className="recent-story-excerpt">
                       {recentArticles[0].contentSnippet}
                     </p>
                   )}
                   
                   <div className="recent-story-author-date">
                     <span>By {recentArticles[0].authors?.map((author, index) => (
                       <span key={author.id || index}>
                         {author.name}
                         {index < recentArticles[0].authors.length - 1 && (
                           <span className="recent-story-author-separator">
                             {index === recentArticles[0].authors.length - 2 ? ' and ' : ', '}
                           </span>
                         )}
                       </span>
                     )) || 'Unknown Author'}</span>
                     <span className="recent-story-author-date-separator">•</span>
                     <span>{formatDate(recentArticles[0].publicationDate)}</span>
                   </div>
                 </div>
                </Link>
                
                {/* Mobile Separator */}
                <div className="recent-story-featured-mobile-separator"></div>
              </React.Fragment>
            )}
          </div>
          
          {/* Vertical Column Separator */}
          <div className="recent-stories-column-separator"></div>
          
          {/* Right Column - Other Articles */}
          <div className="recent-stories-right-column">
            {recentArticles.slice(1, 5).map((article, index) => (
              <React.Fragment key={article.id}>
                <Link 
                  to={`/content/${article.slug || article.id}`}
                  className="recent-story-card"
                >
                <div className="recent-story-image">
                  <MediaDisplay
                    mediaUrl={article.featuredImage}
                    alt={article.title}
                    className="recent-story-img"
                    imageClassName="recent-story-img-element"
                    videoClassName="recent-story-img-element"
                    iconClassName="w-4 h-4"
                    showVideoIcon={true}
                  />
                </div>
                
                <div className="recent-story-content">
                  {article.categories.length > 0 && (
                    <div className="recent-story-category">
                      {article.categories[0].name}
                    </div>
                  )}
                  
                  <h3 className="recent-story-title">
                    {article.title}
                  </h3>
                  
                  {article.contentSnippet && (
                    <p className="recent-story-excerpt">
                      {article.contentSnippet}
                    </p>
                  )}
                  
                  <div className="recent-story-author-date">
                    <span>By {article.authors?.map((author, index) => (
                      <span key={author.id || index}>
                        {author.name}
                        {index < article.authors.length - 1 && (
                          <span className="recent-story-author-separator">
                            {index === article.authors.length - 2 ? ' and ' : ', '}
                          </span>
                        )}
                      </span>
                    )) || 'Unknown Author'}</span>
                    <span className="recent-story-author-date-separator">•</span>
                    <span>{formatDate(article.publicationDate)}</span>
                  </div>
                  </div>
                </Link>
                {index === 0 && (
                  <div className="recent-story-card-separator"></div>
                )}
                {index > 0 && index < recentArticles.slice(1, 5).length - 1 && (
                  <div className="recent-story-card-separator"></div>
                )}
                {index === recentArticles.slice(1, 5).length - 1 && (
                  <div className="recent-story-fifth-article-separator"></div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
        
        {/* Line Separator */}
        <div className="recent-stories-separator"></div>
      </div>
    </section>
  );
};

export default RecentStories;
