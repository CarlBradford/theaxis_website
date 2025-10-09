import React from 'react';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import './pagination.css';

const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  itemsPerPage = 20,
  totalItems
}) => {
  // Don't show pagination if there's only one page or no items
  if (totalPages <= 1) return null;

  // Calculate start and end item numbers for display
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5; // Show max 5 page numbers
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show pages around current page
      let startPage = Math.max(1, currentPage - 2);
      let endPage = Math.min(totalPages, currentPage + 2);
      
      // Adjust if we're near the beginning or end
      if (currentPage <= 3) {
        endPage = Math.min(5, totalPages);
      } else if (currentPage >= totalPages - 2) {
        startPage = Math.max(1, totalPages - 4);
      }
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="pagination-container">
      {/* Pagination controls */}
      <div className="pagination-controls">
        {/* Previous button */}
        <button
          className="pagination-btn pagination-nav"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          aria-label="Previous page"
        >
          <ChevronLeftIcon className="pagination-nav-icon" />
        </button>

        {/* Page numbers */}
        <div className="pagination-pages">
          {/* First page + ellipsis if needed */}
          {totalPages > 7 && currentPage > 4 && (
            <>
              <button
                className="pagination-btn pagination-page"
                onClick={() => onPageChange(1)}
              >
                1
              </button>
              {currentPage > 5 && (
                <span className="pagination-ellipsis">...</span>
              )}
            </>
          )}

          {/* Page number buttons */}
          {pageNumbers.map(pageNum => (
            <button
              key={pageNum}
              className={`pagination-btn pagination-page ${
                pageNum === currentPage ? 'active' : ''
              }`}
              onClick={() => onPageChange(pageNum)}
              aria-label={`Page ${pageNum}`}
              aria-current={pageNum === currentPage ? 'page' : undefined}
            >
              {pageNum}
            </button>
          ))}

          {/* Last page + ellipsis if needed */}
          {totalPages > 7 && currentPage < totalPages - 3 && (
            <>
              {currentPage < totalPages - 4 && (
                <span className="pagination-ellipsis">...</span>
              )}
              <button
                className="pagination-btn pagination-page"
                onClick={() => onPageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>

        {/* Next button */}
        <button
          className="pagination-btn pagination-nav"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          aria-label="Next page"
        >
          <ChevronRightIcon className="pagination-nav-icon" />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
