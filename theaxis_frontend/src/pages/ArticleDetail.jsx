import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { DocumentTextIcon } from '@heroicons/react/24/outline';
import { 
  DocumentTextIcon as DocumentTextIconSolid,
} from '@heroicons/react/24/solid';
import CommentForm from '../components/CommentForm';
import CommentList from '../components/CommentList';
import { trackArticleView } from '../config/analytics';

const ArticleDetail = () => {
  const { id } = useParams();
  const [article, setArticle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentRefreshKey, setCommentRefreshKey] = useState(0);

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const response = await api.get(`/articles/${id}`);
      const articleData = response.data.data;
      setArticle(articleData);
      
      // Track article view
      if (articleData) {
        trackArticleView(
          articleData.id,
          articleData.title,
          articleData.category?.name || 'Uncategorized'
        );
      }
    } catch (error) {
      console.error('Failed to fetch article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCommentAdded = () => {
    // Refresh the comment list by updating the key
    setCommentRefreshKey(prev => prev + 1);
    console.log('Comment added successfully');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Article not found</h3>
        <p className="mt-1 text-sm text-gray-500">
          The article you're looking for doesn't exist.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <article className="card">
        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center space-x-4 mb-6">
            <div>
              <DocumentTextIconSolid className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {article.title}
              </h1>
              <div className="flex items-center space-x-2 text-sm text-gray-500 mt-2">
                <span className="capitalize px-2 py-1 bg-gray-100 rounded-full">
                  {article.status.toLowerCase()}
                </span>
                <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                {article.articleAuthors && article.articleAuthors.length > 0 ? (
                  <span>
                    by {article.articleAuthors.map((authorData, index) => (
                      <span key={authorData.user.id || index}>
                        {`${authorData.user.firstName || ''} ${authorData.user.lastName || ''}`.trim() || authorData.user.username || 'Unknown Author'}
                        {index < article.articleAuthors.length - 1 && (
                          <span>
                            {index === article.articleAuthors.length - 2 ? ' and ' : ', '}
                          </span>
                        )}
                      </span>
                    ))}
                  </span>
                ) : article.author ? (
                  <span>by {article.author.firstName} {article.author.lastName}</span>
                ) : null}
              </div>
            </div>
          </div>
          
          {article.excerpt && (
            <p className="text-xl text-gray-600 mb-6">
              {article.excerpt}
            </p>
          )}
          
          {article.featuredImage && (
            <div className="mb-6">
              <img
                src={article.featuredImage}
                alt={article.title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
          )}
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none">
          <div dangerouslySetInnerHTML={{ __html: article.content }} />
        </div>

        {/* Article Footer */}
        <footer className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span>Views: {article.viewCount || 0}</span>
              <span>Likes: {article.likeCount || 0}</span>
              <span>Comments: {article.commentCount || 0}</span>
            </div>
            
            {article.tags && article.tags.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-gray-500">Tags:</span>
                {article.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </footer>
      </article>

      {/* Comments Section */}
      <div className="space-y-6">
        {/* Comment Form */}
        <CommentForm 
          articleId={article.id} 
          onCommentAdded={handleCommentAdded} 
        />
        
        {/* Comment List */}
        <CommentList key={commentRefreshKey} articleId={article.id} />
      </div>
    </div>
  );
};

export default ArticleDetail;
