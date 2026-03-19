import React from 'react';
import { useSelector } from 'react-redux';
import { selectSessionHistory } from '../../store/timerSlice';
import { format, isToday, isYesterday } from 'date-fns';

/**
 * SessionHistory Component
 * Displays completed Pomodoro sessions with pagination
 */
const SessionHistory = ({ className = '', limit = 10 }) => {
  const sessionHistory = useSelector(selectSessionHistory);

  // Group sessions by date
  const groupedSessions = sessionHistory.reduce((groups, session) => {
    const date = new Date(session.completedAt);
    let dateKey;
    
    if (isToday(date)) {
      dateKey = 'Today';
    } else if (isYesterday(date)) {
      dateKey = 'Yesterday';
    } else {
      dateKey = format(date, 'MMM d, yyyy');
    }
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(session);
    
    return groups;
  }, {});

  // Sort sessions within each group
  Object.keys(groupedSessions).forEach(dateKey => {
    groupedSessions[dateKey].sort((a, b) => 
      new Date(b.completedAt) - new Date(a.completedAt)
    );
  });

  // Sort groups by date (most recent first)
  const sortedGroupKeys = Object.keys(groupedSessions).sort((a, b) => {
    if (a === 'Today') return -1;
    if (b === 'Today') return 1;
    if (a === 'Yesterday') return -1;
    if (b === 'Yesterday') return 1;
    return new Date(b) - new Date(a);
  });

  // Format session duration
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Get session icon
  const getSessionIcon = (type) => {
    return type === 'work' ? 'timer' : 'coffee';
  };

  // Get session color
  const getSessionColor = (type) => {
    return type === 'work' ? 'text-green-400' : 'text-blue-400';
  };

  if (sessionHistory.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <span className="material-symbols-outlined text-4xl text-gray-600 mb-3">
          history
        </span>
        <p className="text-gray-500">No sessions completed yet</p>
        <p className="text-gray-600 text-sm mt-1">
          Complete your first Pomodoro session to see it here
        </p>
      </div>
    );
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">history</span>
          Session History
        </h3>
        <span className="text-gray-500 text-sm">
          {sessionHistory.length} total
        </span>
      </div>

      <div className="space-y-4">
        {sortedGroupKeys.slice(0, limit).map(dateKey => (
          <div key={dateKey}>
            {/* Date Header */}
            <p className="text-gray-400 text-sm font-medium mb-2">
              {dateKey}
              <span className="ml-2 text-gray-600">
                ({groupedSessions[dateKey].length} sessions)
              </span>
            </p>

            {/* Sessions */}
            <div className="space-y-2">
              {groupedSessions[dateKey].slice(0, 5).map((session, index) => (
                <div 
                  key={`${session.id}-${index}`}
                  className="flex items-center gap-3 p-2 bg-gray-800/50 rounded-lg"
                >
                  <span className={`material-symbols-outlined ${getSessionColor(session.type)}`}>
                    {getSessionIcon(session.type)}
                  </span>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm truncate">
                      {session.type === 'work' ? 'Focus Session' : 'Break'}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {format(new Date(session.completedAt), 'h:mm a')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-white text-sm font-medium">
                      {formatDuration(session.duration)}
                    </p>
                    <p className="text-gray-500 text-xs">
                      {Math.round((session.duration / session.originalDuration) * 100)}% complete
                    </p>
                  </div>

                  {session.associatedNoteId && (
                    <span className="material-symbols-outlined text-gray-500 text-sm" title="Associated note">
                      note
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {sessionHistory.length > limit * 5 && (
        <button className="w-full mt-4 py-2 bg-gray-800 rounded-lg text-gray-400 text-sm hover:bg-gray-700 transition-colors">
          View More Sessions
        </button>
      )}
    </div>
  );
};

export default SessionHistory;