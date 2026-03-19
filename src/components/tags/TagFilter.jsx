import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { selectAllTags } from '../../store/tagsSlice';
import useTags from '../../hooks/useTags';

/**
 * TagFilter Component
 * Filter controls for notes list with multiple tag selection
 */
const TagFilter = ({ 
  selectedTags = [],
  onFilterChange,
  className = '',
}) => {
  const allTags = useSelector(selectAllTags);
  const { getPopularTags } = useTags();
  
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const popularTags = getPopularTags(5);
  const filteredTags = searchQuery 
    ? allTags.filter(tag => tag.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : allTags;

  const handleTagToggle = (tagId) => {
    if (selectedTags.includes(tagId)) {
      onFilterChange(selectedTags.filter(id => id !== tagId));
    } else {
      onFilterChange([...selectedTags, tagId]);
    }
  };

  const handleClearAll = () => {
    onFilterChange([]);
  };

  const getTagInfo = (tagId) => {
    return allTags.find(tag => tag.id === tagId);
  };

  return (
    <div className={`${className}`}>
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-gray-400">filter_list</span>
          <span className="text-white font-medium">Filter by Tags</span>
          {selectedTags.length > 0 && (
            <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
              {selectedTags.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {selectedTags.length > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              Clear all
            </button>
          )}
          <span className="material-symbols-outlined text-gray-400">
            {isExpanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-3 space-y-3">
          {/* Search Input */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tags..."
            className="w-full px-3 py-2 bg-gray-800 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
            onClick={(e) => e.stopPropagation()}
          />

          {/* Selected Tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedTags.map(tagId => {
                const tag = getTagInfo(tagId);
                if (!tag) return null;
                
                return (
                  <button
                    key={tagId}
                    onClick={() => handleTagToggle(tagId)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: tag.color }}
                  >
                    {tag.name}
                    <span className="material-symbols-outlined text-xs">close</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Popular Tags */}
          {searchQuery === '' && popularTags.length > 0 && (
            <div>
              <p className="text-gray-500 text-xs mb-2">Popular</p>
              <div className="flex flex-wrap gap-2">
                {popularTags.map(tag => (
                  <button
                    key={tag.id}
                    onClick={() => handleTagToggle(tag.id)}
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                      selectedTags.includes(tag.id) 
                        ? 'ring-2 ring-white' 
                        : 'hover:ring-1 hover:ring-gray-500'
                    }`}
                    style={{ 
                      backgroundColor: tag.color,
                      opacity: selectedTags.includes(tag.id) ? 1 : 0.8,
                    }}
                  >
                    {tag.name}
                    <span className="text-white/70 text-xs">{tag.usageCount}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All Tags */}
          <div>
            <p className="text-gray-500 text-xs mb-2">
              {searchQuery ? 'Search Results' : 'All Tags'} ({filteredTags.length})
            </p>
            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
              {filteredTags.map(tag => (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
                    selectedTags.includes(tag.id) 
                      ? 'ring-2 ring-white' 
                      : 'hover:ring-1 hover:ring-gray-500'
                  }`}
                  style={{ 
                    backgroundColor: tag.color,
                    opacity: selectedTags.includes(tag.id) ? 1 : 0.8,
                  }}
                >
                  {tag.name}
                  <span className="text-white/70 text-xs">{tag.usageCount}</span>
                </button>
              ))}
            </div>
            
            {filteredTags.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-2">
                No tags found
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TagFilter;