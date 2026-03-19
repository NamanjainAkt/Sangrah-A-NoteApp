import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DndContext, pointerWithin, DragOverlay } from '@dnd-kit/core';
import { createNewNote, fetchNotes, updateExistingNote } from '../store/notesSlice';
import useGamification from '../hooks/useGamification';
import KanbanColumn from '../components/KanbanColumn';
import DraggableNoteCard from '../components/DraggableNoteCard';
import NoteCard from '../components/NoteCard';
import LoadingSpinner from '../components/LoadingSpinner';
import FeatureDisabled from '../components/FeatureDisabled';
import { toast } from 'react-toastify';

/**
 * Kanban Page Component
 * Displays notes in a Kanban board with three columns: To Do, In Progress, Done
 * Supports drag-and-drop functionality to change note status
 */
const Kanban = () => {
  const dispatch = useDispatch();
  const { notes, status, error } = useSelector(state => state.notes);
  const { userData } = useSelector(state => state.auth);
  const { enableGamification, enableKanbanView } = useSelector(state => state.settings);

  // Only use gamification hook if gamification is enabled
  // IMPORTANT: This must be called before any conditional returns
  const { awardPoints } = enableGamification ? useGamification() : { awardPoints: () => {} };

  const [activeId, setActiveId] = useState(null);
  const [activeNote, setActiveNote] = useState(null);
  const [focusedNoteId, setFocusedNoteId] = useState(null);
  const [ariaLiveMessage, setAriaLiveMessage] = useState('');

  const kanbanRef = useRef(null);

  // Fetch notes on component mount
  useEffect(() => {
    try {
      if (userData && enableKanbanView) {
        dispatch(fetchNotes(userData.$id));
      }
    } catch (error) {
      console.error('Error fetching notes in Kanban:', error);
    }
  }, [dispatch, userData, enableKanbanView]);

  // Filter notes for each column - exclude archived and deleted notes with defensive checks
  const todoNotes = (notes || []).filter(note =>
    note &&
    !note.isArchived &&
    !note.isDeleted &&
    note.status === 'todo'
  );

  const inProgressNotes = (notes || []).filter(note =>
    note &&
    !note.isArchived &&
    !note.isDeleted &&
    note.status === 'in_progress'
  );

  const doneNotes = (notes || []).filter(note =>
    note &&
    !note.isArchived &&
    !note.isDeleted &&
    note.status === 'done'
  );

  // Quick add note to specific column
  const handleQuickAdd = (status) => {
    const title = prompt('Enter note title:');
    if (!title?.trim()) return;

    dispatch(createNewNote({
      title: title.trim(),
      content: '',
      userId: userData.$id,
      isArchived: false,
      isImportant: false,
      isDeleted: false,
      tasks: [],
      status: status
    }));
    toast.success('Note added to ' + status.replace('_', ' '));
  };

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    if (!active || !active.id) {
      console.warn('Invalid drag start event');
      return;
    }
    setActiveId(active.id);
    setActiveNote(active.data.current?.note || null);
  };

  // Handle drag end - update note status and award points if needed
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveNote(null);

    // Defensive checks for null/undefined data
    if (!active || !active.id) {
      console.warn('Invalid drag end event: missing active data');
      return;
    }

    if (!over || !over.id) {
      console.warn('Invalid drag end event: missing over data');
      return;
    }

    // If dropped on same column, do nothing
    if (active.id === over.id) {
      return;
    }

    const draggedNote = active.data.current?.note;
    const targetStatus = over.data.current?.status || over.id;

    if (!draggedNote || !draggedNote.$id) {
      console.warn('Invalid drag end event: missing note data');
      return;
    }

    // Normalize status values
    const normalizedTargetStatus = String(targetStatus).toLowerCase();
    const normalizedCurrentStatus = String(draggedNote.status || '').toLowerCase();

    // Only update if status is different
    if (normalizedCurrentStatus !== normalizedTargetStatus) {
      // Optimistic update - update UI immediately
      dispatch(updateExistingNote({
        noteId: draggedNote.$id,
        noteData: { status: normalizedTargetStatus }
      }));

      // Award points if moving to "done" column
      if (enableGamification && normalizedTargetStatus === 'done' && normalizedCurrentStatus !== 'done') {
        awardPoints('kanban_done');
        toast.success('Note moved to Done! +10 points');
      } else {
        const displayName = normalizedTargetStatus.replace('_', ' ');
        toast.success(`Note moved to ${displayName}`);
      }
    }
  };

  // Handle drag cancel
  const handleDragCancel = () => {
    setActiveId(null);
    setActiveNote(null);
  };

  // Announce column changes
  const announceColumnChange = useCallback((noteTitle, fromColumn, toColumn) => {
    setAriaLiveMessage(`Moved "${noteTitle}" from ${fromColumn} to ${toColumn}`);
  }, []);

  // Column definitions with quick add handler
  const columns = [
    { title: 'To Do', status: 'todo', notes: todoNotes, onQuickAdd: () => handleQuickAdd('todo') },
    { title: 'In Progress', status: 'in_progress', notes: inProgressNotes, onQuickAdd: () => handleQuickAdd('in_progress') },
    { title: 'Done', status: 'done', notes: doneNotes, onQuickAdd: () => handleQuickAdd('done') }
  ];

  // Keyboard navigation for notes - MUST BE DEFINED AFTER columns
  const handleNoteKeyDown = useCallback((event, note, currentColumn) => {
    const columnNotes = columns.find(col => col.status === currentColumn)?.notes || [];
    const currentIndex = columnNotes.findIndex(n => n.$id === note.$id);

    if (currentIndex === -1) return;

    let targetColumn = currentColumn;
    let targetIndex = currentIndex;
    let action = '';

    switch (event.key) {
      case 'ArrowUp':
        targetIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowDown':
        targetIndex = Math.min(currentIndex + 1, columnNotes.length - 1);
        break;
      case 'ArrowLeft':
        // Move to previous column
        const currentColIndex = columns.findIndex(col => col.status === currentColumn);
        if (currentColIndex > 0) {
          targetColumn = columns[currentColIndex - 1].status;
          targetIndex = Math.min(currentIndex, columns[currentColIndex - 1].notes.length - 1);
          action = `Moving to ${columns[currentColIndex - 1].title} column`;
        }
        break;
      case 'ArrowRight':
        // Move to next column
        const currentColIdx = columns.findIndex(col => col.status === currentColumn);
        if (currentColIdx < columns.length - 1) {
          targetColumn = columns[currentColIdx + 1].status;
          targetIndex = Math.min(currentIndex, columns[currentColIdx + 1].notes.length - 1);
          action = `Moving to ${columns[currentColIdx + 1].title} column`;
        }
        break;
      case 'Enter':
      case ' ':
        // Move note to focused column or next column
        const colIndex = columns.findIndex(col => col.status === currentColumn);
        const nextColIndex = colIndex < columns.length - 1 ? colIndex + 1 : 0;
        const nextColumn = columns[nextColIndex];

        if (nextColumn && note.status !== nextColumn.status) {
          dispatch(updateExistingNote({
            noteId: note.$id,
            noteData: { status: nextColumn.status }
          }));

          setAriaLiveMessage(`Moved "${note.title}" to ${nextColumn.title}`);

          if (enableGamification && nextColumn.status === 'done') {
            awardPoints('kanban_done');
          }
        }
        event.preventDefault();
        return;
      case 'Home':
        targetIndex = 0;
        break;
      case 'End':
        targetIndex = columnNotes.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();

    // Focus on the target note
    const targetNote = columns.find(col => col.status === targetColumn)?.notes[targetIndex];
    if (targetNote) {
      setFocusedNoteId(targetNote.$id);
      const targetElement = document.querySelector(`[data-note-id="${targetNote.$id}"]`);
      if (targetElement) {
        targetElement.focus();
      }

      if (action) {
        setAriaLiveMessage(action);
      }
    }
  }, [columns, dispatch, enableGamification, awardPoints]);

  // Conditional returns must be AFTER all hooks are defined
  // Show disabled state if Kanban is not enabled
  if (!enableKanbanView) {
    return (
      <FeatureDisabled
        featureName="Kanban Board"
        icon="view_kanban"
        description="Enable Kanban View in Settings to organize your notes in a drag-and-drop board with To Do, In Progress, and Done columns."
      />
    );
  }

  // Show loading state while waiting for notes
  if (!userData || status === 'loading') {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3 text-white">Loading...</span>
      </div>
    );
  }

  // Show error state if fetch failed
  if (status === 'failed') {
    return (
      <div className="w-full h-64 flex items-center justify-center flex-col">
        <div className="text-red-400 mb-4">Error loading notes: {error}</div>
        <button
          onClick={() => dispatch(fetchNotes(userData.$id))}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full overflow-hidden" ref={kanbanRef}>
      {/* Skip to content link */}
      <a 
        href="#kanban-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to Kanban board
      </a>
      
      {/* ARIA Live Region */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {ariaLiveMessage}
      </div>
      
      <div className="px-4 sm:px-6 lg:px-8 py-6" id="kanban-content">
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6">Kanban Board</h1>

        <DndContext
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          {/* Kanban Columns - Responsive Layout */}
          <div 
            className="overflow-x-auto pb-4"
            role="main"
            aria-label="Kanban board with three columns: To Do, In Progress, Done"
          >
            <div 
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 min-w-0"
              role="region"
              aria-label="Kanban columns"
            >
              {columns.map(column => (
                <div key={column.status} className="flex flex-col">
                  <KanbanColumn
                    title={column.title}
                    status={column.status}
                    notes={column.notes}
                    onDrop={column.onQuickAdd}
                    keyboardProps={{
                      focusedNoteId,
                      onKeyDown: handleNoteKeyDown,
                      'aria-label': `${column.title} column with ${column.notes.length} notes`,
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Drag Overlay for smooth visual feedback */}
          <DragOverlay>
            {activeId && activeNote ? (
              <div className="opacity-80 scale-105 rotate-2 cursor-grabbing max-w-xs">
                <NoteCard note={activeNote} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Help Text */}
        <div className="mt-8 text-center text-gray-500 text-sm px-4">
          <p>Drag notes between columns to update their status</p>
          {enableGamification && (
            <p className="mt-1 text-green-400">
              +10 points for moving notes to Done!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Kanban;