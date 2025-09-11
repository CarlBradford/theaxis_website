import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { articlesAPI } from '../services/apiService';
import { 
  DocumentTextIcon,
  PhotoIcon,
  TagIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  PaperAirplaneIcon
} from '@heroicons/react/24/outline';

const CreateArticle = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    excerpt: '',
    content: '',
    featuredImage: '',
    tags: '',
    status: 'draft'
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Convert tags string to array
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const articleData = {
        ...formData,
        tags: tagsArray
      };

      const response = await articlesAPI.createArticle(articleData);
      
      if (response.data) {
        navigate('/articles/my');
      }
    } catch (error) {
      console.error('Failed to create article:', error);
      setError(error.response?.data?.message || 'Failed to create article');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    setError('');
    setLoading(true);

    try {
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const articleData = {
        ...formData,
        status: 'draft',
        tags: tagsArray
      };

      await articlesAPI.createArticle(articleData);
      navigate('/articles/my');
    } catch (error) {
      console.error('Failed to save draft:', error);
      setError(error.response?.data?.message || 'Failed to save draft');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/articles/my')}
            className="p-2 text-secondary hover:text-primary hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-primary">Create Article</h1>
            <p className="text-secondary">Write and publish your article</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`btn-secondary ${showPreview ? 'bg-gray-600' : ''}`}
          >
            {showPreview ? (
              <>
                <EyeSlashIcon className="h-4 w-4 mr-2" />
                Hide Preview
              </>
            ) : (
              <>
                <EyeIcon className="h-4 w-4 mr-2" />
                Preview
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit}>
            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-primary mb-2">
                Article Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="form-input"
                placeholder="Enter your article title..."
              />
            </div>

            {/* Excerpt */}
            <div className="mb-6">
              <label htmlFor="excerpt" className="block text-sm font-medium text-primary mb-2">
                Excerpt
              </label>
              <textarea
                id="excerpt"
                name="excerpt"
                value={formData.excerpt}
                onChange={handleChange}
                rows={3}
                className="form-input"
                placeholder="Brief description of your article..."
              />
            </div>

            {/* Content */}
            <div className="mb-6">
              <label htmlFor="content" className="block text-sm font-medium text-primary mb-2">
                Article Content *
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows={15}
                className="form-input"
                placeholder="Write your article content here..."
              />
              <p className="mt-1 text-sm text-secondary">
                You can use basic HTML tags for formatting.
              </p>
            </div>

            {/* Featured Image */}
            <div className="mb-6">
              <label htmlFor="featuredImage" className="block text-sm font-medium text-primary mb-2">
                Featured Image URL
              </label>
              <input
                type="url"
                id="featuredImage"
                name="featuredImage"
                value={formData.featuredImage}
                onChange={handleChange}
                className="form-input"
                placeholder="https://example.com/image.jpg"
              />
            </div>

            {/* Tags */}
            <div className="mb-6">
              <label htmlFor="tags" className="block text-sm font-medium text-primary mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className="form-input"
                placeholder="tag1, tag2, tag3"
              />
              <p className="mt-1 text-sm text-secondary">
                Separate tags with commas.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={loading || !formData.title || !formData.content}
                className="btn-secondary"
              >
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Save as Draft
              </button>
              
              <button
                type="submit"
                disabled={loading || !formData.title || !formData.content}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Publishing...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Publish Article
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar */}
        <div>
          {/* Status */}
          <div className="card mb-6">
            <h3 className="text-lg font-medium text-primary mb-3">Publishing Status</h3>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="form-input"
            >
              <option value="draft">Draft</option>
              <option value="pending">Submit for Review</option>
            </select>
            <p className="mt-2 text-sm text-secondary">
              Choose "Submit for Review" to send your article for approval.
            </p>
          </div>

          {/* Preview */}
          {showPreview && (
            <div className="card mb-6">
              <h3 className="text-lg font-medium text-primary mb-3">Preview</h3>
              <div>
                {formData.title && (
                  <div className="mb-3">
                    <h4 className="font-semibold text-primary">{formData.title}</h4>
                  </div>
                )}
                {formData.excerpt && (
                  <div className="mb-3">
                    <p className="text-sm text-secondary">{formData.excerpt}</p>
                  </div>
                )}
                {formData.featuredImage && (
                  <div className="mb-3">
                    <img
                      src={formData.featuredImage}
                      alt="Featured"
                      className="w-full h-32 object-cover rounded"
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
                {formData.content && (
                  <div>
                    <div className="text-sm text-primary whitespace-pre-wrap">
                      {formData.content.substring(0, 200)}
                      {formData.content.length > 200 && '...'}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="card">
            <h3 className="text-lg font-medium text-primary mb-3">Writing Tips</h3>
            <ul className="text-sm text-secondary">
              <li className="mb-2">• Write a compelling title that grabs attention</li>
              <li className="mb-2">• Include a clear excerpt to summarize your article</li>
              <li className="mb-2">• Use proper formatting for better readability</li>
              <li className="mb-2">• Add relevant tags to help readers find your content</li>
              <li>• Choose an engaging featured image</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateArticle;
