import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import GoalProgress from './GoalProgress';

/**
 * Goal Card Component
 * Displays individual goal with progress and actions
 */
const GoalCard = ({ 
  goal, 
  onUpdateProgress, 
  onDelete, 
  onComplete,
  showActions = true 
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const getCategoryIcon = () => {
    const icons = {
      notes_created: 'note',
      tasks_completed: 'check_circle',
      kanban_moves: 'view_kanban',
      streak_maintenance: 'local_fire_department'
    };
    return icons[goal.category] || 'flag';
  };

  const getCategoryLabel = () => {
    const labels = {
      notes_created: 'Notes Created',
      tasks_completed: 'Tasks Completed',
      kanban_moves: 'Kanban Moves',
      streak_maintenance: 'Streak Maintenance'
    };
    return labels[goal.category] || goal.category;
  };

  const isExpired = () => {
    if (goal.type !== 'daily') return false;
    
    // Validate period format before comparison
    if (!goal.period || typeof goal.period !== 'string') {
      return false;
    }
    
    const today = format(new Date(), 'yyyy-MM-dd');
    
    // Parse dates with proper validation
    try {
      const goalDate = new Date(goal.period);
      const todayDate = new Date(today);
      
      // Check if dates are valid
      if (isNaN(goalDate.getTime()) || isNaN(todayDate.getTime())) {
        return false;
      }
      
      // Compare dates properly (handles timezone differences)
      return goalDate < todayDate && !goal.completedAt;
    } catch (error) {
      console.error('Error parsing goal period:', error);
      return false;
    }
  };

  const isCompleted = () => !!goal.completedAt;
  const progressPercentage = Math.min(100, Math.round((goal.current / goal.target) * 100));

  const handleDelete = () => {
    onDelete(goal.id);
    setShowDeleteConfirm(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="goal-card"
      style={{
        backgroundColor: '#171717',
        borderRadius: '12px',
        padding: '20px',
        border: isCompleted() ? '1px solid #39d353' : '1px solid transparent',
        opacity: isCompleted() ? 0.7 : 1,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Completion badge */}
      {isCompleted() && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: '#39d353',
          color: '#000000',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            check_circle
          </span>
          Completed
        </div>
      )}

      {/* Expired badge */}
      {isExpired() && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          backgroundColor: '#f85149',
          color: '#ffffff',
          padding: '4px 8px',
          borderRadius: '12px',
          fontSize: '11px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '4px'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
            error
          </span>
          Expired
        </div>
      )}

      {/* Header */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start', 
        gap: '16px',
        marginBottom: '16px'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          backgroundColor: isCompleted() ? '#39d35320' : '#3b82f620',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <span className="material-symbols-outlined" style={{ 
            fontSize: '24px',
            color: isCompleted() ? '#39d353' : '#3b82f6'
          }}>
            {getCategoryIcon()}
          </span>
        </div>

        <div style={{ flex: 1 }}>
          <h3 style={{ 
            color: '#ffffff', 
            fontSize: '16px', 
            fontWeight: 600,
            marginBottom: '4px'
          }}>
            {getCategoryLabel()}
          </h3>
          <div style={{ 
            color: '#8b949e', 
            fontSize: '13px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            <span style={{
              backgroundColor: goal.type === 'daily' ? '#3b82f620' : '#8b5cf620',
              color: goal.type === 'daily' ? '#3b82f6' : '#8b5cf6',
              padding: '2px 8px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 500
            }}>
              {goal.type === 'daily' ? 'Daily' : 'Weekly'}
            </span>
            <span>•</span>
            <span>{goal.period}</span>
          </div>
        </div>

        {/* Progress indicator */}
        <GoalProgress
          current={goal.current}
          target={goal.target}
          type={goal.type === 'daily' ? 'circular' : 'bar'}
        />
      </div>

      {/* Progress details */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: '12px',
        borderTop: '1px solid #2a2a2a'
      }}>
        <div style={{ color: '#8b949e', fontSize: '13px' }}>
          <span style={{ color: '#ffffff', fontWeight: 600 }}>{goal.current}</span>
          {' / '}
          <span>{goal.target}</span>
          {' '}
          {progressPercentage >= 100 && !isCompleted() && (
            <span style={{ color: '#39d353', marginLeft: '8px' }}>
              Goal reached!
            </span>
          )}
        </div>

        {/* Actions */}
        {showActions && !isCompleted() && !isExpired() && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => onUpdateProgress(goal.id, 1)}
              style={{
                backgroundColor: '#2a2a2a',
                color: '#ffffff',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#3a3a3a'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2a2a2a'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                add
              </span>
              Add Progress
            </button>

            <button
              onClick={() => onComplete(goal.id)}
              style={{
                backgroundColor: '#39d35320',
                color: '#39d353',
                border: 'none',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#39d35330'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#39d35320'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>
                check_circle
              </span>
              Complete
            </button>

            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                backgroundColor: 'transparent',
                color: '#f85149',
                border: 'none',
                padding: '6px',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                transition: 'background-color 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#f8514920'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
                delete
              </span>
            </button>
          </div>
        )}

        {/* Delete confirmation */}
        <AnimatePresence>
          {showDeleteConfirm && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{
                position: 'absolute',
                bottom: '0',
                left: '0',
                right: '0',
                backgroundColor: '#2a2a2a',
                padding: '16px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span style={{ color: '#ffffff', fontSize: '13px' }}>
                Delete this goal?
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    backgroundColor: '#3a3a3a',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  style={{
                    backgroundColor: '#f85149',
                    color: '#ffffff',
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    cursor: 'pointer'
                  }}
                >
                  Delete
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default GoalCard;