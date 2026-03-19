import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import api from "../api/client";

export const fetchNotes = createAsyncThunk(
  "notes/fetchNotes",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await api.notes.getAll(params);
      return response.notes;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createNewNote = createAsyncThunk(
  "notes/createNote",
  async (noteData, { rejectWithValue }) => {
    try {
      const response = await api.notes.create(noteData);
      return response.note;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateExistingNote = createAsyncThunk(
  "notes/updateNote",
  async ({ noteId, noteData }, { rejectWithValue }) => {
    try {
      const response = await api.notes.update(noteId, noteData);
      return response.note;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNoteSoft = createAsyncThunk(
  "notes/deleteNoteSoft",
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await api.notes.delete(noteId);
      return response.note;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteNotePermantly = createAsyncThunk(
  "notes/deleteNote",
  async (noteId, { rejectWithValue }) => {
    try {
      await api.notes.permanentDelete(noteId);
      return noteId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const restoreNote = createAsyncThunk(
  "notes/restoreNote",
  async (noteId, { rejectWithValue }) => {
    try {
      const response = await api.notes.restore(noteId);
      return response.note;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  notes: [],
  status: "idle",
  error: null,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    clearNotes: (state) => {
      state.notes = [];
      state.status = "idle";
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotes.pending, (state) => {
        state.status = "loading";
      })
      .addCase(fetchNotes.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.notes = action.payload;
      })
      .addCase(fetchNotes.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
      })
      .addCase(createNewNote.fulfilled, (state, action) => {
        state.notes.unshift(action.payload);
      })
      .addCase(updateExistingNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex((note) => note._id === action.payload._id);
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
      })
      .addCase(deleteNoteSoft.fulfilled, (state, action) => {
        const index = state.notes.findIndex((note) => note._id === action.payload._id);
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
      })
      .addCase(deleteNotePermantly.fulfilled, (state, action) => {
        state.notes = state.notes.filter((note) => note._id !== action.payload);
      })
      .addCase(restoreNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex((note) => note._id === action.payload._id);
        if (index !== -1) {
          state.notes[index] = action.payload;
        }
      });
  },
});

export const { clearNotes } = notesSlice.actions;

export default notesSlice.reducer;
