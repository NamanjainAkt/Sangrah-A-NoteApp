import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/client";

export const fetchReminders = createAsyncThunk(
  "reminders/fetchReminders",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.reminders.getAll(params);
      return response.reminders;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createReminder = createAsyncThunk(
  "reminders/createReminder",
  async (reminderData, { rejectWithValue }) => {
    try {
      const response = await api.reminders.create(reminderData);
      return response.reminder;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateReminder = createAsyncThunk(
  "reminders/updateReminder",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.reminders.update(id, updates);
      return response.reminder;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteReminder = createAsyncThunk(
  "reminders/deleteReminder",
  async (id, { rejectWithValue }) => {
    try {
      await api.reminders.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  reminders: [],
  status: "idle",
  error: null,
};

const remindersSlice = createSlice({
  name: "reminders",
  initialState,
  reducers: {
    clearReminders: (state) => {
      state.reminders = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReminders.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchReminders.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.reminders = action.payload;
      })
      .addCase(fetchReminders.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createReminder.fulfilled, (state, action) => {
        state.reminders.push(action.payload);
      })
      .addCase(updateReminder.fulfilled, (state, action) => {
        const index = state.reminders.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.reminders[index] = action.payload;
        }
      })
      .addCase(deleteReminder.fulfilled, (state, action) => {
        state.reminders = state.reminders.filter((r) => r._id !== action.payload);
      });
  },
});

export const { clearReminders } = remindersSlice.actions;

export default remindersSlice.reducer;
