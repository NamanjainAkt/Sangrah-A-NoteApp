import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/client";

export const fetchTags = createAsyncThunk(
  "tags/fetchTags",
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.tags.getAll();
      return response.tags;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createTag = createAsyncThunk(
  "tags/createTag",
  async (tagData, { rejectWithValue }) => {
    try {
      const response = await api.tags.create(tagData);
      return response.tag;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateTag = createAsyncThunk(
  "tags/updateTag",
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await api.tags.update(id, updates);
      return response.tag;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteTag = createAsyncThunk(
  "tags/deleteTag",
  async (id, { rejectWithValue }) => {
    try {
      await api.tags.delete(id);
      return id;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  tags: [],
  status: "idle",
  error: null,
};

const tagsSlice = createSlice({
  name: "tags",
  initialState,
  reducers: {
    clearTags: (state) => {
      state.tags = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTags.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchTags.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.tags = action.payload;
      })
      .addCase(fetchTags.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createTag.fulfilled, (state, action) => {
        state.tags.push(action.payload);
      })
      .addCase(updateTag.fulfilled, (state, action) => {
        const index = state.tags.findIndex((tag) => tag._id === action.payload._id);
        if (index !== -1) {
          state.tags[index] = action.payload;
        }
      })
      .addCase(deleteTag.fulfilled, (state, action) => {
        state.tags = state.tags.filter((tag) => tag._id !== action.payload);
      });
  },
});

export const { clearTags } = tagsSlice.actions;

export default tagsSlice.reducer;
