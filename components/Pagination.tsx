import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  limit?: number;
  onLimitChange?: (limit: number) => void;
  totalItems?: number;
}

const Pagination: React.FC<PaginationProps> = ({ currentPage, totalPages, onPageChange, limit, onLimitChange, totalItems }) => {
  // If there are no pages and no limit selector needed (or no data), we might want to hide it.
  // But if we have a limit selector, we might want to show it even if totalPages is 1.
  // However, if totalPages is 0 (no data), we probably shouldn't show pagination controls, 
  // BUT we might still want to show the limit selector if the user wants to change limit for empty state? 
  // Usually if empty, no need. Let's say if totalPages < 1, return null.
  if (totalPages < 1) return null;

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5; // Adjust as needed

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first, last, and pages around current
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  const startItem = limit ? (currentPage - 1) * limit + 1 : 1;
  const endItem = limit && totalItems ? Math.min(currentPage * limit, totalItems) : totalItems;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
      {/* Limit Selector & Info */}
      <div className="flex items-center space-x-4">
        {limit && onLimitChange && (
          <div className="flex items-center space-x-2 text-body-sm text-neutral-600">
            <span>Show</span>
            <select
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
              className="rounded-md border border-neutral-300 py-1 px-2 focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none bg-white"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>items</span>
          </div>
        )}

        {totalItems !== undefined && (
          <span className="text-body-sm text-neutral-500">
            Showing {startItem} to {endItem} of {totalItems} entries
          </span>
        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center space-x-2">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Previous
        </button>

        {getPageNumbers().map((page, index) => (
          <React.Fragment key={index}>
            {page === '...' ? (
              <span className="px-2 text-neutral-400">...</span>
            ) : (
              <button
                onClick={() => onPageChange(Number(page))}
                className={`px-3 py-1 rounded-md border transition-colors ${currentPage === page
                  ? 'bg-primary-500 text-white border-primary-500'
                  : 'border-neutral-300 text-neutral-600 hover:bg-neutral-100'
                  }`}
              >
                {page}
              </button>
            )}
          </React.Fragment>
        ))}

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md border border-neutral-300 text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default Pagination;
