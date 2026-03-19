import React, { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';

/**
 * Tooltip component for heatmap cells
 * Shows date and activity breakdown on hover
 */
const HeatmapTooltip = memo(({ 
  visible, 
  x, 
  y, 
  date, 
  activities 
}) => {
  // Calculate tooltip position to stay within viewport
  const getPositionStyle = () => {
    const tooltipWidth = 220;
    const tooltipHeight = 100;
    const padding = 10;
    
    let left = x + 15;
    let top = y - tooltipHeight / 2;
    
    // Adjust if tooltip goes off right edge
    if (left + tooltipWidth > window.innerWidth - padding) {
      left = x - tooltipWidth - 15;
    }
    
    // Adjust if tooltip goes off left edge
    if (left < padding) {
      left = padding;
    }
    
    // Adjust if tooltip goes off top edge
    if (top < padding) {
      top = y + 15;
    }
    
    // Adjust if tooltip goes off bottom edge
    if (top + tooltipHeight > window.innerHeight - padding) {
      top = window.innerHeight - tooltipHeight - padding;
    }
    
    return {
      left: `${left}px`,
      top: `${top}px`,
    };
  };

  const formatDate = (dateStr) => {
    try {
      return format(new Date(dateStr), 'MMM d, yyyy');
    } catch {
      return dateStr;
    }
  };

  const getActivityBreakdown = () => {
    if (!activities || typeof activities === 'number') {
      const total = activities || 0;
      return { total, breakdown: [] };
    }

    const breakdown = [];
    if (activities.notesCreated > 0) {
      breakdown.push(`${activities.notesCreated} notes`);
    }
    if (activities.tasksCompleted > 0) {
      breakdown.push(`${activities.tasksCompleted} tasks`);
    }
    if (activities.kanbanMoves > 0) {
      breakdown.push(`${activities.kanbanMoves} kanban moves`);
    }
    if (activities.streakDays > 0) {
      breakdown.push(`${activities.streakDays} streak`);
    }

    const total = activities.totalActivity || 
      (activities.notesCreated || 0) + 
      (activities.tasksCompleted || 0) + 
      (activities.kanbanMoves || 0) +
      (activities.streakDays || 0);

    return { total, breakdown };
  };

  const { total, breakdown } = getActivityBreakdown();

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ duration: 0.15 }}
          className="heatmap-tooltip"
          style={{
            ...getPositionStyle(),
            position: 'fixed',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            padding: '12px',
            color: '#ffffff',
            fontSize: '13px',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            border: '1px solid #3a3a3a',
            pointerEvents: 'none',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '8px' }}>
            {formatDate(date)}
          </div>
          <div style={{ 
            color: total > 0 ? '#39d353' : '#6e7681',
            fontSize: '14px',
            fontWeight: 500 
          }}>
            {total} {total === 1 ? 'activity' : 'activities'}
          </div>
          {breakdown.length > 0 && (
            <div style={{ 
              marginTop: '8px', 
              color: '#8b949e', 
              fontSize: '12px' 
            }}>
              {breakdown.join(' • ')}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

HeatmapTooltip.displayName = 'HeatmapTooltip';

export default HeatmapTooltip;