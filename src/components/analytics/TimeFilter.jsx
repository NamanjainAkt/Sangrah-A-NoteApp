import React, { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * TimeFilter Component
 * Filter buttons for time range selection in analytics
 * Props:
 * - currentFilter: string - Current active filter ('today', 'week', 'month', 'year', 'all')
 * - onFilterChange: function - Callback when filter changes
 */
const TimeFilter = memo(({ currentFilter, onFilterChange }) => {
  const filters = [
    { value: 'today', label: 'Today', icon: 'today' },
    { value: 'week', label: 'Week', icon: 'date_range' },
    { value: 'month', label: 'Month', icon: 'calendar_month' },
    { value: 'year', label: 'Year', icon: 'calendar_year' },
    { value: 'all', label: 'All Time', icon: 'history' },
  ];

  return (
    <div 
      className="time-filter flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-700"
      role="tablist"
      aria-label="Time filter options"
    >
      {filters.map((filter, index) => {
        const isActive = currentFilter === filter.value;
        
        return (
          <motion.button
            key={filter.value}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => onFilterChange(filter.value)}
            className={`
              time-filter-btn flex items-center gap-2 px-4 py-2 rounded-lg font-medium 
              transition-all duration-200 whitespace-nowrap
              ${isActive 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'bg-[#171717] text-gray-400 hover:bg-[#2a2a2a] hover:text-white border border-gray-800'
              }
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-[#0d1117]
            `}
            role="tab"
            aria-selected={isActive}
            aria-controls={`filter-panel-${filter.value}`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>
              {filter.icon}
            </span>
            <span>{filter.label}</span>
          </motion.button>
        );
      })}
    </div>
  );
});

TimeFilter.displayName = 'TimeFilter';

export default TimeFilter;