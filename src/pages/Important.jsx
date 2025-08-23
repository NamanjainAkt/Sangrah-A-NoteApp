import React from 'react'
import { useEffect } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchNotes } from "../store/notesSlice"
import NoteCard from "../components/NoteCard"

const Important = () => {
  const dispatch = useDispatch()
  const { notes, status } = useSelector(state => state.notes)
  const { userData } = useSelector(state => state.auth)

  useEffect(() => {
    if (userData) {
      dispatch(fetchNotes(userData.$id))
    }
  }, [dispatch, userData])

  // Filter notes that are marked as important and not deleted
  const importantNotes = notes.filter(note => note.isImportant && !note.isDeleted)

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-medium mb-6 dark:text-white text-black">Important Notes</h1>
      
      <div className="notes-container">
        {status === "loading" && <p className="dark:text-white text-black">Loading notes...</p>}
        {status === "failed" && <p className="text-red-500">Failed to load notes</p>}
        {status === "succeeded" && importantNotes.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400">No important notes yet</p>
        )}
        
        {importantNotes.map(note => (
          <NoteCard key={note.$id} note={note} />
        ))}
      </div>
    </div>
  )
}

export default Important