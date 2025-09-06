import { useState, useEffect } from 'react';
import api from '../services/api';
import { PhotoIcon, TrashIcon, PlusIcon } from '@heroicons/react/24/outline';

const Media = () => {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    altText: '',
    caption: '',
  });

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const response = await api.get('/media');
      setMedia(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to fetch media:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('altText', uploadForm.altText);
    formData.append('caption', uploadForm.caption);

    try {
      await api.post('/media', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      setSelectedFile(null);
      setUploadForm({ altText: '', caption: '' });
      fetchMedia();
    } catch (error) {
      console.error('Failed to upload media:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this media?')) return;

    try {
      await api.delete(`/media/${id}`);
      fetchMedia();
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
      </div>

      {/* Upload Form */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Upload New Media</h2>
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              File
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="input-field"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alt Text
            </label>
            <input
              type="text"
              value={uploadForm.altText}
              onChange={(e) => setUploadForm({ ...uploadForm, altText: e.target.value })}
              className="input-field"
              placeholder="Describe the image for accessibility"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caption
            </label>
            <textarea
              value={uploadForm.caption}
              onChange={(e) => setUploadForm({ ...uploadForm, caption: e.target.value })}
              className="input-field"
              rows={3}
              placeholder="Optional caption for the image"
            />
          </div>
          
          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <PlusIcon className="h-5 w-5" />
            <span>{uploading ? 'Uploading...' : 'Upload Media'}</span>
          </button>
        </form>
      </div>

      {/* Media Grid */}
      <div className="card">
        <h2 className="text-lg font-medium text-gray-900 mb-4">All Media</h2>
        
        {media.length === 0 ? (
          <div className="text-center py-8">
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No media yet</h3>
            <p className="mt-1 text-sm text-gray-500">
              Upload your first image to get started.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {media.map((item) => (
              <div key={item.id} className="group relative">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                  <img
                    src={item.url}
                    alt={item.altText || item.originalName}
                    className="h-full w-full object-cover object-center group-hover:opacity-75"
                  />
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-900 truncate">{item.originalName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                  {item.caption && (
                    <p className="text-xs text-gray-600 mt-1">{item.caption}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="absolute top-2 right-2 bg-red-600 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Media;
