import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articlesAPI } from '../services/apiService';
import { DocumentTextIcon, EyeIcon, HeartIcon, ChatBubbleLeftIcon, PlusIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, hasRole } = useAuth();

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      setError(null);
      const response = await articlesAPI.getArticles();
      setArticles(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch articles:', error);
      setError('Failed to load articles');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={fetchArticles}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Articles</h1>
        {hasRole('STAFF') && (
          <Link
            to="/articles/create"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Article
          </Link>
        )}
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-8">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No articles yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Be the first to publish an article.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <article key={article.id} className="card hover:shadow-lg transition-shadow">
              {article.featuredImage && (
                <div className="aspect-w-16 aspect-h-9 mb-4">
                  <img
                    src={article.featuredImage}
                    alt={article.title}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
              )}
              
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span className="capitalize px-2 py-1 bg-gray-100 rounded-full">
                    {article.status.toLowerCase()}
                  </span>
                  <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-900 line-clamp-2">
                  {article.title}
                </h2>
                
                {article.excerpt && (
                  <p className="text-gray-600 line-clamp-3">
                    {article.excerpt}
                  </p>
                )}
                
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <EyeIcon className="h-4 w-4" />
                      <span>{article.viewCount || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <HeartIcon className="h-4 w-4" />
                      <span>{article.likeCount || 0}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <ChatBubbleLeftIcon className="h-4 w-4" />
                      <span>{article.commentCount || 0}</span>
                    </div>
                  </div>
                  
                  <Link
                    to={`/articles/${article.id}`}
                    className="text-blue-600 hover:text-blue-500 font-medium"
                  >
                    Read more →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default Articles;
