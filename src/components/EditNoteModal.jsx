import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { updateExistingNote } from '../store/notesSlice';

const EditNoteModal = ({ note, onClose }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const dispatch = useDispatch();

    useEffect(() => {
        if (note) {
            setTitle(note.title);
            setContent(note.content);
        }
    }, [note]);

    const handleSubmit = (e) => {
        e.preventDefault();
        dispatch(updateExistingNote({ noteId: note.$id, noteData: { title, content } }));
        onClose();
    };

    if (!note) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-[#1a1a1a] p-6 rounded-lg w-full max-w-md mx-4">
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
                    <div className="flex justify-end space-x-4">
                        <button type="button" onClick={onClose} className="text-gray-400 hover:text-white">Cancel</button>
                        <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Save</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EditNoteModal;