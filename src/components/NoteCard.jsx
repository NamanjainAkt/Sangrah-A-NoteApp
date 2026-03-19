import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { updateExistingNote } from '../store/notesSlice'
import EditNoteModal from './EditNoteModal';
import TaskList from './TaskList';
import { format, isPast, isToday, isTomorrow } from 'date-fns';

const NoteCard = ({ note }) => {
  const dispatch = useDispatch()
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { enableTodoChecklists } = useSelector(state => state.settings);
  const { enableTags } = useSelector(state => state.settings);
  const { enableReminders } = useSelector(state => state.settings);
  const allTags = useSelector(state => state.tags.tags);
  const reminders = useSelector(state => state.reminders.reminders);

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

  // Check if note has tasks
  const hasTasks = note.tasks && note.tasks.length > 0;
  
  // Calculate task completion percentage for visual indicator
  const completedTasks = hasTasks ? note.tasks.filter(task => task.completed).length : 0;
  const totalTasks = hasTasks ? note.tasks.length : 0;
  const completionPercentage = hasTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Get tags for this note
  const noteTags = enableTags && note.tags && note.tags.length > 0
    ? note.tags.map(tagId => allTags.find(t => t.id === tagId)).filter(Boolean)
    : [];

  // Get reminder for this note
  const noteReminder = enableReminders && reminders.find(r => r.noteId === note.$id && r.isActive);
  
  // Format due date
  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    
    if (isToday(date)) {
      return `Due today at ${format(date, 'h:mm a')}`;
    }
    if (isTomorrow(date)) {
      return `Due tomorrow at ${format(date, 'h:mm a')}`;
    }
    if (isPast(date)) {
      return `Overdue - ${format(date, 'MMM d, h:mm a')}`;
    }
    return `Due ${format(date, 'MMM d, yyyy')}`;
  };

  const dueDateText = noteReminder ? formatDueDate(noteReminder.dueDate) : null;
  const isOverdue = noteReminder && isPast(new Date(noteReminder.dueDate));

  return (
    <>
      <div className="bg-[#171717] rounded-lg p-4 text-white mb-4 w-full relative overflow-hidden">
        {/* Tags Display */}
        {enableTags && noteTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3 overflow-x-auto">
            {noteTags.map(tag => (
              <span
                key={tag.id}
                className="px-2 py-0.5 rounded-full text-xs text-white whitespace-nowrap flex-shrink-0"
                style={{ backgroundColor: tag.color }}
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        {/* Due Date Indicator */}
        {enableReminders && dueDateText && (
          <div className={`flex items-center gap-1 text-xs mb-2 ${
            isOverdue ? 'text-red-400' : 'text-gray-400'
          }`}>
            <span className="material-symbols-outlined text-sm flex-shrink-0">
              {isOverdue ? 'warning' : 'schedule'}
            </span>
            <span className="truncate min-w-0">{dueDateText}</span>
          </div>
        )}

        <h3 className="text-lg sm:text-xl font-medium mb-2 text-white break-words">{note.title}</h3>
        <p className="mb-4 text-gray-300 break-words overflow-hidden line-clamp-4">{note.content}</p>
        
        {/* Task List - conditionally rendered */}
        {enableTodoChecklists && hasTasks && (
          <div className="mb-4">
            <TaskList 
              tasks={note.tasks} 
              noteId={note.$id} 
              enabled={enableTodoChecklists} 
            />
          </div>
        )}
        
        {/* Task completion indicator when todo lists are enabled */}
        {enableTodoChecklists && hasTasks && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-400">
            <div className="flex-1 min-w-0 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className="flex-shrink-0">{completionPercentage}%</span>
          </div>
        )}
        
        <div className="flex justify-end space-x-1 sm:space-x-2 mt-4 pt-4 border-t border-gray-700">
          <button 
            onClick={openModal} 
            className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Edit note"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">edit</span>
          </button>
          <button 
            onClick={handleArchive} 
            className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={note.isArchived ? 'Unarchive note' : 'Archive note'}
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">
              {note.isArchived ? 'unarchive' : 'archive'}
            </span>
          </button>
          <button 
            onClick={handleImportant} 
            className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1 rounded-lg hover:bg-white/10 transition-colors"
            aria-label={note.isImportant ? 'Remove from important' : 'Mark as important'}
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">
              {note.isImportant ? 'label_important' : 'label_important_outline'}
            </span>
          </button>
          <button 
            onClick={handleDelete} 
            className="p-2 min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 sm:p-1 rounded-lg hover:bg-red-500/20 transition-colors"
            aria-label="Delete note"
          >
            <span className="material-symbols-outlined text-lg sm:text-xl">delete</span>
          </button>
        </div>
      </div>
      {isModalOpen && <EditNoteModal note={note} onClose={closeModal} />}
    </>
  )
}

export default NoteCard