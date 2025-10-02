import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articlesAPI, categoriesAPI } from '../../services/apiService';
import MediaDisplay from '../../components/MediaDisplay';
import usePageTitle from '../../hooks/usePageTitle';
import './latest-by-category.css';

const LatestByCategory = () => {
  usePageTitle('Latest by Category');
  
  const [categoriesData, setCategoriesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  console.log('LatestByCategory: Component rendered, loading:', loading, 'categories:', categoriesData.length, 'error:', error);

  useEffect(() => {
    fetchLatestByCategory();
  }, []);

  const fetchLatestByCategory = async () => {
    try {
      setLoading(true);
      console.log('LatestByCategory: Starting to fetch articles...');
      
      // Get all published articles
      const response = await articlesAPI.getArticles({
        status: 'published',
        sortBy: 'publicationDate',
        sortOrder: 'desc',
        limit: 100 // Get more articles to ensure we have coverage
      });
      
      console.log('LatestByCategory: Articles response:', response);
      
      const articles = response.data?.items || [];
      console.log('LatestByCategory: Articles fetched:', articles.length);
      
      if (articles.length === 0) {
        console.log('LatestByCategory: No articles found');
        setCategoriesData([]);
        return;
      }
      
      // Group articles by category and get top 3 from each
      const categoryMap = new Map();
      
      articles.forEach(article => {
        if (article.categories && article.categories.length > 0) {
          article.categories.forEach(category => {
            if (!categoryMap.has(category.name)) {
              categoryMap.set(category.name, []);
            }
            categoryMap.get(category.name).push(article);
          });
        }
      });
      
      console.log('LatestByCategory: Category map:', Array.from(categoryMap.keys()));
      
      // Process each category and get top 3 articles
      const processedCategories = Array.from(categoryMap.entries()).map(([categoryName, categoryArticles]) => {
        // Sort articles by publication date (most recent first) and take top 3
        const topArticles = categoryArticles
          .sort((a, b) => new Date(b.publicationDate) - new Date(a.publicationDate))
          .slice(0, 3)
          .map(article => {
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

            // Resize image for latest by category section (only for images, not videos)
            if (imageUrl && imageUrl.includes('http') && !isVideo) {
              if (imageUrl.includes('unsplash.com')) {
                imageUrl = imageUrl.replace(/w=\d+&h=\d+/, 'w=400&h=300');
              } else if (imageUrl.includes('localhost:3001')) {
              }
            }
            
            return {
              id: article.id,
              title: article.title,
              slug: article.slug,
              featuredImage: imageUrl || "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop&quality=90",
              publicationDate: article.publicationDate
            };
          });
        
        return {
          categoryName,
          articles: topArticles
        };
      });
      
      // Define category order and filter out "The AXIS Online"
      const categoryOrder = [
        'News',
        'Opinion', 
        'Editorial',
        'Feature',
        'Literary',
        'DevCom',
        'Sports',
        'Gallery'
      ];
      
      // Filter out "The AXIS Online" and sort by predefined order
      const filteredCategories = processedCategories.filter(category => 
        category.categoryName !== 'The AXIS Online'
      );
      
      const sortedCategories = filteredCategories.sort((a, b) => {
        const indexA = categoryOrder.indexOf(a.categoryName);
        const indexB = categoryOrder.indexOf(b.categoryName);
        
        // If both categories are in the order list, sort by their position
        if (indexA !== -1 && indexB !== -1) {
          return indexA - indexB;
        }
        
        // If only one is in the order list, prioritize it
        if (indexA !== -1) return -1;
        if (indexB !== -1) return 1;
        
        // If neither is in the order list, sort alphabetically
        return a.categoryName.localeCompare(b.categoryName);
      });
      
      console.log('LatestByCategory: Processed categories:', sortedCategories.length);
      setCategoriesData(sortedCategories);
    } catch (err) {
      setError('Failed to load latest articles by category');
      console.error('Error fetching latest articles by category:', err);
      console.error('Error details:', err.response?.data || err.message);
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
      <section className="latest-by-category">
        <div className="latest-by-category-container">
          <div className="latest-by-category-grid">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="latest-by-category-section loading">
                <div className="latest-by-category-skeleton"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    console.log('LatestByCategory: Error state:', error);
    return (
      <section className="latest-by-category">
        <div className="latest-by-category-container">
          <p>Error loading articles: {error}</p>
        </div>
      </section>
    );
  }

  if (categoriesData.length === 0) {
    console.log('LatestByCategory: No categories found');
    return (
      <section className="latest-by-category">
        <div className="latest-by-category-container">
          <p>No articles found</p>
        </div>
      </section>
    );
  }

  return (
    <section className="latest-by-category">
      <div className="latest-by-category-container">
        <div className="latest-by-category-grid">
          {categoriesData.map((categoryData) => (
            <div key={categoryData.categoryName} className="latest-by-category-section">
              <h2 className="latest-by-category-section-title">
                {categoryData.categoryName}
              </h2>
              
              {categoryData.articles.length > 0 && (
                <div className="latest-by-category-articles">
                  {/* Top article with image */}
                  <Link 
                    to={`/content/${categoryData.articles[0].slug || categoryData.articles[0].id}`}
                    className="latest-by-category-top-article"
                  >
                    <div className="latest-by-category-top-image">
                      <MediaDisplay
                        mediaUrl={categoryData.articles[0].featuredImage}
                        alt={categoryData.articles[0].title}
                        className="latest-by-category-img"
                        imageClassName="latest-by-category-img-element"
                        videoClassName="latest-by-category-img-element"
                        iconClassName="w-6 h-6"
                        showVideoIcon={true}
                      />
                    </div>
                    <h3 className="latest-by-category-top-title">
                      {categoryData.articles[0].title}
                    </h3>
                  </Link>
                  
                  {/* Other articles */}
                  {categoryData.articles.slice(1).map((article, index) => (
                    <React.Fragment key={article.id}>
                      <div className="latest-by-category-separator"></div>
                      <Link 
                        to={`/content/${article.slug || article.id}`}
                        className="latest-by-category-article-item"
                      >
                        <h4 className="latest-by-category-article-title">
                          {article.title}
                        </h4>
                      </Link>
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LatestByCategory;
