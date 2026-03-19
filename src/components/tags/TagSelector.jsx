import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import useTags from '../../hooks/useTags';
import { selectAllTags } from '../../store/tagsSlice';

/**
 * TagSelector Component
 * Multi-select dropdown for adding tags to notes with autocomplete
 */
const TagSelector = ({ 
  selectedTags = [], 
  onTagsChange,
  noteId,
  className = '',
}) => {
  const dispatch = useDispatch();
  const allTags = useSelector(selectAllTags);
  const { searchTags, createNewTag } = useTags();
  
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Tag colors palette
  const tagColors = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
    '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280', '#FFFFFF',
  ];

  // Filter tags based on search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return allTags;
    return searchTags(searchQuery);
  }, [allTags, searchQuery, searchTags]);

  // Get unselected tags for dropdown
  const availableTags = useMemo(() => {
    return filteredTags.filter(tag => !selectedTags.includes(tag.id));
  }, [filteredTags, selectedTags]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Focus input when dropdown opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleTagToggle = useCallback((tagId) => {
    if (selectedTags.includes(tagId)) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  }, [selectedTags, onTagsChange]);

  // Keyboard navigation for dropdown
  const handleDropdownKeyDown = useCallback((event) => {
    if (!isOpen) return;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        // Focus first available tag
        const firstTag = dropdownRef.current.querySelector('[data-tag-item]:not([aria-disabled="true"])');
        firstTag?.focus();
        break;
      case 'ArrowUp':
        event.preventDefault();
        // Focus last available tag
        const tags = dropdownRef.current.querySelectorAll('[data-tag-item]:not([aria-disabled="true"])');
        const lastTag = tags[tags.length - 1];
        lastTag?.focus();
        break;
      case 'Home':
        event.preventDefault();
        const homeTag = dropdownRef.current.querySelector('[data-tag-item]:not([aria-disabled="true"])');
        homeTag?.focus();
        break;
      case 'End':
        event.preventDefault();
        const endTags = dropdownRef.current.querySelectorAll('[data-tag-item]:not([aria-disabled="true"])');
        const endTag = endTags[endTags.length - 1];
        endTag?.focus();
        break;
      case 'Escape':
        setIsOpen(false);
        inputRef.current?.focus();
        break;
    }
  }, [isOpen]);

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;

    setIsCreating(true);
    try {
      const newTag = await createNewTag({
        name: newTagName.trim(),
        color: newTagColor,
      });
      
      // Auto-select the new tag
      if (!selectedTags.includes(newTag.id)) {
        onTagsChange([...selectedTags, newTag.id]);
      }
      
      // Reset creation state
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setIsCreating(false);
    } catch (error) {
      setIsCreating(false);
    }
  };

  // Get tag info by ID
  const getTagInfo = (tagId) => {
    return allTags.find(tag => tag.id === tagId);
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Selected Tags Display */}
      <div 
        className="flex flex-wrap gap-2 p-2 bg-[#171717] rounded-lg cursor-pointer min-h-[48px] focus:outline-none focus:ring-2 focus:ring-blue-500"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={`Tags selector, ${selectedTags.length} selected`}
        tabIndex={0}
      >
        {selectedTags.length === 0 ? (
          <span className="text-gray-500 text-sm py-1">Add tags...</span>
        ) : (
          <>
            {selectedTags.map(tagId => {
              const tag = getTagInfo(tagId);
              if (!tag) return null;
              
              return (
                <span
                  key={tagId}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs text-white"
                  style={{ backgroundColor: tag.color }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTagToggle(tagId);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      e.stopPropagation();
                      handleTagToggle(tagId);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove tag: ${tag.name}`}
                >
                  {tag.name}
                  <span className="material-symbols-outlined text-xs cursor-pointer hover:opacity-70">
                    close
                  </span>
                </span>
              );
            })}
            <span className="sr-only" aria-live="polite" aria-atomic="true">
              {selectedTags.length} tags selected
            </span>
          </>
        )}
        
        <span className="material-symbols-outlined text-gray-400 ml-auto" aria-hidden="true">
          {isOpen ? 'expand_less' : 'expand_more'}
        </span>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div 
          className="absolute z-10 w-full mt-1 bg-[#171717] rounded-lg shadow-xl max-h-64 overflow-hidden"
          onKeyDown={handleDropdownKeyDown}
          role="listbox"
          aria-label="Available tags"
        >
          {/* Search Input */}
          <div className="p-2 border-b border-gray-700">
            <input
              ref={inputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or create tag..."
              className="w-full px-3 py-2 bg-gray-800 rounded-lg text-white text-sm outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Search tags"
              autoComplete="off"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchQuery.trim() && !allTags.find(t => t.name.toLowerCase() === searchQuery.toLowerCase())) {
                  setNewTagName(searchQuery);
                  setNewTagColor(tagColors[Math.floor(Math.random() * tagColors.length)]);
                }
              }}
            />
          </div>

          {/* Create New Tag Option */}
          {searchQuery.trim() && !allTags.find(t => t.name.toLowerCase() === searchQuery.toLowerCase()) && (
            <div className="p-2 border-b border-gray-700">
              <button
                onClick={() => {
                  setNewTagName(searchQuery);
                  setNewTagColor(tagColors[Math.floor(Math.random() * tagColors.length)]);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-800 transition-colors text-left"
              >
                <span className="material-symbols-outlined text-green-500">add</span>
                <span className="text-white text-sm">Create "{searchQuery}"</span>
              </button>
            </div>
          )}

          {/* Tag List */}
          <div 
            className="max-h-40 overflow-y-auto"
            role="group"
            aria-label="Available tags list"
          >
            {availableTags.length === 0 ? (
              <div className="p-4 text-center text-gray-500 text-sm" role="status">
                No tags available
              </div>
            ) : (
              availableTags.map((tag, index) => (
                <button
                  key={tag.id}
                  data-tag-item
                  onClick={() => handleTagToggle(tag.id)}
                  className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-800 transition-colors focus:outline-none focus:bg-gray-800 text-left"
                  role="option"
                  aria-selected={selectedTags.includes(tag.id)}
                  aria-label={`Tag: ${tag.name}, used in ${tag.usageCount} notes`}
                  tabIndex={-1}
                >
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: tag.color }}
                    aria-hidden="true"
                  />
                  <span className="text-white text-sm flex-1 text-left">{tag.name}</span>
                  <span className="text-gray-500 text-xs">{tag.usageCount} notes</span>
                </button>
              ))
            )}
          </div>

          {/* Create New Tag Form */}
          {newTagName && (
            <div className="p-3 border-t border-gray-700 bg-gray-800/50">
              <p className="text-white text-sm mb-2">Create new tag:</p>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white text-sm outline-none"
                />
                <div className="flex gap-1">
                  {tagColors.slice(0, 5).map(color => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-6 h-6 rounded-full ${newTagColor === color ? 'ring-2 ring-white' : ''}`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setNewTagName('')}
                  className="px-3 py-1 rounded-lg bg-gray-700 text-gray-300 text-sm hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTag}
                  disabled={isCreating}
                  className="px-3 py-1 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-500 disabled:opacity-50"
                >
                  {isCreating ? 'Creating...' : 'Create Tag'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TagSelector;