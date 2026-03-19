import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/client";

export const fetchGoals = createAsyncThunk(
  "goals/fetchGoals",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.goals.getAll(params);
      return response.goals;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createGoal = createAsyncThunk(
  "goals/createGoal",
  async (goalData, { rejectWithValue }) => {
    try {
      const response = await api.goals.create(goalData);
      return response.goal;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateGoal = createAsyncThunk(
  "goals/updateGoal",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.goals.update(id, updates);
      return response.goal;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const incrementGoal = createAsyncThunk(
  "goals/incrementGoal",
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.goals.increment(id);
      return response.goal;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteGoal = createAsyncThunk(
  "goals/deleteGoal",
  async (id, { rejectWithValue }) => {
    try {
      await api.goals.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  goals: [],
  loading: false,
  error: null,
};

const goalsSlice = createSlice({
  name: "goals",
  initialState,
  reducers: {
    clearGoals: (state) => {
      state.goals = [];
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGoals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = action.payload;
      })
      .addCase(fetchGoals.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.goals.unshift(action.payload);
      })
      .addCase(createGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(updateGoal.fulfilled, (state, action) => {
        const index = state.goals.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
      })
      .addCase(incrementGoal.fulfilled, (state, action) => {
        const index = state.goals.findIndex((g) => g._id === action.payload._id);
        if (index !== -1) {
          state.goals[index] = action.payload;
        }
      })
      .addCase(deleteGoal.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        state.loading = false;
        state.goals = state.goals.filter((g) => g._id !== action.payload);
      })
      .addCase(deleteGoal.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearGoals, setLoading } = goalsSlice.actions;

export default goalsSlice.reducer;
