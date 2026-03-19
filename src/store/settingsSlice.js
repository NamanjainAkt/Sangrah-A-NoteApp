import { createSlice } from '@reduxjs/toolkit';
import { saveToStorage, loadFromStorage, STORAGE_KEYS_ENUM } from '../utils/persistence';

// Settings state structure with default values
const initialState = {
  enableTodoChecklists: false,
  enableKanbanView: false,
  enableGamification: false,
  // Phase 2 toggles
  enableDisciplineHeatmap: false,
  enableGoalsAndStreaks: false,
  enableAnalyticsDashboard: false,
  enableEnhancedNotifications: false,
  // Phase 3 toggles
  enablePomodoroTimer: false,
  enableTags: false,
  enableReminders: false,
  enableDataExport: false,
};

// Settings slice with actions for toggling each setting
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Toggle todo checklists feature
    toggleTodoChecklists: (state) => {
      state.enableTodoChecklists = !state.enableTodoChecklists;
      // Save to storage
      saveToStorage(STORAGE_KEYS_ENUM.SETTINGS, state, { immediate: false });
    },
    // Toggle kanban view feature  
    toggleKanbanView: (state) => {
      state.enableKanbanView = !state.enableKanbanView;
      // Save to storage
      saveToStorage(STORAGE_KEYS_ENUM.SETTINGS, state, { immediate: false });
    },
    // Toggle gamification feature
    toggleGamification: (state) => {
      state.enableGamification = !state.enableGamification;
      // Save to storage
      saveToStorage(STORAGE_KEYS_ENUM.SETTINGS, state, { immediate: false });
    },
    // Phase 2 toggles
    // Toggle discipline heatmap feature
    toggleDisciplineHeatmap: (state) => {
      state.enableDisciplineHeatmap = !state.enableDisciplineHeatmap;
      // Save to storage
      saveToStorage(STORAGE_KEYS_ENUM.SETTINGS, state, { immediate: false });
    },
    // Toggle goals and streaks feature
    toggleGoalsAndStreaks: (state) => {
      state.enableGoalsAndStreaks = !state.enableGoalsAndStreaks;
      // Save to storage
      saveToStorage(STORAGE_KEYS_ENUM.SETTINGS, state, { immediate: false });
    },
    // Toggle analytics dashboard feature
    toggleAnalyticsDashboard: (state) => {
      state.enableAnalyticsDashboard = !state.enableAnalyticsDashboard;
      // Save to storage
      saveToStorage(STORAGE_KEYS_ENUM.SETTINGS, state, { immediate: false });
    },
    // Toggle enhanced notifications feature
    toggleEnhancedNotifications: (state) => {
      state.enableEnhancedNotifications = !state.enableEnhancedNotifications;
      // Save to storage
      saveToStorage(STORAGE_KEYS_ENUM.SETTINGS, state, { immediate: false });
    },
    // Phase 3 toggles
    // Toggle Pomodoro timer feature
    togglePomodoroTimer: (state) => {
      state.enablePomodoroTimer = !state.enablePomodoroTimer;
      // Save to storage
      saveToStorage(STORAGE_KEYS_ENUM.SETTINGS, state, { immediate: false });
    },
    // Toggle tags feature
    toggleTags: (state) => {
      state.enableTags = !state.enableTags;
      // Save to storage
      saveToStorage(STORAGE_KEYS_ENUM.SETTINGS, state, { immediate: false });
    },
    // Toggle reminders feature
    toggleReminders: (state) => {
      state.enableReminders = !state.enableReminders;
      // Save to storage
      saveToStorage(STORAGE_KEYS_ENUM.SETTINGS, state, { immediate: false });
    },
    // Toggle data export feature
    toggleDataExport: (state) => {
      state.enableDataExport = !state.enableDataExport;
      // Save to storage
      saveToStorage(STORAGE_KEYS_ENUM.SETTINGS, state, { immediate: false });
    },
    // Load settings from localStorage and merge with initial state
    loadSettingsFromStorage: (state, action) => {
      const storedSettings = action.payload;
      if (storedSettings) {
        // Remove metadata if present
        const { _meta, ...cleanSettings } = storedSettings;
        
        state.enableTodoChecklists = cleanSettings.enableTodoChecklists ?? false;
        state.enableKanbanView = cleanSettings.enableKanbanView ?? false;
        state.enableGamification = cleanSettings.enableGamification ?? false;
        // Phase 2 settings
        state.enableDisciplineHeatmap = cleanSettings.enableDisciplineHeatmap ?? false;
        state.enableGoalsAndStreaks = cleanSettings.enableGoalsAndStreaks ?? false;
        state.enableAnalyticsDashboard = cleanSettings.enableAnalyticsDashboard ?? false;
        state.enableEnhancedNotifications = cleanSettings.enableEnhancedNotifications ?? false;
        // Phase 3 settings
        state.enablePomodoroTimer = cleanSettings.enablePomodoroTimer ?? false;
        state.enableTags = cleanSettings.enableTags ?? false;
        state.enableReminders = cleanSettings.enableReminders ?? false;
        state.enableDataExport = cleanSettings.enableDataExport ?? false;
      }
    },
  },
});

// Export actions for dispatching
export const { 
  toggleTodoChecklists, 
  toggleKanbanView, 
  toggleGamification,
  toggleDisciplineHeatmap,
  toggleGoalsAndStreaks,
  toggleAnalyticsDashboard,
  toggleEnhancedNotifications,
  togglePomodoroTimer,
  toggleTags,
  toggleReminders,
  toggleDataExport,
  loadSettingsFromStorage 
} = settingsSlice.actions;

// Export reducer for store configuration
export default settingsSlice.reducer;