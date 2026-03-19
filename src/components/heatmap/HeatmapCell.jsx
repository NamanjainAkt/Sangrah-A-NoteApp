import React, { memo, useState, useCallback } from 'react';

/**
 * GitHub-style heatmap cell component
 * Displays activity level for a specific date
 */
const HeatmapCell = memo(({ 
  date, 
  count, 
  level = 0, 
  onHover, 
  onMouseLeave 
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Color mapping based on activity level (GitHub-style)
  const colors = {
    0: '#161b22', // empty (dark gray)
    1: '#0e4429', // light green
    2: '#006d32', // medium green
    3: '#26a641', // bright green
    4: '#39d353'  // very bright green
  };

  const handleMouseEnter = useCallback((e) => {
    setIsHovered(true);
    if (onHover) {
      const rect = e.currentTarget.getBoundingClientRect();
      onHover(date, count, { x: rect.left, y: rect.top });
    }
  }, [date, count, onHover]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    if (onMouseLeave) {
      onMouseLeave();
    }
  }, [onMouseLeave]);

  return (
    <div
      className={`heatmap-cell ${isHovered ? 'heatmap-cell--hovered' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      role="img"
      aria-label={`${date}: ${count} activities`}
      title={`${date}: ${count} activities`}
      style={{
        width: '11px',
        height: '11px',
        backgroundColor: colors[level] || colors[0],
        borderRadius: '2px',
        cursor: 'pointer',
        transition: 'transform 0.15s ease, opacity 0.15s ease',
        opacity: count > 0 ? 1 : 0.3,
        transform: isHovered ? 'scale(1.3)' : 'scale(1)',
        zIndex: isHovered ? 10 : 1,
      }}
    />
  );
});

HeatmapCell.displayName = 'HeatmapCell';

export default HeatmapCell;