import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableNoteCard from './DraggableNoteCard';

/**
 * KanbanColumn Component
 * Represents a column in the Kanban board where notes can be dropped
 * 
 * @param {string} title - Column title
 * @param {string} status - Status identifier for this column
 * @param {Array} notes - Array of notes in this column
 * @param {Function} onDrop - Callback when a note is dropped in this column
 */
const KanbanColumn = ({ title, status, notes, onDrop }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: status,
    data: { status }
  });

  // Highlight drop zone when dragging over
  const isActive = isOver && (!notes || notes.length === 0);

  return (
    <div 
      ref={setNodeRef}
      className={`
        flex flex-col bg-[#171717] rounded-xl p-3 sm:p-4 min-h-[300px] sm:min-h-[400px] md:min-h-[500px] 
        w-full sm:w-72 md:w-80 lg:w-96 flex-shrink-0 max-w-full
        transition-all duration-300 ease-in-out
        ${isOver ? 'ring-2 ring-blue-500/50 bg-[#1f1f1f]' : ''}
        ${isActive ? 'ring-2 ring-green-500/50 bg-[#1a1a1a]' : ''}
        border border-gray-800 hover:border-gray-700
      `}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-800">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <h2 className="text-white font-semibold text-lg truncate">{title}</h2>
          <span className="bg-gray-700 text-gray-300 text-xs px-2 py-0.5 rounded-full flex-shrink-0">
            {notes ? notes.length : 0}
          </span>
        </div>
        
        {/* Quick add button for this column */}
        <button 
          onClick={onDrop}
          className="text-gray-400 hover:text-white hover:bg-gray-700 p-2 rounded-lg transition-colors cursor-pointer flex-shrink-0 min-w-[44px] min-h-[44px]"
          title={`Add note to ${title}`}
          aria-label={`Add note to ${title}`}
        >
          <span className="material-symbols-outlined text-lg">add</span>
        </button>
      </div>

      {/* Drop Zone */}
      <div className="flex-1 flex flex-col gap-3 overflow-y-auto custom-scroll">
        <SortableContext 
          items={notes ? notes.map(note => note.$id) : []} 
          strategy={verticalListSortingStrategy}
        >
          {notes && notes.map((note) => (
            <DraggableNoteCard key={note.$id} note={note} />
          ))}
        </SortableContext>

        {/* Empty State */}
        {(!notes || notes.length === 0) && (
          <div className={`
            flex-1 flex flex-col items-center justify-center border-2 border-dashed rounded-lg
            transition-colors duration-300 p-4 sm:p-6
            ${isOver ? 'border-blue-500/30 bg-blue-500/5' : 'border-gray-700'}
          `}>
            <span className="material-symbols-outlined text-3xl sm:text-4xl text-gray-600 mb-2">
              {status === 'todo' ? 'task' : status === 'in_progress' ? 'pending' : 'check_circle'}
            </span>
            <p className="text-gray-500 text-sm text-center">
              No notes in {title.toLowerCase()}<br/>
              <span className="text-xs text-gray-600">Drag notes here or click + to add</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default KanbanColumn;