import React from 'react';

/**
 * LoadingSpinner Component
 * Displays a spinning loading indicator
 * Props:
 * - size: 'sm' | 'md' | 'lg' - size of the spinner (default: 'md')
 * - className: additional classes
 */
const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-gray-300 border-t-blue-500 ${sizeClasses[size]} ${className}`} />
  );
};

export default LoadingSpinner;