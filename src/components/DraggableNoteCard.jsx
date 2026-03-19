import React, { memo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import NoteCard from './NoteCard';

/**
 * DraggableNoteCard Component
 * Wraps the existing NoteCard component with drag-and-drop functionality using dnd-kit
 * 
 * @param {Object} note - The note object to display and make draggable
 */
const DraggableNoteCard = memo(({ note }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging
  } = useDraggable({
    id: note.$id,
    data: { note }
  });

  // Apply drag transformation styles with guard for undefined transform
  const transformString = transform ? CSS.Translate.toString(transform) : null;
  const style = {
    transform: transformString,
    opacity: isDragging ? 0.5 : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    scale: isDragging ? 1.02 : 1,
    boxShadow: isDragging ? '0 20px 40px rgba(0, 0, 0, 0.4)' : '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: isDragging ? 1000 : 'auto',
    position: isDragging ? 'relative' : 'static',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`
        transition-all duration-200 ease-out
        ${isDragging ? 'scale-105 rotate-2' : 'hover:scale-[1.01]'}
      `}
    >
      <NoteCard note={note} />
      
      {/* Visual indicator that this card is draggable */}
      <div 
        className={`
          absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity
          ${isDragging ? 'opacity-100' : ''}
        `}
      >
        <span className="material-symbols-outlined text-gray-400 text-sm cursor-grab">
          drag_indicator
        </span>
      </div>
    </div>
  );
});

DraggableNoteCard.displayName = 'DraggableNoteCard';

export default DraggableNoteCard;