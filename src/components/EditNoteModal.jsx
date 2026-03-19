import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateExistingNote } from '../store/notesSlice';
import TaskList from './TaskList';
import TagSelector from './tags/TagSelector';
import DueDatePicker from './reminders/DueDatePicker';

const EditNoteModal = ({ note, onClose }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState([]);
    const [dueDate, setDueDate] = useState(null);
    const dispatch = useDispatch();
    const { enableTodoChecklists, enableTags, enableReminders } = useSelector(state => state.settings);

    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content);
            setTags(note.tags || []);
            setDueDate(note.dueDate || null);
        }
    }, [note]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(updateExistingNote({ 
            noteId: note.$id, 
            noteData: { 
                title, 
                content,
                tags,
                dueDate,
            } 
        }));
        onClose();
    };

    if (!note) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-4">Edit Note</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full bg-[#2a2a2a] text-white p-2 rounded mb-4"
                        placeholder="Title"
                    />
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="w-full bg-[#2a2a2a] text-white p-2 rounded mb-4"
                        placeholder="Content"
                        rows="4"
                    ></textarea>
                    
                    {/* Tags Section */}
                    {enableTags && (
                        <div className="mb-4">
                            <label className="block text-gray-400 text-sm mb-2">Tags</label>
                            <TagSelector 
                                selectedTags={tags}
                                onTagsChange={setTags}
                                noteId={note.$id}
                            />
                        </div>
                    )}

                    {/* Due Date Section */}
                    {enableReminders && (
                        <div className="mb-4">
                            <DueDatePicker 
                                value={dueDate}
                                onChange={setDueDate}
                                onRemove={() => setDueDate(null)}
                            />
                        </div>
                    )}
                    
                    {/* Task List Section */}
                    {enableTodoChecklists && (
                        <div className="mb-4">
                            <TaskList 
                                tasks={note.tasks || []} 
                                noteId={note.$id} 
                                enabled={enableTodoChecklists} 
                            />
                        </div>
                    )}
                    
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors">
                            Save
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditNoteModal;