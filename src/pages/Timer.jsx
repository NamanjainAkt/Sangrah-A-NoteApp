import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import FullScreenTimer from '../components/timer/FullScreenTimer';
import FloatingTimer from '../components/timer/FloatingTimer';
import TimerSettings from '../components/timer/TimerSettings';
import useTimer from '../hooks/useTimer';
import FeatureDisabled from '../components/FeatureDisabled';

/**
 * Timer Page
 * Full page view for the Pomodoro timer
 */
const Timer = () => {
  const { enablePomodoroTimer } = useSelector(state => state.settings);
  const [showSettings, setShowSettings] = useState(false);
  const {
    isRunning,
    currentSession,
    timeLeft,
    sessionsCompleted,
    totalFocusTime,
    formattedTime,
    progress,
    start,
    pause,
    reset,
    skip,
    fullScreen,
    stats,
    isWorkSession,
  } = useTimer();

  if (!enablePomodoroTimer) {
    return (
      <FeatureDisabled
        featureName="Pomodoro Timer"
        icon="timer"
        description="Enable Pomodoro Timer in Settings to use focus sessions with work/break intervals."
      />
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-6 sm:mb-8 flex items-center gap-3">
        <span className="material-symbols-outlined text-2xl sm:text-3xl">timer</span>
        Pomodoro Timer
      </h1>

      {/* Timer Display */}
      <div className="bg-[#171717] rounded-2xl p-6 sm:p-8 text-center mb-6">
        <div className="mb-4">
          <span className={`text-base sm:text-lg font-medium ${
            isWorkSession ? 'text-green-400' : 'text-blue-400'
          }`}>
            {currentSession === 'work' ? '🍅 Focus Time' : '☕ Break Time'}
          </span>
        </div>

        <div className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 sm:mb-8 font-mono">
          {formattedTime()}
        </div>

        <div className="flex justify-center gap-3 sm:gap-4 mb-6">
          <button
            onClick={isRunning ? pause : start}
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-all min-w-[48px] min-h-[48px] sm:min-w-[64px] sm:min-h-[64px] ${
              isRunning 
                ? 'bg-yellow-600 hover:bg-yellow-500' 
                : 'bg-green-600 hover:bg-green-500'
            }`}
            aria-label={isRunning ? 'Pause timer' : 'Start timer'}
          >
            <span className="material-symbols-outlined text-2xl sm:text-3xl">
              {isRunning ? 'pause' : 'play_arrow'}
            </span>
          </button>

          <button
            onClick={reset}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors min-w-[48px] min-h-[48px] sm:min-w-[64px] sm:min-h-[64px]"
            aria-label="Reset timer"
          >
            <span className="material-symbols-outlined text-2xl sm:text-3xl">refresh</span>
          </button>

          <button
            onClick={skip}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors min-w-[48px] min-h-[48px] sm:min-w-[64px] sm:min-h-[64px]"
            aria-label="Skip session"
          >
            <span className="material-symbols-outlined text-2xl sm:text-3xl">skip_next</span>
          </button>

          <button
            onClick={fullScreen}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors min-w-[48px] min-h-[48px] sm:min-w-[64px] sm:min-h-[64px]"
            aria-label="Full screen"
          >
            <span className="material-symbols-outlined text-2xl sm:text-3xl">open_in_full</span>
          </button>

          <button
            onClick={() => setShowSettings(true)}
            className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gray-700 hover:bg-gray-600 flex items-center justify-center transition-colors min-w-[48px] min-h-[48px] sm:min-w-[64px] sm:min-h-[64px]"
          >
            <span className="material-symbols-outlined text-3xl">settings</span>
          </button>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ${
              isWorkSession ? 'bg-green-500' : 'bg-blue-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-[#171717] rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">Sessions</p>
          <p className="text-white text-2xl font-bold">{sessionsCompleted}</p>
        </div>
        
        <div className="bg-[#171717] rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">Focus Time</p>
          <p className="text-white text-2xl font-bold">
            {Math.floor(stats().todayFocusTime / 60)}m
          </p>
        </div>
        
        <div className="bg-[#171717] rounded-xl p-4 text-center">
          <p className="text-gray-400 text-sm">Today</p>
          <p className="text-white text-2xl font-bold">{stats().todaySessions}</p>
        </div>
      </div>

      {/* Session History */}
      {stats().todaySessions > 0 && (
        <div className="bg-[#171717] rounded-xl p-4">
          <h3 className="text-white font-medium mb-3">Today's Sessions</h3>
          <div className="space-y-2">
            {Array.from({ length: Math.min(stats().todaySessions, 5) }).map((_, i) => (
              <div 
                key={i}
                className="flex items-center gap-3 p-2 bg-gray-800 rounded-lg"
              >
                <span className="material-symbols-outlined text-green-500 text-sm">
                  check_circle
                </span>
                <span className="text-gray-300 text-sm">
                  Session {i + 1} completed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Full Screen Timer Overlay */}
      <FullScreenTimer />
      <FloatingTimer />

      {/* Settings Modal */}
      <TimerSettings 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </div>
  );
};

export default Timer;