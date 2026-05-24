import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Link,
  CircularProgress,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { login, clearError } from '../../store/slices/authSlice';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { loading, error } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(login({ email, password }));
    if (login.fulfilled.match(result)) {
      const role = result.payload.role;
      navigate(role === 'admin' ? '/admin/dashboard' : '/chat');
    } else {
      enqueueSnackbar(result.payload || 'Login failed', { variant: 'error' });
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1A1F2E',
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 4,
          backgroundColor: '#1E2330',
          border: '1px solid #2D3448',
          borderRadius: '12px',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: '#4B72FF',
              width: 48,
              height: 48,
              borderRadius: 2,
              fontWeight: 700,
              fontSize: '1.25rem',
              mx: 'auto',
              mb: 1.5,
            }}
          >
            R
          </Avatar>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#E0E0E0' }}>
            Welcome to RAGFlow
          </Typography>
          <Typography variant="body2" sx={{ color: '#9099B0', mt: 0.5 }}>
            Sign in to your account
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          sx={{ mb: 1 }}
        />

        <Box sx={{ textAlign: 'right', mb: 2 }}>
          <Link
            href="/forgot-password"
            underline="hover"
            sx={{ color: '#4B72FF', fontSize: '0.8125rem', cursor: 'pointer' }}
          >
            Forgot password?
          </Link>
        </Box>

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ py: 1.5 }}
        >
          {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
        </Button>
      </Box>
    </Box>
  );
};

export default Login;
