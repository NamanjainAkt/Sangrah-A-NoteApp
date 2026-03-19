import { useState, useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { createNewNote, fetchNotes } from "../store/notesSlice"
import NoteCard from "../components/NoteCard"

const Home = () => {
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")
    const dispatch = useDispatch()
    const { notes, status } = useSelector(state => state.notes)
    const { userData } = useSelector(state => state.auth)

    useEffect(() => {
        if (userData) {
            dispatch(fetchNotes(userData.$id))
        }
    }, [dispatch, userData])

    const handleCreateNote = () => {
        if (!title.trim() || !content.trim()) return

        dispatch(createNewNote({
            title,
            content,
            userId: userData.$id,
            isArchived: false,
            isImportant: false,
            isDeleted: false
            // Don't include tasks, status, tags, or dueDate unless needed
            // This prevents Appwrite schema errors when these fields don't exist
        }))

        setTitle("")
        setContent("")
    }

    // Filter notes that are not archived and not deleted and not important
    // Handle undefined notes and missing properties gracefully
    const activeNotes = (notes || []).filter(note =>
        note && !note.isArchived && !note.isDeleted && !note.isImportant
    )

return (
        <div className="w-full max-w-4xl mx-auto px-2 sm:px-4">
            {/* Note Creation Form */}
            <div className='flex flex-col w-full p-4 sm:p-6 bg-[#171717] rounded-2xl mb-6 sm:mb-8'>
                <input 
                    type="text"
                    placeholder='Title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className='text-white p-3 sm:p-4 outline-none border-none bg-transparent text-lg sm:text-xl placeholder-gray-500'
                />

                <textarea
                    placeholder='Content'
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={4}
                    className='text-white p-3 sm:p-4 outline-none border-none bg-transparent text-base sm:text-xl resize-none custom-scroll placeholder-gray-500 flex-1 min-h-[100px]'>
                </textarea>

                <div className='flex justify-end items-center mt-4'>
                    <button 
                        onClick={handleCreateNote}
                        className='text-white rounded-full w-10 h-10 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] hover:bg-white/20 cursor-pointer p-0 sm:p-1 transition-colors flex items-center justify-center bg-blue-600 hover:bg-blue-700'
                        aria-label="Create note"
                    >
                        <span className="material-symbols-outlined text-lg sm:text-xl">
                            add_box
                        </span>
                    </button>
                </div>
            </div>

            {/* Notes List */}
            <div className="notes-container">
                {status === "loading" && (
                    <div className="text-center py-8">
                        <p className="text-gray-400">Loading notes...</p>
                    </div>
                )}
                {status === "failed" && (
                    <div className="text-center py-8">
                        <p className="text-red-400">Failed to load notes</p>
                    </div>
                )}
                {status === "succeeded" && activeNotes.length === 0 && (
                    <div className="text-center py-8">
                        <div className="mb-4">
                            <span className="material-symbols-outlined text-4xl text-gray-600">note_add</span>
                        </div>
                        <p className="text-gray-500 text-sm sm:text-base">No notes yet. Create your first note!</p>
                    </div>
                )}
                {status === "succeeded" && activeNotes.length > 0 && (
                    <div className="space-y-4">
                        {activeNotes.map(note => (
                            <NoteCard key={note.$id} note={note} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

export default Home