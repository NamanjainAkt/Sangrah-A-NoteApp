import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Timer settings default values
const DEFAULT_WORK_DURATION = 25 * 60; // 25 minutes in seconds
const DEFAULT_BREAK_DURATION = 5 * 60; // 5 minutes in seconds

// Initial state for timer
const initialState = {
  isRunning: false,
  currentSession: 'work', // 'work' | 'break'
  timeLeft: DEFAULT_WORK_DURATION,
  workDuration: DEFAULT_WORK_DURATION,
  breakDuration: DEFAULT_BREAK_DURATION,
  sessionsCompleted: 0,
  totalFocusTime: 0, // in seconds
  sessionHistory: [],
  associatedNoteId: null,
  isMinimized: false,
  isFullScreen: false,
  soundEnabled: true,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

// Load timer state from localStorage
const loadTimerFromStorage = () => {
  try {
    const stored = localStorage.getItem('timerState');
    if (stored) {
      const data = JSON.parse(stored);
      return {
        ...initialState,
        ...data,
        isRunning: false, // Always start stopped for safety
      };
    }
  } catch (error) {
    console.error('Error loading timer state:', error);
  }
  return initialState;
};

// Save timer state to localStorage
const saveTimerToStorage = (state) => {
  try {
    localStorage.setItem('timerState', JSON.stringify({
      workDuration: state.workDuration,
      breakDuration: state.breakDuration,
      sessionsCompleted: state.sessionsCompleted,
      totalFocusTime: state.totalFocusTime,
      sessionHistory: state.sessionHistory.slice(-100), // Keep last 100 sessions
      soundEnabled: state.soundEnabled,
    }));
  } catch (error) {
    console.error('Error saving timer state:', error);
  }
};

// Timer thunk for persistent storage
export const persistTimerData = createAsyncThunk(
  'timer/persistData',
  async (_, { getState }) => {
    try {
      const state = getState();
      saveTimerToStorage(state.timer);
      return state.timer;
    } catch (error) {
      console.error('Error persisting timer data:', error);
      throw error;
    }
  }
);

const timerSlice = createSlice({
  name: 'timer',
  initialState: loadTimerFromStorage(),
  reducers: {
    /**
     * Start the timer
     */
    startTimer: (state) => {
      if (!state.isRunning) {
        state.isRunning = true;
      }
    },
    
    /**
     * Pause the timer
     */
    pauseTimer: (state) => {
      if (state.isRunning) {
        state.isRunning = false;
      }
    },
    
    /**
     * Reset timer to current session duration
     */
    resetTimer: (state) => {
      state.isRunning = false;
      state.timeLeft = state.currentSession === 'work' ? state.workDuration : state.breakDuration;
    },
    
    /**
     * Decrement time by one second
     * Called by the timer interval
     */
    tick: (state) => {
      if (state.isRunning && state.timeLeft > 0) {
        state.timeLeft -= 1;
        
        // Track focus time when in work session
        if (state.currentSession === 'work') {
          state.totalFocusTime += 1;
        }
      } else if (state.isRunning && state.timeLeft === 0) {
        // Timer completed - will be handled by completeSession
      }
    },
    
    /**
     * Complete current session and switch to next
     */
    completeSession: (state) => {
      state.isRunning = false;
      
      // Record session in history
      const sessionData = {
        id: Date.now(),
        type: state.currentSession,
        duration: state.currentSession === 'work' 
          ? state.workDuration - state.timeLeft 
          : state.breakDuration - state.timeLeft,
        originalDuration: state.currentSession === 'work' ? state.workDuration : state.breakDuration,
        associatedNoteId: state.associatedNoteId,
        completedAt: new Date().toISOString(),
      };
      
      state.sessionHistory.push(sessionData);
      
      // Keep only last 100 sessions
      if (state.sessionHistory.length > 100) {
        state.sessionHistory = state.sessionHistory.slice(-100);
      }
      
      // Update sessions completed for work sessions
      if (state.currentSession === 'work') {
        state.sessionsCompleted += 1;
      }
      
      // Switch session type
      state.currentSession = state.currentSession === 'work' ? 'break' : 'work';
      state.timeLeft = state.currentSession === 'work' ? state.workDuration : state.breakDuration;
      state.associatedNoteId = null; // Clear associated note
    },
    
    /**
     * Update timer settings
     */
    updateSettings: (state, action) => {
      const { workDuration, breakDuration, soundEnabled } = action.payload;
      
      if (workDuration !== undefined) {
        state.workDuration = Math.max(1, Math.min(120, workDuration)); // 1-120 minutes
      }
      if (breakDuration !== undefined) {
        state.breakDuration = Math.max(1, Math.min(30, breakDuration)); // 1-30 minutes
      }
      if (soundEnabled !== undefined) {
        state.soundEnabled = soundEnabled;
      }
      
      // Update current time if not running
      if (!state.isRunning) {
        state.timeLeft = state.currentSession === 'work' ? state.workDuration : state.breakDuration;
      }
    },
    
    /**
     * Associate timer with a note
     */
    associateWithNote: (state, action) => {
      state.associatedNoteId = action.payload;
    },
    
    /**
     * Toggle minimized state
     */
    toggleMinimize: (state) => {
      state.isMinimized = !state.isMinimized;
      if (state.isMinimized) {
        state.isFullScreen = false;
      }
    },
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullScreen: (state) => {
      state.isFullScreen = !state.isFullScreen;
      if (state.isFullScreen) {
        state.isMinimized = false;
      }
    },
    
    /**
     * Skip current session and switch to next
     */
    skipSession: (state) => {
      state.isRunning = false;
      state.currentSession = state.currentSession === 'work' ? 'break' : 'work';
      state.timeLeft = state.currentSession === 'work' ? state.workDuration : state.breakDuration;
    },
    
    /**
     * Clear session history
     */
    clearHistory: (state) => {
      state.sessionHistory = [];
      state.sessionsCompleted = 0;
      state.totalFocusTime = 0;
    },
    
    /**
     * Reset timer state completely
     */
    resetTimerState: (state) => {
      return initialState;
    },
  },
});

// Export actions
export const {
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
  clearHistory,
  resetTimerState,
} = timerSlice.actions;

// Selectors
export const selectTimer = (state) => state.timer;
export const selectIsRunning = (state) => state.timer.isRunning;
export const selectTimeLeft = (state) => state.timer.timeLeft;
export const selectCurrentSession = (state) => state.timer.currentSession;
export const selectSessionHistory = (state) => state.timer.sessionHistory;
export const selectTimerSettings = (state) => ({
  workDuration: state.timer.workDuration,
  breakDuration: state.timer.breakDuration,
  soundEnabled: state.timer.soundEnabled,
});
export const selectTimerStats = (state) => ({
  sessionsCompleted: state.timer.sessionsCompleted,
  totalFocusTime: state.timer.totalFocusTime,
  sessionHistory: state.timer.sessionHistory,
});

// Export reducer
export default timerSlice.reducer;