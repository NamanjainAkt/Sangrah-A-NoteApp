import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import {
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
  getTagUsage,
  selectAllTags,
  selectTagUsage,
  selectTagsStatus,
  selectTagsError,
  addTagToNote,
  removeTagFromNote,
} from '../store/tagsSlice';
import { incrementStat, checkBadges } from '../store/gamificationSlice';

/**
 * Custom hook for managing tags
 * Provides tag management, filtering, and CRUD operations
 */
const useTags = () => {
  const dispatch = useDispatch();

  // Select state from Redux
  const tags = useSelector(selectAllTags);
  const tagUsage = useSelector(selectTagUsage);
  const status = useSelector(selectTagsStatus);
  const error = useSelector(selectTagsError);

  // Fetch all tags
  const fetchAllTags = useCallback(async () => {
    try {
      await dispatch(fetchTags()).unwrap();
      return tags;
    } catch (err) {
      console.error('Error fetching tags:', err);
      throw err;
    }
  }, [dispatch, tags]);

  // Create a new tag
  const createNewTag = useCallback(async (tagData) => {
    try {
      const result = await dispatch(createTag(tagData)).unwrap();
      toast.success(`Tag "${tagData.name}" created successfully`);
      dispatch(incrementStat('tagsCreated'));
      dispatch(checkBadges());
      return result;
    } catch (err) {
      if (err !== 'Tag with this name already exists') {
        toast.error(`Failed to create tag: ${err}`);
      }
      throw err;
    }
  }, [dispatch]);

  // Update an existing tag
  const updateExistingTag = useCallback(async (tagId, updates) => {
    try {
      const result = await dispatch(updateTag({ tagId, updates })).unwrap();
      toast.success('Tag updated successfully');
      return result;
    } catch (err) {
      if (err !== 'Tag with this name already exists') {
        toast.error(`Failed to update tag: ${err}`);
      }
      throw err;
    }
  }, [dispatch]);

  // Delete a tag
  const removeTag = useCallback(async (tagId) => {
    try {
      await dispatch(deleteTag(tagId)).unwrap();
      toast.success('Tag deleted successfully');
      return true;
    } catch (err) {
      toast.error(`Failed to delete tag: ${err}`);
      throw err;
    }
  }, [dispatch]);

  // Get tag usage statistics
  const fetchTagUsage = useCallback(async () => {
    try {
      await dispatch(getTagUsage()).unwrap();
    } catch (err) {
      console.error('Error fetching tag usage:', err);
    }
  }, [dispatch]);

  // Add a tag to a note
  const addTag = useCallback((noteId, tagId) => {
    dispatch(addTagToNote({ noteId, tagId }));
  }, [dispatch]);

  // Remove a tag from a note
  const removeTagFromNoteById = useCallback((noteId, tagId) => {
    dispatch(removeTagFromNote({ noteId, tagId }));
  }, [dispatch]);

  // Filter notes by tags
  const filterByTags = useCallback((notes, selectedTagIds) => {
    if (!selectedTagIds || selectedTagIds.length === 0) {
      return notes;
    }

    return notes.filter(note => 
      note.tags && selectedTagIds.some(tagId => note.tags.includes(tagId))
    );
  }, []);

  // Get tags sorted by usage
  const getTagsByUsage = useCallback((limit = null) => {
    const sorted = [...tags].sort((a, b) => b.usageCount - a.usageCount);
    return limit ? sorted.slice(0, limit) : sorted;
  }, [tags]);

  // Get tags sorted alphabetically
  const getTagsAlphabetically = useCallback((limit = null) => {
    const sorted = [...tags].sort((a, b) => a.name.localeCompare(b.name));
    return limit ? sorted.slice(0, limit) : sorted;
  }, [tags]);

  // Search tags by name
  const searchTags = useCallback((query) => {
    if (!query || !query.trim()) {
      return tags;
    }

    const lowerQuery = query.toLowerCase();
    return tags.filter(tag => 
      tag.name.toLowerCase().includes(lowerQuery)
    );
  }, [tags]);

  // Get tag color
  const getTagColor = useCallback((tagId) => {
    const tag = tags.find(t => t.id === tagId);
    return tag ? tag.color : '#6B7280'; // Default gray
  }, [tags]);

  // Get tag by ID
  const getTagById = useCallback((tagId) => {
    return tags.find(t => t.id === tagId);
  }, [tags]);

  // Get tag by name
  const getTagByName = useCallback((name) => {
    return tags.find(t => t.name.toLowerCase() === name.toLowerCase());
  }, [tags]);

  // Check if tag name exists
  const isTagNameExists = useCallback((name, excludeId = null) => {
    return tags.some(tag => 
      tag.name.toLowerCase() === name.toLowerCase() && 
      tag.id !== excludeId
    );
  }, [tags]);

  // Get popular tags (most used)
  const getPopularTags = useCallback((limit = 5) => {
    return getTagsByUsage(limit);
  }, [getTagsByUsage]);

  // Get unused tags
  const getUnusedTags = useCallback(() => {
    return tags.filter(tag => tag.usageCount === 0);
  }, [tags]);

  // Get tags for a specific note
  const getNoteTags = useCallback((note) => {
    if (!note || !note.tags || note.tags.length === 0) {
      return [];
    }

    return note.tags.map(tagId => getTagById(tagId)).filter(Boolean);
  }, [getTagById]);

  // Create or get existing tag
  const createOrGetTag = useCallback(async (tagData) => {
    // Check if tag with same name exists
    const existingTag = getTagByName(tagData.name);
    if (existingTag) {
      return existingTag;
    }

    // Create new tag
    return await createNewTag(tagData);
  }, [getTagByName, createNewTag]);

  // Bulk update tag usage
  const updateTagUsageBatch = useCallback((usageData) => {
    Object.entries(usageData).forEach(([tagId, count]) => {
      dispatch(updateTagUsage({ tagId, count }));
    });
  }, [dispatch]);

  return {
    // State
    tags,
    tagUsage,
    status,
    error,
    
    // Actions
    fetchAllTags,
    createNewTag,
    updateExistingTag,
    removeTag,
    fetchTagUsage,
    addTag,
    removeTagFromNoteById,
    
    // Filtering & Search
    filterByTags,
    searchTags,
    
    // Helpers
    getTagsByUsage,
    getTagsAlphabetically,
    getTagColor,
    getTagById,
    getTagByName,
    isTagNameExists,
    getPopularTags,
    getUnusedTags,
    getNoteTags,
    createOrGetTag,
    updateTagUsageBatch,
    
    // Computed
    hasTags: tags.length > 0,
    tagCount: tags.length,
    totalUsage: Object.values(tagUsage).reduce((a, b) => a + b, 0),
  };
};

export default useTags;