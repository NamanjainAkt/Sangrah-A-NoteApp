import { useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  startTimer, 
  pauseTimer, 
  resetTimer, 
  tick, 
  completeSession,
  updateSettings,
  associateWithNote,
  toggleMinimize,
  toggleFullScreen,
  skipSession,
  persistTimerData,
  selectTimer,
} from '../store/timerSlice';
import { addPoints, incrementStat, checkBadges } from '../store/gamificationSlice';
import { playSound, SOUND_TYPES } from '../utils/timer';

/**
 * Custom hook for managing timer functionality
 * Provides timer state management, session tracking, and sound notifications
 */
const useTimer = () => {
  const dispatch = useDispatch();
  const timerRef = useRef(null);
  const soundPlayedRef = useRef(false);

  // Select timer state from Redux
  const timer = useSelector(selectTimer);
  const {
    isRunning,
    currentSession,
    timeLeft,
    workDuration,
    breakDuration,
    sessionsCompleted,
    totalFocusTime,
    sessionHistory,
    associatedNoteId,
    isMinimized,
    isFullScreen,
    soundEnabled,
  } = timer;

  // Timer interval effect
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        dispatch(tick());
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isRunning, dispatch]);

  // Session completion effect
  useEffect(() => {
    if (timeLeft === 0 && isRunning && !soundPlayedRef.current) {
      soundPlayedRef.current = true;
      
      // Play completion sound
      if (soundEnabled) {
        playSound(
          currentSession === 'work' 
            ? SOUND_TYPES.SESSION_COMPLETE 
            : SOUND_TYPES.BREAK_COMPLETE
        );
      }

      // Complete the session
      dispatch(completeSession());

      // Award points for work sessions
      if (currentSession === 'work') {
        const pointsEarned = 10; // 10 points per completed session
        dispatch(addPoints(pointsEarned));
        dispatch(incrementStat('pomodoroSessions'));
        dispatch(checkBadges());
      }

      // Persist timer data
      dispatch(persistTimerData());

      // Reset sound flag after a delay
      setTimeout(() => {
        soundPlayedRef.current = false;
      }, 1000);
    }
  }, [timeLeft, isRunning, currentSession, soundEnabled, dispatch]);

  // Warning sound for low time (last 10 seconds)
  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 0 && isRunning && soundEnabled && !soundPlayedRef.current) {
      if (timeLeft === 10 || timeLeft === 5 || timeLeft === 3 || timeLeft === 2 || timeLeft === 1) {
        playSound(SOUND_TYPES.WARNING);
      }
    }
  }, [timeLeft, isRunning, soundEnabled]);

  // Start timer
  const start = useCallback(() => {
    dispatch(startTimer());
  }, [dispatch]);

  // Pause timer
  const pause = useCallback(() => {
    dispatch(pauseTimer());
    dispatch(persistTimerData());
  }, [dispatch]);

  // Reset timer
  const reset = useCallback(() => {
    dispatch(resetTimer());
    dispatch(persistTimerData());
  }, [dispatch]);

  // Skip to next session
  const skip = useCallback(() => {
    dispatch(skipSession());
    dispatch(persistTimerData());
  }, [dispatch]);

  // Update timer settings
  const updateTimerSettings = useCallback((settings) => {
    dispatch(updateSettings(settings));
    dispatch(persistTimerData());
  }, [dispatch]);

  // Associate timer with a note
  const associateNote = useCallback((noteId) => {
    dispatch(associateWithNote(noteId));
  }, [dispatch]);

  // Toggle minimized state
  const minimize = useCallback(() => {
    dispatch(toggleMinimize());
  }, [dispatch]);

  // Toggle fullscreen mode
  const fullScreen = useCallback(() => {
    dispatch(toggleFullScreen());
  }, [dispatch]);

  // Clear session history
  const clearHistory = useCallback(() => {
    dispatch(persistTimerData());
  }, [dispatch]);

  // Get formatted time
  const formattedTime = useCallback(() => {
    const hours = Math.floor(timeLeft / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    const seconds = timeLeft % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, [timeLeft]);

  // Calculate progress percentage
  const progress = useCallback(() => {
    const totalDuration = currentSession === 'work' ? workDuration : breakDuration;
    const elapsed = totalDuration - timeLeft;
    return Math.round((elapsed / totalDuration) * 100);
  }, [timeLeft, currentSession, workDuration, breakDuration]);

  // Get session statistics
  const stats = useCallback(() => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessionHistory.filter(
      s => s.completedAt.startsWith(today) && s.type === 'work'
    );
    
    const todayFocusTime = todaySessions.reduce((total, s) => total + s.duration, 0);
    const weeklyFocusTime = sessionHistory
      .filter(s => s.type === 'work')
      .reduce((total, s) => total + s.duration, 0);

    return {
      sessionsCompleted,
      totalFocusTime,
      todaySessions: todaySessions.length,
      todayFocusTime,
      weeklyFocusTime,
      averageSessionLength: sessionsCompleted > 0 
        ? Math.round(totalFocusTime / sessionsCompleted) 
        : 0,
    };
  }, [sessionsCompleted, totalFocusTime, sessionHistory]);

  return {
    // State
    isRunning,
    currentSession,
    timeLeft,
    workDuration,
    breakDuration,
    sessionsCompleted,
    totalFocusTime,
    sessionHistory,
    associatedNoteId,
    isMinimized,
    isFullScreen,
    soundEnabled,
    
    // Actions
    start,
    pause,
    reset,
    skip,
    updateTimerSettings,
    associateNote,
    minimize,
    fullScreen,
    clearHistory,
    
    // Computed values
    formattedTime,
    progress,
    stats,
    
    // Helpers
    isWorkSession: currentSession === 'work',
    isBreakSession: currentSession === 'break',
    sessionLabel: currentSession === 'work' ? 'Focus Time' : 'Break Time',
  };
};

export default useTimer;