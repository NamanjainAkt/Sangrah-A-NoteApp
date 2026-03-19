import React, { useState } from 'react';

/**
 * TaskItem Component
 * Renders an individual task with checkbox, editable text, and delete functionality
 * Props:
 * - task: object with id, text, completed
 * - onToggle: function to toggle task completion
 * - onUpdateText: function to update task text
 * - onDelete: function to delete task
 */
const TaskItem = ({ task, onToggle, onUpdateText, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(task.text);

  const handleTextSubmit = (e) => {
    e.preventDefault();
    if (editedText.trim() && editedText !== task.text) {
      onUpdateText(task.id, editedText.trim());
    }
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedText(task.text);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextSubmit(e);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div 
      className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-200 group
        ${task.completed ? 'bg-green-500/10' : 'bg-[#2a2a2a] hover:bg-[#3a3a3a]'}
      `}
    >
      {/* Checkbox */}
      <button
        onClick={() => onToggle(task.id, !task.completed)}
        className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-all duration-200
          ${task.completed 
            ? 'bg-green-500 border-green-500' 
            : 'border-gray-500 hover:border-white'
          }
        `}
        aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
      >
        {task.completed && (
          <svg 
            className="w-full h-full text-white" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="3" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path d="M5 13l4 4L19 7" />
          </svg>
        )}
      </button>

      {/* Editable Text */}
      {isEditing ? (
        <form onSubmit={handleTextSubmit} className="flex-1">
          <input
            type="text"
            value={editedText}
            onChange={(e) => setEditedText(e.target.value)}
            onBlur={handleTextSubmit}
            onKeyDown={handleKeyDown}
            autoFocus
            className="w-full bg-transparent text-white outline-none border-b border-blue-500 focus:border-blue-400"
            aria-label="Edit task text"
          />
        </form>
      ) : (
        <span 
          onClick={() => setIsEditing(true)}
          className={`flex-1 cursor-text text-white transition-all duration-200
            ${task.completed ? 'line-through text-gray-400' : ''}
          `}
        >
          {task.text}
        </span>
      )}

      {/* Delete Button */}
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-300 
                   hover:bg-red-500/20 rounded transition-all duration-200"
        aria-label="Delete task"
      >
        <svg 
          className="w-5 h-5" 
          fill="none" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="2" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      </button>
    </div>
  );
};

export default TaskItem;