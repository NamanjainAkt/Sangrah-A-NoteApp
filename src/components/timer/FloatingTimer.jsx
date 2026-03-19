import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import useTimer from '../../hooks/useTimer';
import { selectTimerSettings } from '../../store/timerSlice';
import { formatTime } from '../../utils/timer';

/**
 * FloatingTimer Component
 * Minimized overlay with progress circle, time display, and controls
 */
const FloatingTimer = () => {
  const dispatch = useDispatch();
  const timerSettings = useSelector(selectTimerSettings);
  const {
    isRunning,
    currentSession,
    timeLeft,
    progress,
    start,
    pause,
    minimize,
    isMinimized,
    isWorkSession,
  } = useTimer();

  const [showControls, setShowControls] = useState(false);

  if (isMinimized) {
    return (
      <div 
        className="fixed bottom-20 right-4 z-[45] flex items-center gap-2"
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        {/* Progress Circle */}
        <button
          className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#171717] border-2 border-gray-600 cursor-pointer hover:border-gray-400 transition-all duration-200 overflow-hidden hover:scale-105 flex-shrink-0"
          onClick={minimize}
          aria-label="Expand timer"
        >
          <CircularProgressbar
            value={progress}
            text={formatTime(timeLeft, false)}
            styles={buildStyles({
              pathColor: isWorkSession ? '#22C55E' : '#3B82F6',
              textColor: '#ffffff',
              textSize: '14px',
              trailColor: '#374151',
              pathTransitionDuration: 0.5,
            })}
          />
        </button>

        {/* Controls - show on hover */}
        {showControls && (
          <div className="flex gap-1 bg-[#171717] rounded-lg p-1 animate-fade-in shadow-lg border border-gray-700">
            <button
              onClick={isRunning ? pause : start}
              className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
              aria-label={isRunning ? 'Pause timer' : 'Start timer'}
            >
              <span className="material-symbols-outlined text-base">
                {isRunning ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button
              onClick={minimize}
              className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
              aria-label="Expand timer"
            >
              <span className="material-symbols-outlined text-base">open_in_full</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return null; // Don't render when not minimized
};

export default FloatingTimer;