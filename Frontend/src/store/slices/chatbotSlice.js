import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as chatbotApi from '../../api/chatbotApi';

export const fetchChatbots = createAsyncThunk(
  'chatbots/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await chatbotApi.listChatbots();
      return data.chatbots;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch chatbots');
    }
  }
);

export const fetchChatbotById = createAsyncThunk(
  'chatbots/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await chatbotApi.getChatbot(id);
      return data.chatbot;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch chatbot');
    }
  }
);

export const createChatbot = createAsyncThunk(
  'chatbots/create',
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await chatbotApi.createChatbot(payload);
      return data.chatbot;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to create chatbot');
    }
  }
);

export const updateChatbot = createAsyncThunk(
  'chatbots/update',
  async ({ id, payload }, { rejectWithValue }) => {
    try {
      const { data } = await chatbotApi.updateChatbot(id, payload);
      return data.chatbot;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update chatbot');
    }
  }
);

export const deleteChatbot = createAsyncThunk(
  'chatbots/delete',
  async (id, { rejectWithValue }) => {
    try {
      await chatbotApi.deleteChatbot(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to delete chatbot');
    }
  }
);

const chatbotSlice = createSlice({
  name: 'chatbots',
  initialState: {
    list: [],
    selectedChatbot: null,
    loading: false,
    saving: false,
    error: null,
  },
  reducers: {
    clearSelectedChatbot: (state) => {
      state.selectedChatbot = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateSelectedChatbot: (state, action) => {
      state.selectedChatbot = { ...state.selectedChatbot, ...action.payload };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChatbots.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatbots.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(fetchChatbots.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchChatbotById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChatbotById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedChatbot = action.payload;
      })
      .addCase(fetchChatbotById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(createChatbot.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(createChatbot.fulfilled, (state, action) => {
        state.saving = false;
        state.list.unshift(action.payload);
      })
      .addCase(createChatbot.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(updateChatbot.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateChatbot.fulfilled, (state, action) => {
        state.saving = false;
        const idx = state.list.findIndex((b) => b.id === action.payload.id);
        if (idx !== -1) state.list[idx] = action.payload;
        if (state.selectedChatbot?.id === action.payload.id) state.selectedChatbot = action.payload;
      })
      .addCase(updateChatbot.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(deleteChatbot.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteChatbot.fulfilled, (state, action) => {
        state.saving = false;
        state.list = state.list.filter((b) => b.id !== action.payload);
        if (state.selectedChatbot?.id === action.payload) state.selectedChatbot = null;
      })
      .addCase(deleteChatbot.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedChatbot, clearError, updateSelectedChatbot } = chatbotSlice.actions;
export default chatbotSlice.reducer;
