import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, CalendarIcon, EyeIcon } from '@heroicons/react/24/outline';
import { articlesAPI } from '../services/apiService';
import MediaDisplay from './MediaDisplay';
import '../styles/featured-articles-section.css';

const FeaturedArticlesSection = () => {
  const [featuredArticles, setFeaturedArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFeaturedArticles();
  }, []);

  const fetchFeaturedArticles = async () => {
    try {
      setLoading(true);
      const response = await articlesAPI.getFeaturedArticles();
      
      // Transform articles for display
      const articles = response.data?.map(article => {
        // Handle image URL - prepend base URL if it's a relative path
        let imageUrl = article.featuredImage;
        if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
          imageUrl = `http://localhost:3001${imageUrl}`;
        }
        
        return {
          id: article.id,
          title: article.title,
          excerpt: article.excerpt,
          slug: article.slug,
          featuredImage: imageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=300&h=200&fit=crop",
          publicationDate: article.publicationDate,
          viewCount: article.viewCount || 0,
          categories: article.categories || []
        };
      }) || [];

      setFeaturedArticles(articles);
    } catch (err) {
      setError('Failed to load featured articles');
      console.error('Error fetching featured articles:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="featured-articles-section">
        <div className="featured-articles-header">
          <h2 className="featured-articles-title">
            <StarIcon className="featured-articles-icon" />
            Featured Articles
          </h2>
        </div>
        <div className="featured-articles-grid">
          {[...Array(5)].map((_, index) => (
            <div key={index} className="featured-article-card loading">
              <div className="featured-article-skeleton"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || featuredArticles.length === 0) {
    return null; // Don't show section if no featured articles
  }

  return (
    <div className="featured-articles-section">
      <div className="featured-articles-header">
        <h2 className="featured-articles-title">
          <StarIcon className="featured-articles-icon" />
          Featured Articles
        </h2>
        <p className="featured-articles-subtitle">
          Handpicked stories that deserve your attention
        </p>
      </div>
      
      <div className="featured-articles-grid">
        {featuredArticles.map((article, index) => (
          <Link 
            key={article.id} 
            to={`/content/${article.slug || article.id}`}
            className={`featured-article-card ${index === 0 ? 'featured-main' : ''}`}
          >
            <div className="featured-article-image-container">
              <MediaDisplay
                mediaUrl={article.featuredImage}
                alt={article.title}
                className="featured-article-image"
                imageClassName="featured-article-img"
                videoClassName="featured-article-img"
                iconClassName="w-6 h-6"
                showVideoIcon={true}
              />
              <div className="featured-article-overlay">
                <div className="featured-article-category">
                  {article.categories.length > 0 ? article.categories[0].name : 'Featured'}
                </div>
              </div>
            </div>
            
            <div className="featured-article-content">
              <h3 className="featured-article-title">
                {article.title}
              </h3>
              
              {article.excerpt && (
                <p className="featured-article-excerpt">
                  {article.excerpt.length > 120 
                    ? `${article.excerpt.substring(0, 120)}...` 
                    : article.excerpt}
                </p>
              )}
              
              <div className="featured-article-meta">
                <div className="featured-article-date">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(article.publicationDate)}</span>
                </div>
                <div className="featured-article-views">
                  <EyeIcon className="w-4 h-4" />
                  <span>{article.viewCount}</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default FeaturedArticlesSection;
