import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';
import PublicPageHeader from '../../components/PublicPageHeader';
import PublicFooter from '../../components/PublicFooter';
import flipbookService from '../../services/flipbookService';
import usePageTitle from '../../hooks/usePageTitle';
import './annual-editions.css';

const AnnualEditions = () => {
  usePageTitle('Annual Editions');
  
  const [flipbooks, setFlipbooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFlipbook, setSelectedFlipbook] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Category configuration
  const categories = [
    {
      key: 'MAGAZINE',
      title: 'STATUS QUO - The AXIS Magazine',
      description: 'Our flagship magazine featuring in-depth articles, interviews, and comprehensive coverage of current events and issues.'
    },
    {
      key: 'NEWSLETTER',
      title: 'The AXIS NEWSLETTER',
      description: 'Regular updates and news from The AXIS, keeping our community informed about the latest developments.'
    },
    {
      key: 'TABLOID',
      title: 'Ang TALUHOG - The AXIS Tabloid',
      description: 'Quick reads and breaking news in a tabloid format, delivering information in an accessible and engaging way.'
    },
    {
      key: 'LITERARY_FOLIO',
      title: 'The AXIS LITERARY FOLIO',
      description: 'A collection of literary works, creative writing, poetry, and artistic expressions from our talented contributors.'
    },
    {
      key: 'ART_COMPILATION',
      title: 'The AXIS ART COMPILATION',
      description: 'Showcasing visual arts, photography, illustrations, and creative works from our artistic community.'
    },
    {
      key: 'SPECIAL_EDITIONS',
      title: 'Special Editions',
      description: 'Unique and special publications that don\'t fit into our regular categories, featuring exclusive content and special themes.'
    }
  ];

  useEffect(() => {
    fetchFlipbooks();
  }, []);

  const fetchFlipbooks = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch all published flipbooks (public endpoint)
      const response = await flipbookService.getPublicFlipbooks({
        limit: 100, // Get all flipbooks
        sortBy: 'releaseDate',
        sortOrder: 'desc'
      });

      if (response.success) {
        const flipbooks = response.data.items || [];
        // Additional client-side sorting to ensure proper order
        const sortedFlipbooks = flipbooks.sort((a, b) => {
          // Handle null releaseDate values
          const aDate = a.releaseDate ? new Date(a.releaseDate) : new Date(a.createdAt);
          const bDate = b.releaseDate ? new Date(b.releaseDate) : new Date(b.createdAt);
          
          // Sort by releaseDate (or createdAt if releaseDate is null) in descending order
          return bDate - aDate;
        });
        setFlipbooks(sortedFlipbooks);
      } else {
        setError('Failed to fetch flipbooks');
      }
    } catch (err) {
      console.error('Error fetching flipbooks:', err);
      setError('Error loading flipbooks');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (flipbook) => {
    setSelectedFlipbook(flipbook);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedFlipbook(null);
    setIsModalOpen(false);
  };

  // Group flipbooks by category
  const groupedFlipbooks = categories.reduce((acc, category) => {
    acc[category.key] = flipbooks.filter(flipbook => flipbook.type === category.key);
    return acc;
  }, {});

  // Generate placeholder thumbnail for flipbooks without thumbnails
  const getPlaceholderThumbnail = (type) => {
    const typeColors = {
      'NEWSLETTER': '#3B82F6',
      'TABLOID': '#F59E0B',
      'MAGAZINE': '#10B981',
      'LITERARY_FOLIO': '#8B5CF6',
      'ART_COMPILATION': '#EC4899',
      'SPECIAL_EDITIONS': '#EF4444'
    };
    
    const typeIcons = {
      'NEWSLETTER': '📰',
      'TABLOID': '📰',
      'MAGAZINE': '📖',
      'LITERARY_FOLIO': '📚',
      'ART_COMPILATION': '🎨',
      'SPECIAL_EDITIONS': '⭐'
    };
    
    const color = typeColors[type] || '#6B7280';
    const icon = typeIcons[type] || '📄';
    
    return (
      <div 
        className="placeholder-thumbnail"
        style={{ backgroundColor: color }}
      >
        <span className="placeholder-icon">{icon}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="annual-editions-page">
        <PublicPageHeader />
        <div className="annual-editions-container">
          <div className="annual-editions-header">
            <h1 className="annual-editions-title">THE ANNUAL EDITIONS</h1>
          </div>
          <div className="annual-editions-skeleton-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flipbook-card skeleton">
                <div className="flipbook-thumbnail-skeleton"></div>
                <div className="flipbook-info-skeleton">
                  <div className="flipbook-line-skeleton"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  if (error) {
    return (
      <div className="annual-editions-page">
        <PublicPageHeader />
        <div className="annual-editions-container">
          <div className="annual-editions-header">
            <h1 className="annual-editions-title">THE ANNUAL EDITIONS</h1>
          </div>
          <div className="error-container">
            <p className="error-message">{error}</p>
            <button onClick={fetchFlipbooks} className="retry-button">
              Try Again
            </button>
          </div>
        </div>
        <PublicFooter />
      </div>
    );
  }

  return (
    <div className="annual-editions-page">
      <PublicPageHeader />
      <div className="annual-editions-container">
        <div className="annual-editions-header">
          <h1 className="annual-editions-title">THE ANNUAL EDITIONS</h1>
        </div>

        <div className="annual-editions-content">
          {categories.map((category) => {
            const categoryFlipbooks = groupedFlipbooks[category.key] || [];
            
            return (
              <div key={category.key} className="category-section">
                <div className="category-header">
                  <h2 className="category-title">{category.title}</h2>
                  <div className="category-separator"></div>
                </div>
                
                {categoryFlipbooks.length > 0 ? (
                  <div className="flipbooks-grid">
                    {categoryFlipbooks.map((flipbook) => (
                      <div 
                        key={flipbook.id} 
                        className="flipbook-card"
                        onClick={() => openModal(flipbook)}
                      >
                        <div className="flipbook-thumbnail">
                          {flipbook.thumbnailUrl ? (
                            <img 
                              src={flipbook.thumbnailUrl.startsWith('http') ? flipbook.thumbnailUrl : `http://localhost:3001${flipbook.thumbnailUrl}`}
                              alt={flipbook.name}
                              className="flipbook-image"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div style={{ display: flipbook.thumbnailUrl ? 'none' : 'flex' }}>
                            {getPlaceholderThumbnail(flipbook.type)}
                          </div>
                        </div>
                        <div className="flipbook-info">
                          <h3 className="flipbook-name">{flipbook.name}</h3>
                        </div>
                        <div className="flipbook-overlay">
                          <div className="view-indicator">
                            <span>Click to View</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-flipbooks">
                    <p>No publications available in this category yet.</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Modal */}
      {isModalOpen && selectedFlipbook && (
        <div className="flipbook-modal-overlay" onClick={closeModal}>
          <div className="flipbook-modal" onClick={(e) => e.stopPropagation()}>
            <div className="flipbook-modal-header">
              <h2 className="flipbook-modal-title">{selectedFlipbook.name}</h2>
              <button 
                className="flipbook-modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
            <div className="flipbook-modal-content">
              <iframe
                src={selectedFlipbook.embedUrl}
                title={selectedFlipbook.name}
                className="flipbook-iframe"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
      
      <PublicFooter />
    </div>
  );
};

export default AnnualEditions;
