import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addTaskToNote, updateTaskInNote, deleteTaskFromNote } from '../store/notesSlice';
import useGamification from '../hooks/useGamification';
import TaskItem from './TaskItem';
import { toast } from 'react-toastify';

/**
 * TaskList Component
 * Displays a list of tasks with add, toggle, edit, and delete functionality
 * Props:
 * - tasks: array of task objects
 * - noteId: string - the ID of the note this task list belongs to
 * - enabled: boolean - whether todo checklists are enabled in settings
 */
const TaskList = ({ tasks = [], noteId, enabled }) => {
  const dispatch = useDispatch();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  
  const { awardPoints } = useGamification();
  const { enableGamification } = useSelector(state => state.settings);

  // Don't render if disabled
  if (!enabled) {
    return null;
  }

  const handleAddTask = (e) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      dispatch(addTaskToNote({ noteId, taskText: newTaskText.trim() }));
      toast.success('Task added successfully');
      setNewTaskText('');
      setIsAddingTask(false);
    }
  };

  const handleToggleTask = (taskId, completed) => {
    dispatch(updateTaskInNote({ noteId, taskId, updates: { completed } }));

    // Award points when task is completed and gamification is enabled
    if (completed && enableGamification) {
      awardPoints('task_completed');
    }
  };

  const handleUpdateTaskText = (taskId, newText) => {
    dispatch(updateTaskInNote({ noteId, taskId, updates: { text: newText } }));
  };

  const handleDeleteTask = (taskId) => {
    dispatch(deleteTaskFromNote({ noteId, taskId }));
    toast.success('Task deleted');
  };

  // Calculate completion percentage with defensive checks
  const validTasks = Array.isArray(tasks) ? tasks.filter(task => task && typeof task === 'object') : [];
  const completedTasks = validTasks.filter(task => task.completed).length;
  const totalTasks = validTasks.length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="mt-4 pt-4 border-t border-gray-700">
      {/* Task Completion Progress */}
      {totalTasks > 0 && (
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-400 mb-1">
            <span>Progress</span>
            <span>{completedTasks}/{totalTasks} ({completionPercentage}%)</span>
          </div>
          <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-green-500 transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Tasks List */}
      <div className="space-y-2">
        {validTasks.map(task => (
          <TaskItem
            key={task.id || `task-${Math.random()}`}
            task={task}
            onToggle={handleToggleTask}
            onUpdateText={handleUpdateTaskText}
            onDelete={handleDeleteTask}
          />
        ))}
      </div>

{/* Empty State */}
        {(!tasks || tasks.length === 0) && (
        <div className="text-center py-6">
          <span className="material-symbols-outlined text-3xl text-gray-600 mb-2">checklist</span>
          <p className="text-gray-500 text-sm">
            No tasks yet. Add one below!
          </p>
        </div>
      )}

      {/* Add Task Section */}
      {isAddingTask ? (
        <form onSubmit={handleAddTask} className="mt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAddingTask(false)}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              aria-label="Cancel adding task"
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
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder="Enter task description..."
              className="flex-1 bg-[#2a2a2a] text-white p-2 rounded-lg outline-none 
                         focus:ring-2 focus:ring-blue-500/50"
              autoFocus
              aria-label="New task description"
            />
            <button
              type="submit"
              className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg 
                         transition-colors"
              aria-label="Add task"
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
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setIsAddingTask(true)}
          className="mt-3 flex items-center gap-2 text-gray-400 hover:text-white 
                     transition-colors group"
          aria-label="Add new task"
        >
          <svg 
            className="w-5 h-5 group-hover:scale-110 transition-transform" 
            fill="none" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="2" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path d="M12 4v16m8-8H4" />
          </svg>
          <span>Add Task</span>
        </button>
      )}
    </div>
  );
};

export default TaskList;