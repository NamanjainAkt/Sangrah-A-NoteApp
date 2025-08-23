import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import noteService from "../appwrite/config";

export const fetchNotes = createAsyncThunk(
  "notes/fetchNotes",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await noteService.getNotes(userId);
      return response.documents;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createNewNote = createAsyncThunk(
  "notes/createNote",
  async (noteData, { rejectWithValue }) => {
    try {
      const response = await noteService.createNote(noteData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateExistingNote = createAsyncThunk(
  "notes/updateNote",
  async ({ noteId, noteData }, { rejectWithValue }) => {
    try {
      const response = await noteService.updateNote(noteId, noteData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add this after the other async thunks
export const deleteNotePermantly = createAsyncThunk(
  "notes/deleteNote",
  async (noteId, { rejectWithValue }) => {
    try {
      const success = await noteService.deleteNote(noteId);
      if (success) return noteId;
      return rejectWithValue("Failed to delete note");
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const initialState = {
  notes: [],
  status: "idle", // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const notesSlice = createSlice({
  name: "notes",
  initialState,
  reducers: {
    clearNotes: (state) => {
      state.notes = [];
      state.status = 'idle';
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
        state.notes.push(action.payload);
      })
      .addCase(updateExistingNote.fulfilled, (state, action) => {
        const index = state.notes.findIndex(
          (note) => note.$id === action.payload.$id
        );

        if (index !== -1) {
          state.notes[index] = action.payload;
        }
      })
      .addCase(deleteNotePermantly.fulfilled, (state, action) => {
        state.notes = state.notes.filter(note => note.$id !== action.payload);
      })
  },
});

export const { clearNotes } = notesSlice.actions;

export default notesSlice.reducer;