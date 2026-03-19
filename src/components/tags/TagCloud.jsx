import React from 'react';
import { useSelector } from 'react-redux';
import { selectAllTags } from '../../store/tagsSlice';
import useTags from '../../hooks/useTags';

/**
 * TagCloud Component
 * Visual display of popular tags with size based on usage
 */
const TagCloud = ({ 
  onTagClick, 
  maxTags = 10,
  className = '',
}) => {
  const allTags = useSelector(selectAllTags);
  const { getPopularTags } = useTags();

  const popularTags = getPopularTags(maxTags);

  // Calculate font size based on usage
  const getFontSize = (usage, maxUsage) => {
    if (maxUsage === 0) return 'text-sm';
    const ratio = usage / maxUsage;
    if (ratio > 0.8) return 'text-lg';
    if (ratio > 0.6) return 'text-base';
    if (ratio > 0.4) return 'text-sm';
    return 'text-xs';
  };

  // Get max usage for scaling
  const maxUsage = popularTags.length > 0 
    ? Math.max(...popularTags.map(t => t.usageCount)) 
    : 0;

  // Get color intensity based on usage
  const getOpacity = (usage, maxUsage) => {
    if (maxUsage === 0) return '0.5';
    const ratio = usage / maxUsage;
    return Math.max(0.5, ratio).toFixed(2);
  };

  if (popularTags.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <span className="material-symbols-outlined text-3xl text-gray-600 mb-2">
          label
        </span>
        <p className="text-gray-500 text-sm">No tags yet</p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <h4 className="text-white font-medium mb-3 flex items-center gap-2">
        <span className="material-symbols-outlined text-sm">local_offer</span>
        Popular Tags
      </h4>
      
      <div className="flex flex-wrap gap-2">
        {popularTags.map(tag => (
          <button
            key={tag.id}
            onClick={() => onTagClick?.(tag.id)}
            className="inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all hover:scale-105 min-h-[32px] text-sm sm:text-base"
            style={{
              backgroundColor: `${tag.color}${Math.floor(getOpacity(tag.usageCount, maxUsage) * 255).toString(16).padStart(2, '0')}`,
            }}
            aria-label={`Filter by ${tag.name}`}
          >
            <span 
              className={`font-medium text-white truncate ${getFontSize(tag.usageCount, maxUsage)}`}
            >
              {tag.name}
            </span>
            {tag.usageCount > 0 && (
              <span className="text-xs text-white/70 bg-black/20 px-1 sm:px-1.5 py-0.5 rounded-full flex-shrink-0">
                {tag.usageCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {allTags.length > maxTags && (
        <p className="text-gray-500 text-xs mt-3 text-center">
          +{allTags.length - maxTags} more tags
        </p>
      )}
    </div>
  );
};

export default TagCloud;