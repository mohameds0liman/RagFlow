import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginApi, registerApi, logoutApi } from '../../api/authApi';

export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const { data } = await loginApi(email, password);
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('role', data.user.role);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ username, email, password }, { rejectWithValue }) => {
    try {
      const { data } = await registerApi(username, email, password);
      return data;
    } catch (err) {
      return rejectWithValue(err.response?.data?.detail || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    await logoutApi();
  } catch {
  } finally {
    localStorage.clear();
  }
});

const initialState = {
  user: null,
  role: localStorage.getItem('role') || null,
  accessToken: localStorage.getItem('access_token') || null,
  refreshToken: null,
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.role = action.payload.user.role;
        state.accessToken = action.payload.access_token;
        state.refreshToken = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.role = null;
        state.accessToken = null;
        state.refreshToken = null;
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
