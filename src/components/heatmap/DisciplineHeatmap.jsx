import React, { useState, useMemo, useEffect, useRef, useCallback, memo } from 'react';
import { useSelector } from 'react-redux';
import { 
  format, 
  subDays, 
  startOfWeek, 
  endOfWeek, 
  eachWeekOfInterval, 
  startOfYear, 
  endOfYear,
  getDay,
  isSameDay,
  addDays
} from 'date-fns';
import HeatmapCell from './HeatmapCell';
import HeatmapTooltip from './HeatmapTooltip';
import { selectActivityData } from '../../store/analyticsSlice';
import Skeleton from '../Skeleton';

// Debounce utility
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Discipline Heatmap Component
 * Displays a GitHub-style 365-day activity calendar
 */
const DisciplineHeatmap = memo(({ activityData: propActivityData, days = 365 }) => {
  const storeActivityData = useSelector(selectActivityData);
  const activityData = propActivityData || storeActivityData;
  
  const [tooltipState, setTooltipState] = useState({
    visible: false,
    x: 0,
    y: 0,
    date: '',
    activities: 0
  });

  const [isLoading, setIsLoading] = useState(!propActivityData);
  const [focusedCell, setFocusedCell] = useState(null);
  const [ariaLiveMessage, setAriaLiveMessage] = useState('');
  const [visibleWeeks, setVisibleWeeks] = useState({ start: 0, end: 20 });
  
  const heatmapRef = useRef(null);
  const virtualizationRef = useRef(null);

  useEffect(() => {
    // Simulate loading state for better UX
    if (!propActivityData) {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [propActivityData]);

  // Generate calendar data structure
  const calendarData = useMemo(() => {
    const today = new Date();
    const startDate = subDays(today, days);
    const endDate = today;

    // Generate all weeks in the range
    const weeks = eachWeekOfInterval({
      start: startOfWeek(startDate, { weekStartsOn: 0 }),
      end: endOfWeek(endDate, { weekStartsOn: 0 })
    });

    // Create day labels - full 7-day sequence
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Create month labels with robust width calculation
    const monthSegments = [];
    let currentMonth = null;
    let startWeekIndex = 0;

    weeks.forEach((week, index) => {
      const weekMonth = format(week, 'MMM');
      const weekStartDay = getDay(week);
      
      // Start new month segment if this is Sunday (first day of week) and month changed
      if ((index === 0 || weekStartDay === 0) && weekMonth !== currentMonth) {
        if (currentMonth !== null) {
          monthSegments.push({
            label: currentMonth,
            startWeekIndex,
            weekSpan: index - startWeekIndex
          });
        }
        currentMonth = weekMonth;
        startWeekIndex = index;
      }
    });

    // Add the last month segment
    if (currentMonth !== null) {
      monthSegments.push({
        label: currentMonth,
        startWeekIndex,
        weekSpan: weeks.length - startWeekIndex
      });
    }

    // Create grid data with lazy loading
    const grid = weeks.slice(visibleWeeks.start, visibleWeeks.end).map((weekStart, weekIndex) => {
      const actualWeekIndex = visibleWeeks.start + weekIndex;
      const week = [];
      for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const currentDate = addDays(weekStart, dayOffset);
        
        // Only include days within our range
        if (currentDate <= endDate && currentDate >= startDate) {
          const dateStr = format(currentDate, 'yyyy-MM-dd');
          const activity = activityData.find(a => a.date === dateStr);
          const totalActivity = activity?.totalActivity || 0;
          
          // Calculate activity level (0-4)
          let level = 0;
          if (totalActivity > 0) {
            if (totalActivity <= 2) level = 1;
            else if (totalActivity <= 5) level = 2;
            else if (totalActivity <= 8) level = 3;
            else level = 4;
          }

          week.push({
            date: dateStr,
            day: dayOffset,
            count: totalActivity,
            level,
            activities: activity || { notesCreated: 0, tasksCompleted: 0, kanbanMoves: 0, streakDays: 0 }
          });
        }
      }
      return { week, weekIndex: actualWeekIndex };
    }).filter(item => item.week.length > 0);

    return {
      weeks,
      dayLabels,
      months: monthSegments,
      grid,
      totalWeeks: weeks.length
    };
  }, [activityData, days, visibleWeeks]);

  // Handle scroll-based virtualization
  const handleScroll = useCallback(() => {
    if (!virtualizationRef.current) return;
    
    const container = virtualizationRef.current;
    const scrollTop = container.scrollTop;
    const containerHeight = container.clientHeight;
    const weekHeight = 16; // Height of each week row
    const bufferWeeks = 5; // Number of weeks to render outside viewport
    
    const startWeek = Math.max(0, Math.floor(scrollTop / weekHeight) - bufferWeeks);
    const endWeek = Math.min(
      calendarData.totalWeeks,
      Math.ceil((scrollTop + containerHeight) / weekHeight) + bufferWeeks
    );
    
    setVisibleWeeks({ start: startWeek, end });
  }, [calendarData.totalWeeks]);

  const handleHover = useCallback(debounce((date, count, position) => {
    setTooltipState({
      visible: true,
      x: position.x,
      y: position.y,
      date,
      activities: count
    });
  }, 300), []);

  const handleMouseLeave = useCallback(() => {
    setTooltipState(prev => ({ ...prev, visible: false }));
  }, []);

  const handleCellFocus = useCallback((dayInfo) => {
    setFocusedCell(dayInfo);
    setAriaLiveMessage(`Selected date: ${dayInfo.date}. Activities: ${dayInfo.count}. Level: ${dayInfo.level}`);
  }, []);

  const handleKeyDown = useCallback((event, dayInfo) => {
    if (!calendarData.grid.length) return;

    const { grid } = calendarData;
    let weekIndex = -1;
    let dayIndex = -1;

    // Find current position
    grid.forEach((week, wIndex) => {
      const dayIdx = week.findIndex(d => d.date === dayInfo.date);
      if (dayIdx !== -1) {
        weekIndex = wIndex;
        dayIndex = dayIdx;
      }
    });

    if (weekIndex === -1 || dayIndex === -1) return;

    let newWeekIndex = weekIndex;
    let newDayIndex = dayIndex;

    switch (event.key) {
      case 'ArrowRight':
        newDayIndex = Math.min(dayIndex + 1, grid[weekIndex].length - 1);
        break;
      case 'ArrowLeft':
        newDayIndex = Math.max(dayIndex - 1, 0);
        break;
      case 'ArrowDown':
        newWeekIndex = Math.min(weekIndex + 1, grid.length - 1);
        if (grid[newWeekIndex] && grid[newWeekIndex][dayIndex]) {
          newDayIndex = dayIndex;
        } else {
          newWeekIndex = weekIndex;
        }
        break;
      case 'ArrowUp':
        newWeekIndex = Math.max(weekIndex - 1, 0);
        if (grid[newWeekIndex] && grid[newWeekIndex][dayIndex]) {
          newDayIndex = dayIndex;
        } else {
          newWeekIndex = weekIndex;
        }
        break;
      case 'Home':
        newWeekIndex = 0;
        newDayIndex = 0;
        break;
      case 'End':
        newWeekIndex = grid.length - 1;
        newDayIndex = grid[newWeekIndex].length - 1;
        break;
      case 'PageDown':
        newWeekIndex = Math.min(weekIndex + 4, grid.length - 1);
        break;
      case 'PageUp':
        newWeekIndex = Math.max(weekIndex - 4, 0);
        break;
      default:
        return;
    }

    event.preventDefault();

    const newCell = grid[newWeekIndex]?.[newDayIndex];
    if (newCell) {
      handleCellFocus(newCell);
      // Focus the actual cell element
      const cellElement = document.querySelector(`[data-cell-date="${newCell.date}"]`);
      if (cellElement) {
        cellElement.focus();
      }
    }
  }, [calendarData.grid, handleCellFocus]);

  if (isLoading) {
    return (
      <div className="discipline-heatmap-loading" style={{ padding: '20px' }}>
        <Skeleton width="100%" height="120px" />
      </div>
    );
  }

  if (!activityData || activityData.length === 0) {
    return (
      <div className="discipline-heatmap-empty" style={{
        padding: '40px',
        textAlign: 'center',
        color: '#8b949e'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          <span className="material-symbols-outlined">insights</span>
        </div>
        <h3 style={{ color: '#ffffff', marginBottom: '8px' }}>No Activity Data Yet</h3>
        <p>Start using the app to see your productivity heatmap!</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-auto overflow-y-hidden pb-4" ref={heatmapRef}>
      {/* Skip to content link for keyboard users */}
      <a 
        href="#heatmap-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-lg z-50"
      >
        Skip to heatmap content
      </a>
      
      {/* ARIA Live Region for screen readers */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {ariaLiveMessage}
      </div>
      
      <div className="inline-flex flex-col min-w-0 bg-[#0d1117] rounded-lg p-3 sm:p-4 md:p-6" id="heatmap-content">
        {/* Month labels row */}
        <div className="flex mb-2 ml-8 sm:ml-8 min-w-0">
          {calendarData.months.map((month, index) => (
            <div
              key={index}
              className="text-xs text-gray-500 flex-shrink-0"
              style={{ width: `${Math.max(month.weekSpan * 14, 20)}px` }}
            >
              {month.label}
            </div>
          ))}
        </div>

        <div className="flex gap-2 sm:gap-3">
          {/* Day labels column */}
          <div className="hidden sm:flex flex-col justify-between text-xs text-gray-500 pr-2" style={{ height: '77px' }}>
            {calendarData.dayLabels.map((label, index) => (
              <div key={index} className="flex items-center h-[11px]">
                {label}
              </div>
            ))}
          </div>

          {/* Heatmap grid */}
          <div 
            className="flex gap-[2px] sm:gap-[3px]"
            role="grid"
            aria-label="Activity heatmap showing 365 days of activity"
            aria-rowcount={calendarData.grid.length}
            aria-colcount={calendarData.grid[0]?.length || 7}
          >
            {calendarData.grid.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]" role="row">
                {week.map((day, dayIndex) => (
                  <div
                    key={day.date}
                    data-cell-date={day.date}
                    role="gridcell"
                    tabIndex={0}
                    aria-label={`Date: ${day.date}, Activities: ${day.count}, Level: ${day.level + 1} of 5`}
                    aria-selected={focusedCell?.date === day.date}
                    onFocus={() => handleCellFocus(day)}
                    onKeyDown={(e) => handleKeyDown(e, day)}
                     onMouseEnter={() => handleHover(day.date, day.count, { x: 0, y: 0 })}
                     onMouseLeave={handleMouseLeave}
                     className={`w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] rounded-sm cursor-pointer transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                       focusedCell?.date === day.date ? 'ring-2 ring-blue-500' : ''
                     }`}
                    style={{ 
                      backgroundColor: day.level === 0 ? '#161b22' :
                                      day.level === 1 ? '#0e4429' :
                                      day.level === 2 ? '#006d32' :
                                      day.level === 3 ? '#26a641' : '#39d353'
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-1 sm:gap-2 mt-4 text-xs text-gray-500">
          <span className="hidden sm:inline">Less</span>
          <div className="flex gap-1">
            {[0, 1, 2, 3, 4].map(level => (
              <div
                key={level}
                className="w-[10px] h-[10px] sm:w-[11px] sm:h-[11px] rounded-sm"
                style={{ 
                  backgroundColor: level === 0 ? '#161b22' :
                                  level === 1 ? '#0e4429' :
                                  level === 2 ? '#006d32' :
                                  level === 3 ? '#26a641' : '#39d353'
                }}
              />
            ))}
          </div>
          <span className="hidden sm:inline">More</span>
        </div>
      </div>

      <HeatmapTooltip
        visible={tooltipState.visible}
        x={tooltipState.x}
        y={tooltipState.y}
        date={tooltipState.date}
        activities={tooltipState.activities}
      />
    </div>
  );
});

DisciplineHeatmap.displayName = 'DisciplineHeatmap';

export default DisciplineHeatmap;