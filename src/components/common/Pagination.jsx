import React from 'react';

const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  const MAX_VISIBLE_PAGES = 10;

  const getPageNumbers = () => {
    const pageNumbers = [];
    const halfVisible = Math.floor(MAX_VISIBLE_PAGES / 2);
    
    let startPage = Math.max(1, currentPage - halfVisible);
    let endPage = Math.min(totalPages, startPage + MAX_VISIBLE_PAGES - 1);
    
    if (endPage - startPage + 1 < MAX_VISIBLE_PAGES) {
      startPage = Math.max(1, endPage - MAX_VISIBLE_PAGES + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }
    
    return pageNumbers;
  };

  const pageNumbers = getPageNumbers();

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

  const handleFirst = () => {
    onPageChange(1);
  };

  const handleLast = () => {
    onPageChange(totalPages);
  };

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-2 my-16 py-8">
      {/* 첫 페이지 */}
      <button
        onClick={handleFirst}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 dark:bg-[#1e293b] dark:hover:bg-[#2d3748] dark:text-gray-500 dark:hover:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-150"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
        </svg>
      </button>

      {/* 이전 페이지 */}
      <button
        onClick={handlePrevious}
        disabled={currentPage === 1}
        className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 dark:bg-[#1e293b] dark:hover:bg-[#2d3748] dark:text-gray-500 dark:hover:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-150"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 페이지 번호들 */}
      <div className="flex gap-2">
        {pageNumbers.map(number => (
          <button
            key={number}
            onClick={() => onPageChange(number)}
            className={`
              flex items-center justify-center min-w-9 h-9 px-3 rounded-md transition-all duration-150 cursor-pointer
              ${currentPage === number
                ? 'bg-blue-600 text-white font-medium dark:bg-[#3b4a5a]'
                : 'bg-gray-200 hover:bg-gray-300 text-gray-700 hover:text-gray-900 dark:bg-[#1e293b] dark:hover:bg-[#2d3748] dark:text-gray-500 dark:hover:text-gray-400'
              }
            `}
          >
            {number}
          </button>
        ))}
      </div>

      {/* 다음 페이지 */}
      <button
        onClick={handleNext}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 dark:bg-[#1e293b] dark:hover:bg-[#2d3748] dark:text-gray-500 dark:hover:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-150"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 마지막 페이지 */}
      <button
        onClick={handleLast}
        disabled={currentPage === totalPages}
        className="flex items-center justify-center w-9 h-9 rounded-md bg-gray-200 hover:bg-gray-300 text-gray-600 hover:text-gray-800 dark:bg-[#1e293b] dark:hover:bg-[#2d3748] dark:text-gray-500 dark:hover:text-gray-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all duration-150"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default Pagination;