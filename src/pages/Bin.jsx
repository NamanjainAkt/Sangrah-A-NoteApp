import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchNotes, updateExistingNote, deleteNotePermantly } from "../store/notesSlice"
import NoteCard from "../components/NoteCard"

const Bin = () => {
  const dispatch = useDispatch()
  const { notes, status } = useSelector(state => state.notes)
  const { userData } = useSelector(state => state.auth)

  useEffect(() => {
    if (userData) {
      dispatch(fetchNotes(userData.$id))
    }
  }, [dispatch, userData])

  // Filter notes that are in the bin (deleted but not permanently removed)
  const deletedNotes = notes.filter(note => note.isDeleted)

  const handleRestore = (noteId) => {
    dispatch(updateExistingNote({
      noteId,
      noteData: { isDeleted: false }
    }))
  }

  const handlePermanentDelete = (noteId) => {
    dispatch(deleteNotePermantly(noteId))
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-medium mb-6 dark:text-white text-black">Recycle Bin</h1>
      
      <div className="notes-container">
        {status === "loading" && <p className="dark:text-white text-black">Loading notes...</p>}
        {status === "failed" && <p className="text-red-500">Failed to load notes</p>}
        {status === "succeeded" && deletedNotes.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">No deleted notes</p>
        )}
        
        {deletedNotes.map(note => (
          <div key={note.$id} className="mb-4">
            <NoteCard note={note} />
            <div className="flex justify-end space-x-2 mt-2">
              <button 
                onClick={() => handleRestore(note.$id)}
                className="px-3 py-1 dark:bg-white dark:text-black bg-black text-white rounded-lg hover:bg-green-700 hover:shadow-lg hover:shadow-green-500/50 dark:hover:shadow-green-700/50 transition-all duration-300"
              >
                Restore
              </button>
              <button 
                onClick={() => handlePermanentDelete(note.$id)}
                className="px-3 py-1 dark:bg-white dark:text-black bg-black text-white rounded-lg hover:bg-red-700 hover:shadow-lg hover:shadow-red-500/50 dark:hover:shadow-red-700/50 transition-all duration-300"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Bin