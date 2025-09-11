import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { articlesAPI } from '../services/apiService';
import { 
  DocumentTextIcon, 
  EyeIcon, 
  HeartIcon, 
  ChatBubbleLeftIcon, 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../hooks/useAuth';

const MyArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchMyArticles();
  }, []);

  const fetchMyArticles = async () => {
    try {
      setError(null);
      const response = await articlesAPI.getMyArticles();
      setArticles(response.data.items || []);
    } catch (error) {
      console.error('Failed to fetch my articles:', error);
      setError('Failed to load your articles');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteArticle = async (articleId) => {
    if (!window.confirm('Are you sure you want to delete this article?')) {
      return;
    }

    try {
      await articlesAPI.deleteArticle(articleId);
      setArticles(articles.filter(article => article.id !== articleId));
    } catch (error) {
      console.error('Failed to delete article:', error);
      setError('Failed to delete article');
    }
  };

  const getStatusIcon = (status) => {
    switch (status.toLowerCase()) {
      case 'published':
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4 text-yellow-500" />;
      case 'draft':
        return <PencilIcon className="h-4 w-4 text-gray-500" />;
      case 'rejected':
        return <XCircleIcon className="h-4 w-4 text-red-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
          onClick={fetchMyArticles}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-2">My Content</h1>
          <p className="text-secondary">Manage your content and create new articles</p>
        </div>
        <Link
          to="/articles/create"
          className="btn-primary"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Create Article
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary">Total Content</p>
              <p className="text-2xl font-bold text-primary">{articles.length}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary">Published</p>
              <p className="text-2xl font-bold text-primary">
                {articles.filter(a => a.status.toLowerCase() === 'published').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-yellow-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary">Pending</p>
              <p className="text-2xl font-bold text-primary">
                {articles.filter(a => a.status.toLowerCase() === 'pending').length}
              </p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center">
            <EyeIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-secondary">Total Views</p>
              <p className="text-2xl font-bold text-primary">
                {articles.reduce((sum, a) => sum + (a.viewCount || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Articles List */}
      {articles.length === 0 ? (
        <div className="text-center p-8">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-primary">No content yet</h3>
          <p className="mt-1 text-sm text-secondary">
            Start writing your first article to share your thoughts with the world.
          </p>
          <div className="mt-6">
            <Link
              to="/articles/create"
              className="btn-primary"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Your First Article
            </Link>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-primary">Your Content</h3>
          </div>
          <div>
            {articles.map((article) => (
              <div key={article.id} className="p-4 border-b border-gray-200 last:border-b-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}>
                        {getStatusIcon(article.status)}
                        <span className="ml-1 capitalize">{article.status}</span>
                      </span>
                      <span className="text-sm text-secondary">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-medium text-primary mb-2">
                      {article.title}
                    </h3>
                    
                    {article.excerpt && (
                      <p className="text-secondary mb-3">
                        {article.excerpt}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-sm text-secondary">
                      <div className="flex items-center space-x-1">
                        <EyeIcon className="h-4 w-4" />
                        <span>{article.viewCount || 0} views</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <HeartIcon className="h-4 w-4" />
                        <span>{article.likeCount || 0} likes</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <ChatBubbleLeftIcon className="h-4 w-4" />
                        <span>{article.commentCount || 0} comments</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Link
                      to={`/articles/${article.id}`}
                      className="text-blue-600 hover:text-blue-500 font-medium text-sm"
                    >
                      View
                    </Link>
                    <Link
                      to={`/articles/${article.id}/edit`}
                      className="text-secondary hover:text-primary font-medium text-sm"
                    >
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteArticle(article.id)}
                      className="text-red-600 hover:text-red-500 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyArticles;
