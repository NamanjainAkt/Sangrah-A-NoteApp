import React, { useState } from 'react'
import { useDispatch } from 'react-redux'
import { updateExistingNote } from '../store/notesSlice'
import EditNoteModal from './EditNoteModal'; // Import the modal component

const NoteCard = ({ note }) => {
  const dispatch = useDispatch()
  const [isModalOpen, setIsModalOpen] = useState(false);

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

  const openModal = () => setIsModalOpen(true);
  const closeModal = () => setIsModalOpen(false);

  return (
    <>
      <div className="bg-[#090808] rounded-lg p-4 text-white mb-4">
        <h3 className="text-xl font-medium mb-2">{note.title}</h3>
        <p className="mb-4">{note.content}</p>
        <div className="flex justify-end space-x-2">
          <button onClick={openModal} className="p-1">
            <span className="material-symbols-outlined cursor-pointer w-8 h-8 p-1 hover:bg-white/20 rounded-full">edit</span>
          </button>
          <button onClick={handleArchive} className="p-1">
            <span className="material-symbols-outlined cursor-pointer w-8 h-8 p-1 hover:bg-white/20 rounded-full">

            {note.isArchived ? 'unarchive' : 'archive'}
          </span>
        </button>
        <button onClick={handleImportant} className="p-1">
          <span className="material-symbols-outlined cursor-pointer w-8 h-8 p-1 hover:bg-white/20 rounded-full">


            {note.isImportant ? 'label_important' : 'label_important_outline'}
          </span>
        </button>
        <button onClick={handleDelete} className="p-1">
          <span className="material-symbols-outlined cursor-pointer w-8 h-8 p-1 hover:bg-white/20 rounded-full">delete</span>

          </button>
        </div>
      </div>
      {isModalOpen && <EditNoteModal note={note} onClose={closeModal} />}
    </>
  )
}

export default NoteCard