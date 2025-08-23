import React from 'react'
import { useDispatch } from 'react-redux'
import { updateExistingNote } from '../store/notesSlice'

const NoteCard = ({ note }) => {
  const dispatch = useDispatch()

  const handleArchive = () => {
    dispatch(updateExistingNote({
      noteId: note.$id,
      noteData: { isArchived: !note.isArchived }
    }))
  }

  const handleImportant = () => {
    dispatch(updateExistingNote({
      noteId: note.$id,
      noteData: { isImportant: !note.isImportant }
    }))
  }

  const handleDelete = () => {
    dispatch(updateExistingNote({
      noteId: note.$id,
      noteData: { isDeleted: true }
    }))
  }

  return (
    <div className="bg-[#090808] rounded-lg p-4 text-white mb-4">
      <h3 className="text-xl font-medium mb-2">{note.title}</h3>
      <p className="mb-4">{note.content}</p>
      <div className="flex justify-end space-x-2">
        <button onClick={handleArchive} className="p-1">
          <span className="material-symbols-outlined cursor-pointer">
            {note.isArchived ? 'unarchive' : 'archive'}
          </span>
        </button>
        <button onClick={handleImportant} className="p-1">
          <span className="material-symbols-outlined cursor-pointer">

            {note.isImportant ? 'label_important' : 'label_important_outline'}
          </span>
        </button>
        <button onClick={handleDelete} className="p-1">
          <span className="material-symbols-outlined cursor-pointer">delete</span>
        </button>
      </div>
    </div>
  )
}

export default NoteCard