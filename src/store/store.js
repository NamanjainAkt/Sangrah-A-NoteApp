import {configureStore} from '@reduxjs/toolkit';
import authSlice from './authSlice';
import notesSlice from './notesSlice';
import settingsSlice from './settingsSlice';
import gamificationSlice from './gamificationSlice';
import goalsSlice from './goalsSlice';
import analyticsSlice from './analyticsSlice';
import notificationsSlice from './notificationsSlice';
import timerSlice from './timerSlice';
import tagsSlice from './tagsSlice';
import remindersSlice from './remindersSlice';

const store = configureStore({
    reducer: {
        auth: authSlice,
        notes: notesSlice,
        settings: settingsSlice,
        gamification: gamificationSlice,
        goals: goalsSlice,
        analytics: analyticsSlice,
        notifications: notificationsSlice,
        timer: timerSlice,
        tags: tagsSlice,
        reminders: remindersSlice,
    },
});

export default store;