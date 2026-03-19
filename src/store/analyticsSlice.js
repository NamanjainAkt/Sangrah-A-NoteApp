import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/client";

export const fetchActivity = createAsyncThunk(
  "analytics/fetchActivity",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.activity.getAll(params);
      return response.activities;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchHeatmap = createAsyncThunk(
  "analytics/fetchHeatmap",
  async (year, { rejectWithValue }) => {
    try {
      const response = await api.activity.getHeatmap(year);
      return response.activities;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const logActivity = createAsyncThunk(
  "analytics/logActivity",
  async (data, { rejectWithValue }) => {
    try {
      const response = await api.activity.log(data);
      return response.activity;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  activities: [],
  heatmap: [],
  status: "idle",
  error: null,
};

const analyticsSlice = createSlice({
  name: "analytics",
  initialState,
  reducers: {
    clearActivities: (state) => {
      state.activities = [];
      state.heatmap = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivity.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchActivity.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.activities = action.payload;
      })
      .addCase(fetchActivity.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(fetchHeatmap.fulfilled, (state, action) => {
        state.heatmap = action.payload;
      })
      .addCase(logActivity.fulfilled, (state, action) => {
        const index = state.activities.findIndex(
          (a) => a._id === action.payload._id
        );
        if (index !== -1) {
          state.activities[index] = action.payload;
        } else {
          state.activities.unshift(action.payload);
        }
      });
  },
});

export const { clearActivities } = analyticsSlice.actions;

export default analyticsSlice.reducer;
