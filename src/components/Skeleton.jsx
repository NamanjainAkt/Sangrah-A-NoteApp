import React from 'react';

/**
 * Skeleton Component
 * Displays animated skeleton loading placeholders
 * Props:
 * - className: additional classes
 * - variant: 'text' | 'rectangular' | 'circular' (default: 'rectangular')
 * - width: width class (default: 'w-full')
 * - height: height class (default: 'h-4')
 */
const Skeleton = ({
  className = '',
  variant = 'rectangular',
  width = 'w-full',
  height = 'h-4'
}) => {
  const baseClasses = 'animate-pulse bg-gray-700';

  const variantClasses = {
    text: 'rounded',
    rectangular: 'rounded',
    circular: 'rounded-full'
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${width} ${height} ${className}`}
    />
  );
};

export default Skeleton;