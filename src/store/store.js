import {configureStore} from '@reduxjs/toolkit';
import authSlice from './authSlice';
import notesSlice from './notesSlice';

const store = configureStore({
    reducer: {
        auth: authSlice,
        notes: notesSlice
    }
});

export default store;