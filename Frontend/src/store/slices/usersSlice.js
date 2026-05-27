import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import * as usersApi from '../../api/usersApi';

export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await usersApi.listUsers();
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await usersApi.getUser(id);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch user');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id, { rejectWithValue }) => {
    try {
      await usersApi.deleteUser(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to delete user');
    }
  }
);

export const updateUserAccess = createAsyncThunk(
  'users/updateAccess',
  async ({ userId, granted }, { rejectWithValue }) => {
    try {
      const { data } = await usersApi.updateUserAccess(userId, granted);
      return { userId, ...data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update access');
    }
  }
);

export const updateUserFeatures = createAsyncThunk(
  'users/updateFeatures',
  async ({ userId, features }, { rejectWithValue }) => {
    try {
      const { data } = await usersApi.updateUserFeatures(userId, features);
      return { userId, ...data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update features');
    }
  }
);

export const updateUserRole = createAsyncThunk(
  'users/updateRole',
  async ({ userId, role }, { rejectWithValue }) => {
    try {
      const { data } = await usersApi.updateUserRole(userId, role);
      return { userId, ...data };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to update role');
    }
  }
);

export const fetchChatbotAccess = createAsyncThunk(
  'users/fetchChatbotAccess',
  async (userId, { rejectWithValue }) => {
    try {
      const { data } = await usersApi.listChatbotAccess(userId);
      return { userId, accesses: data.accesses };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to fetch chatbot access');
    }
  }
);

export const grantChatbotAccess = createAsyncThunk(
  'users/grantChatbotAccess',
  async ({ userId, chatbotId }, { rejectWithValue }) => {
    try {
      const { data } = await usersApi.grantChatbotAccess(userId, chatbotId);
      return { userId, access: data.access };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to grant chatbot access');
    }
  }
);

export const revokeChatbotAccess = createAsyncThunk(
  'users/revokeChatbotAccess',
  async ({ userId, chatbotId }, { rejectWithValue }) => {
    try {
      await usersApi.revokeChatbotAccess(userId, chatbotId);
      return { userId, chatbotId };
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Failed to revoke chatbot access');
    }
  }
);

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    list: [],
    total: 0,
    selectedUser: null,
    loading: false,
    saving: false,
    error: null,
    chatbotAccesses: [],
    chatbotAccessLoading: false,
  },
  reducers: {
    clearSelectedUser: (state) => {
      state.selectedUser = null;
      state.chatbotAccesses = [];
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.users;
        state.total = action.payload.total;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchUserById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedUser = action.payload;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(deleteUser.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.saving = false;
        state.list = state.list.filter((u) => u.id !== action.payload);
        if (state.selectedUser?.id === action.payload) state.selectedUser = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.saving = false;
        state.error = action.payload;
      })
      .addCase(updateUserAccess.fulfilled, (state, action) => {
        const user = state.list.find((u) => u.id === action.payload.userId);
        if (user) {
          user.initial_access_granted = action.payload.initial_access_granted;
        }
        if (state.selectedUser?.id === action.payload.userId) {
          state.selectedUser.initial_access_granted = action.payload.initial_access_granted;
        }
      })
      .addCase(updateUserFeatures.fulfilled, (state, action) => {
        const user = state.list.find((u) => u.id === action.payload.userId);
        if (user) {
          user.stt_enabled = action.payload.stt_enabled;
          user.tts_enabled = action.payload.tts_enabled;
          user.daily_message_limit = action.payload.daily_message_limit;
        }
        if (state.selectedUser?.id === action.payload.userId) {
          state.selectedUser.stt_enabled = action.payload.stt_enabled;
          state.selectedUser.tts_enabled = action.payload.tts_enabled;
          state.selectedUser.daily_message_limit = action.payload.daily_message_limit;
        }
      })
      .addCase(updateUserRole.fulfilled, (state, action) => {
        const user = state.list.find((u) => u.id === action.payload.userId);
        if (user) user.role = action.payload.role;
        if (state.selectedUser?.id === action.payload.userId) {
          state.selectedUser.role = action.payload.role;
        }
      })
      .addCase(fetchChatbotAccess.pending, (state) => {
        state.chatbotAccessLoading = true;
      })
      .addCase(fetchChatbotAccess.fulfilled, (state, action) => {
        state.chatbotAccessLoading = false;
        state.chatbotAccesses = action.payload.accesses;
      })
      .addCase(fetchChatbotAccess.rejected, (state, action) => {
        state.chatbotAccessLoading = false;
        state.error = action.payload;
      })
      .addCase(grantChatbotAccess.fulfilled, (state, action) => {
        state.chatbotAccesses.push(action.payload.access);
      })
      .addCase(grantChatbotAccess.rejected, (state, action) => {
        state.error = action.payload;
      })
      .addCase(revokeChatbotAccess.fulfilled, (state, action) => {
        state.chatbotAccesses = state.chatbotAccesses.filter(
          (a) => a.chatbot_id !== action.payload.chatbotId
        );
      })
      .addCase(revokeChatbotAccess.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearSelectedUser, clearError } = usersSlice.actions;
export default usersSlice.reducer;
