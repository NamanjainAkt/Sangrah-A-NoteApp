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
        }))

        setTitle("")
        setContent("")
    }

    // Filter notes that are not archived and not deleted and not important
    const activeNotes = notes.filter(note => !note.isArchived && !note.isDeleted && !note.isImportant)

    return (
        <div className="w-full mx-auto max-sm:mt-4 max-sm:w-5xl">
            <div className='flex flex-col max-h-52 w-full max-w-4xl mx-auto p-4 bg-[#171717] rounded-2xl mb-8 max-sm:p-2'>
                <input type="text"
                    placeholder='Title'
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className='text-white p-4 outline-none border-none bg-transparent text-xl' />

                <textarea
                    placeholder='Content'
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={6}
                    className='text-white p-4 outline-none border-none bg-transparent text-xl resize-none custom-scroll'>
                </textarea>

                <div className='flex justify-end items-center'>
                    <button 
                        onClick={handleCreateNote}
                        className='text-white rounded-full w-8 h-8 hover:bg-white/20 cursor-pointer p-1 '>

                        <span className="material-symbols-outlined">
                            add_box
                        </span>
                    </button>
                </div>
            </div>

            <div className="notes-container max-w-4xl mx-auto">
                {status === "loading" && <p>Loading notes...</p>}
                {status === "failed" && <p>Failed to load notes</p>}
                {status === "succeeded" && activeNotes.length === 0 && (
                    <p className="text-center text-gray-500">No notes yet. Create your first note!</p>
                )}
                {activeNotes.map(note => (
                    <NoteCard key={note.$id} note={note} />
                ))}
            </div>
        </div>
    )
}

export default Home