import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/client";

export const fetchGamification = createAsyncThunk(
  "gamification/fetchGamification",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.gamification.get();
      return response.gamification;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateGamification = createAsyncThunk(
  "gamification/updateGamification",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.gamification.update(data);
      return response.gamification;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  points: 0,
  level: 1,
  streak: { current: 0, longest: 0, lastActiveDate: null },
  badges: [],
  stats: {
    totalNotes: 0,
    totalGoals: 0,
    completedGoals: 0,
    totalTimerMinutes: 0,
  },
  progressToNextLevel: 0,
  pointsToNextLevel: 100,
  status: "idle",
  error: null,
};

const gamificationSlice = createSlice({
  name: "gamification",
  initialState,
  reducers: {
    addPoints: (state, action) => {
      state.points += action.payload;
    },
    addBadge: (state, action) => {
      const exists = state.badges.find((b) => b.id === action.payload.id);
      if (!exists) {
        state.badges.push(action.payload);
      }
    },
    clearGamification: (state) => {
      state.points = 0;
      state.level = 1;
      state.streak = { current: 0, longest: 0, lastActiveDate: null };
      state.badges = [];
      state.stats = {
        totalNotes: 0,
        totalGoals: 0,
        completedGoals: 0,
        totalTimerMinutes: 0,
      };
      state.progressToNextLevel = 0;
      state.pointsToNextLevel = 100;
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGamification.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchGamification.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.points = action.payload.points || 0;
        state.level = action.payload.level || 1;
        state.streak = action.payload.streak || state.streak;
        state.badges = action.payload.badges || [];
        state.stats = action.payload.stats || state.stats;
        state.progressToNextLevel = action.payload.progressToNextLevel || 0;
        state.pointsToNextLevel = action.payload.pointsToNextLevel || 100;
      })
      .addCase(fetchGamification.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(updateGamification.fulfilled, (state, action) => {
        const data = action.payload;
        if (data.points !== undefined) state.points = data.points;
        if (data.level !== undefined) state.level = data.level;
        if (data.badges !== undefined) state.badges = data.badges;
        if (data.streak !== undefined) state.streak = data.streak;
      });
  },
});

export const { addPoints, addBadge, clearGamification } = gamificationSlice.actions;

export default gamificationSlice.reducer;
