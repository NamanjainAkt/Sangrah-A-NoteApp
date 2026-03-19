import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import useTimer from '../../hooks/useTimer';
import { selectTimerSettings } from '../../store/timerSlice';
import { formatTime, calculateProgress } from '../../utils/timer';

/**
 * FullScreenTimer Component
 * Full-screen focus mode with large timer and session info
 */
const FullScreenTimer = () => {
  const dispatch = useDispatch();
  const timerSettings = useSelector(selectTimerSettings);
  const {
    isRunning,
    currentSession,
    timeLeft,
    workDuration,
    breakDuration,
    sessionsCompleted,
    totalFocusTime,
    formattedTime,
    progress,
    start,
    pause,
    reset,
    skip,
    minimize,
    isFullScreen,
    isWorkSession,
    sessionLabel,
    stats,
  } = useTimer();

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

    switch (e.code) {
      case 'Space':
        e.preventDefault();
        if (isRunning) {
          pause();
        } else {
          start();
        }
        break;
      case 'KeyR':
        e.preventDefault();
        reset();
        break;
      case 'KeyS':
        e.preventDefault();
        skip();
        break;
      case 'KeyM':
        e.preventDefault();
        minimize();
        break;
      case 'Escape':
        e.preventDefault();
        minimize();
        break;
    }
  }, [isRunning, start, pause, reset, skip, minimize]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isFullScreen) return null;

  const totalDuration = currentSession === 'work' ? workDuration : breakDuration;
  const displayProgress = calculateProgress(timeLeft, totalDuration);

  return (
    <div className="fixed inset-0 bg-[#0d0d0d] z-50 flex flex-col items-center justify-center">
      {/* Header */}
      <div className="absolute top-6 left-0 right-0 flex justify-between items-start px-8">
        <div>
          <h2 className="text-white text-2xl font-medium">{sessionLabel}</h2>
          <p className="text-gray-400 text-sm mt-1">
            {isWorkSession ? 'Stay focused!' : 'Take a break!'}
          </p>
        </div>
        
        <button
          onClick={minimize}
          className="w-10 h-10 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition-colors"
          aria-label="Exit full screen"
        >
          <span className="material-symbols-outlined text-white">close</span>
        </button>
      </div>

      {/* Timer Circle */}
      <div className="relative w-80 h-80 mb-12">
        <CircularProgressbar
          value={displayProgress}
          text={formattedTime()}
          styles={buildStyles({
            pathColor: isWorkSession ? '#22C55E' : '#3B82F6',
            textColor: '#ffffff',
            textSize: '48px',
            trailColor: '#1f2937',
            pathTransitionDuration: 1,
          })}
        />
        
        {/* Session indicator */}
        <div className="absolute -bottom-8 left-0 right-0 text-center">
          <span className={`text-sm font-medium ${
            isWorkSession ? 'text-green-400' : 'text-blue-400'
          }`}>
            {currentSession === 'work' ? '🍅 Focus' : '☕ Break'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 mb-12">
        <button
          onClick={isRunning ? pause : start}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
            isRunning 
              ? 'bg-yellow-600 hover:bg-yellow-500' 
              : 'bg-green-600 hover:bg-green-500'
          }`}
          aria-label={isRunning ? 'Pause' : 'Start'}
        >
          <span className="material-symbols-outlined text-3xl">
            {isRunning ? 'pause' : 'play_arrow'}
          </span>
        </button>

        <button
          onClick={reset}
          className="w-16 h-16 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
          aria-label="Reset"
        >
          <span className="material-symbols-outlined text-3xl">refresh</span>
        </button>

        <button
          onClick={skip}
          className="w-16 h-16 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors"
          aria-label="Skip session"
        >
          <span className="material-symbols-outlined text-3xl">skip_next</span>
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-8 text-center mb-8">
        <div className="bg-gray-800/50 rounded-xl p-4 min-w-[120px]">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Sessions</p>
          <p className="text-white text-2xl font-bold mt-1">{sessionsCompleted}</p>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-4 min-w-[120px]">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Focus Time</p>
          <p className="text-white text-2xl font-bold mt-1">
            {Math.floor(stats().todayFocusTime / 60)}m
          </p>
        </div>
        
        <div className="bg-gray-800/50 rounded-xl p-4 min-w-[120px]">
          <p className="text-gray-400 text-xs uppercase tracking-wider">Today</p>
          <p className="text-white text-2xl font-bold mt-1">{stats().todaySessions}</p>
        </div>
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-gray-500 text-xs text-center">
        <p>Press <kbd className="bg-gray-800 px-2 py-1 rounded mx-1">Space</kbd> to {isRunning ? 'pause' : 'start'}</p>
        <p className="mt-1">
          <kbd className="bg-gray-800 px-2 py-1 rounded mx-1">R</kbd> Reset 
          <span className="mx-2">•</span>
          <kbd className="bg-gray-800 px-2 py-1 rounded mx-1">M</kbd> Minimize
        </p>
      </div>
    </div>
  );
};

export default FullScreenTimer;