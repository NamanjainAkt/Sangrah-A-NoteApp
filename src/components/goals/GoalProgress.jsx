import React, { memo } from 'react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import { motion } from 'framer-motion';

/**
 * Goal Progress Component
 * Displays progress as circular (daily goals) or bar chart (weekly goals)
 */
const GoalProgress = memo(({ 
  current, 
  target, 
  type = 'circular',
  showPercentage = true 
}) => {
  // Calculate progress percentage
  const percentage = Math.min(100, Math.round((current / target) * 100));
  
  // Get color based on progress
  const getColor = () => {
    if (percentage >= 76) return '#39d353'; // Green
    if (percentage >= 26) return '#e3b341'; // Yellow
    return '#f85149'; // Red
  };

  const progressColor = getColor();

  if (type === 'circular') {
    return (
      <div style={{ 
        width: '60px', 
        height: '60px',
        position: 'relative'
      }}>
        <CircularProgressbar
          value={percentage}
          strokeWidth={8}
          styles={buildStyles({
            pathColor: progressColor,
            trailColor: '#2a2a2a',
            strokeLinecap: 'round',
            pathTransitionDuration: 0.5,
          })}
        />
        {showPercentage && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '12px',
            fontWeight: 600,
            color: '#ffffff'
          }}>
            {percentage}%
          </div>
        )}
      </div>
    );
  }

  // Bar chart type for weekly goals
  return (
    <div style={{ width: '100%' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between',
        marginBottom: '4px',
        fontSize: '12px',
        color: '#8b949e'
      }}>
        <span>{current} completed</span>
        <span>{target} target</span>
      </div>
      <div style={{
        position: 'relative',
        height: '8px',
        backgroundColor: '#2a2a2a',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          style={{
            height: '100%',
            backgroundColor: progressColor,
            borderRadius: '4px'
          }}
        />
      </div>
      {showPercentage && (
        <div style={{
          textAlign: 'right',
          fontSize: '11px',
          color: progressColor,
          marginTop: '4px',
          fontWeight: 500
        }}>
          {percentage}%
        </div>
      )}
    </div>
  );
});

GoalProgress.displayName = 'GoalProgress';

export default GoalProgress;