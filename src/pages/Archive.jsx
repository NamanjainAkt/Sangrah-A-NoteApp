import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchNotes } from "../store/notesSlice"
import NoteCard from "../components/NoteCard"

const Archive = () => {
    const dispatch = useDispatch()
    const { notes, status } = useSelector(state => state.notes)
    const { userData } = useSelector(state => state.auth)

    useEffect(() => {
        if (userData) {
            dispatch(fetchNotes(userData.$id))
        }
    }, [dispatch, userData])

    // Filter notes that are archived but not deleted
    const archivedNotes = notes.filter(note => note.isArchived && !note.isDeleted)

    return (
        <div className="w-full max-w-4xl mx-auto h-full">
            <h1 className="text-3xl font-medium mt-14 mb-6 dark:text-white max-sm:text-center"><u>Archived Notes</u></h1>

            
            <div className="notes-container">
                {status === "loading" && <p>Loading notes...</p>}
                {status === "failed" && <p>Failed to load notes</p>}
                {status === "succeeded" && archivedNotes.length === 0 && (
                    <p className="text-center text-gray-500">No archived notes</p>
                )}
                {archivedNotes.map(note => (
                    <NoteCard key={note.$id} note={note} />
                ))}
            </div>
        </div>
    )
}

export default Archive