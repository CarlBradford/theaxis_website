import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { articlesAPI, analyticsAPI } from '../services/apiService';
import {
  DocumentTextIcon,
  EyeIcon,
  HeartIcon,
  ChatBubbleLeftIcon,
  PlusIcon,
  UserGroupIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user, hasRole } = useAuth();
  const [stats, setStats] = useState({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    totalUsers: 0,
    totalComments: 0,
    pendingComments: 0,
    totalViews: 0,
  });
  const [recentArticles, setRecentArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      
      // Set default stats first
      setStats({
        totalArticles: 0,
        publishedArticles: 0,
        draftArticles: 0,
        totalUsers: 0,
        totalComments: 0,
        pendingComments: 0,
        totalViews: 0,
      });
      
      if (hasRole('EDITOR_IN_CHIEF')) {
        // Admin dashboard with analytics
        const [analyticsResponse, articlesResponse] = await Promise.all([
          analyticsAPI.getDashboard(),
          articlesAPI.getArticles({ limit: 5 })
        ]);

        const analytics = analyticsResponse.data;
        const articles = articlesResponse.data.items || [];

        setStats({
          totalArticles: analytics.overview.totalArticles,
          publishedArticles: analytics.overview.totalArticles, // Simplified
          draftArticles: 0, // Would need separate endpoint
          totalUsers: analytics.overview.totalUsers,
          totalComments: analytics.overview.totalComments,
          pendingComments: analytics.overview.pendingComments,
          totalViews: analytics.overview.totalViews || 0,
        });

        setRecentArticles(articles);
      } else {
        // Regular user dashboard
        const articlesResponse = await articlesAPI.getArticles({ limit: 5 });
        const articles = articlesResponse.data.items || [];
        
        setRecentArticles(articles);
        
        // Calculate basic stats from articles
        const totalArticles = articles.length;
        const publishedArticles = articles.filter(a => a.status === 'PUBLISHED').length;
        const draftArticles = articles.filter(a => a.status === 'DRAFT').length;

        setStats({
          totalArticles,
          publishedArticles,
          draftArticles,
          totalUsers: 0,
          totalComments: articles.reduce((sum, a) => sum + (a.commentCount || 0), 0),
          pendingComments: 0,
          totalViews: articles.reduce((sum, a) => sum + (a.viewCount || 0), 0),
        });
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Showing basic dashboard.');
      // Keep default stats and empty articles array
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
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 mt-2">
              Welcome back, <span className="font-semibold text-gray-900">{user?.name || user?.email}</span>!
            </p>
          </div>
        </div>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-600 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-gray-600 mt-1">
            Welcome back, <span className="font-medium text-gray-900">{user?.name || user?.email}</span>
          </p>
        </div>
        {hasRole(['ADMIN', 'EDITOR']) && (
          <Link
            to="/articles/new"
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-blue-600 hover:from-blue-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            New Article
          </Link>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Articles
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalArticles}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <EyeIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Views
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalViews.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <HeartIcon className="h-8 w-8 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Likes
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalLikes.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ChatBubbleLeftIcon className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Total Comments
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.totalComments.toLocaleString()}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Published Articles
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.publishedArticles}
                </dd>
              </dl>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DocumentTextIcon className="h-8 w-8 text-yellow-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Draft Articles
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  {stats.draftArticles}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Articles */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Recent Articles</h2>
          <Link
            to="/articles"
            className="text-sm text-blue-600 hover:text-primary-500"
          >
            View all →
          </Link>
        </div>
        
        {recentArticles.length === 0 ? (
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No articles yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Get started by creating your first article.
            </p>
            <div className="mt-6">
              <Link
                to="/articles/new"
                className="btn-primary"
              >
                Create Article
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {recentArticles.map((article) => (
              <div
                key={article.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-gray-900">
                    {article.title}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {article.excerpt || 'No excerpt available'}
                  </p>
                  <div className="mt-1 flex items-center space-x-4 text-xs text-gray-500">
                    <span className="capitalize">{article.status.toLowerCase()}</span>
                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <Link
                  to={`/articles/${article.id}`}
                  className="text-blue-600 hover:text-primary-500 text-sm font-medium"
                >
                  View →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
