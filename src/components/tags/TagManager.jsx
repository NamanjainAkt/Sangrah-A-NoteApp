import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { HexColorPicker } from 'react-colorful';
import useTags from '../../hooks/useTags';
import { selectAllTags } from '../../store/tagsSlice';
import { toast } from 'react-toastify';

/**
 * TagManager Component
 * CRUD interface for managing tags with color picker
 */
const TagManager = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const allTags = useSelector(selectAllTags);
  const { updateExistingTag, removeTag } = useTags();
  
  const [editingTag, setEditingTag] = useState(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('#3B82F6');
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Tag colors palette for quick selection
  const colorPalette = [
    '#EF4444', '#F97316', '#EAB308', '#22C55E', '#14B8A6',
    '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
  ];

  const handleEditStart = (tag) => {
    setEditingTag(tag);
    setEditName(tag.name);
    setEditColor(tag.color);
    setShowColorPicker(false);
  };

  const handleSave = async () => {
    if (!editName.trim()) {
      toast.error('Tag name cannot be empty');
      return;
    }

    try {
      await updateExistingTag(editingTag.id, {
        name: editName.trim(),
        color: editColor,
      });
      setEditingTag(null);
      setEditName('');
      setEditColor('#3B82F6');
      toast.success('Tag updated successfully');
    } catch (error) {
      toast.error('Failed to update tag');
    }
  };

  const handleCancelEdit = () => {
    setEditingTag(null);
    setEditName('');
    setEditColor('#3B82F6');
    setShowColorPicker(false);
    setDeleteConfirm(null);
  };

  const handleDelete = async (tagId) => {
    try {
      await removeTag(tagId);
      setDeleteConfirm(null);
      toast.success('Tag deleted successfully');
    } catch (error) {
      toast.error('Failed to delete tag');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#171717] rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-700">
          <h3 className="text-xl font-semibold text-white">Manage Tags</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-gray-700 flex items-center justify-center transition-colors"
          >
            <span className="material-symbols-outlined text-gray-400">close</span>
          </button>
        </div>

        {/* Tags List */}
        <div className="flex-1 overflow-y-auto p-6">
          {allTags.length === 0 ? (
            <div className="text-center py-12">
              <span className="material-symbols-outlined text-4xl text-gray-600 mb-3">
                label
              </span>
              <p className="text-gray-400">No tags created yet</p>
              <p className="text-gray-500 text-sm mt-1">
                Create tags when editing notes
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {allTags
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(tag => (
                  <div
                    key={tag.id}
                    className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      editingTag?.id === tag.id 
                        ? 'bg-gray-800' 
                        : 'bg-[#1f1f1f] hover:bg-gray-800'
                    }`}
                  >
                    {editingTag?.id === tag.id ? (
                      // Edit Mode
                      <>
                        <div className="relative">
                          <button
                            onClick={() => setShowColorPicker(!showColorPicker)}
                            className="w-8 h-8 rounded-full border-2 border-gray-600"
                            style={{ backgroundColor: editColor }}
                          />
                          {showColorPicker && (
                            <div className="absolute top-10 left-0 z-10">
                              <div 
                                className="fixed inset-0" 
                                onClick={() => setShowColorPicker(false)} 
                              />
                              <div className="relative z-20">
                                <HexColorPicker 
                                  color={editColor} 
                                  onChange={setEditColor} 
                                />
                                <div className="mt-2 flex gap-1">
                                  {colorPalette.map(color => (
                                    <button
                                      key={color}
                                      onClick={() => {
                                        setEditColor(color);
                                        setShowColorPicker(false);
                                      }}
                                      className={`w-6 h-6 rounded-full ${editColor === color ? 'ring-2 ring-white' : ''}`}
                                      style={{ backgroundColor: color }}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-2 bg-gray-700 rounded-lg text-white outline-none focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        
                        <button
                          onClick={handleSave}
                          className="p-2 text-green-500 hover:bg-green-500/10 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined">check</span>
                        </button>
                        
                        <button
                          onClick={handleCancelEdit}
                          className="p-2 text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
                        >
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      </>
                    ) : (
                      // View Mode
                      <>
                        <span
                          className="w-4 h-4 rounded-full flex-shrink-0"
                          style={{ backgroundColor: tag.color }}
                        />
                        
                        <div className="flex-1">
                          <p className="text-white font-medium">{tag.name}</p>
                          <p className="text-gray-500 text-xs">
                            Used in {tag.usageCount} {tag.usageCount === 1 ? 'note' : 'notes'}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditStart(tag)}
                            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                            aria-label="Edit tag"
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          
                          {deleteConfirm === tag.id ? (
                            <>
                              <button
                                onClick={() => handleDelete(tag.id)}
                                className="px-3 py-1 text-sm text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              >
                                Delete
                              </button>
                              <button
                                onClick={() => setDeleteConfirm(null)}
                                className="px-3 py-1 text-sm text-gray-400 hover:bg-gray-700 rounded-lg transition-colors"
                              >
                                Cancel
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirm(tag.id)}
                              className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                              aria-label="Delete tag"
                            >
                              <span className="material-symbols-outlined">delete</span>
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <p className="text-gray-500 text-xs text-center">
            Tip: You can also create new tags directly when editing a note
          </p>
        </div>
      </div>
    </div>
  );
};

export default TagManager;