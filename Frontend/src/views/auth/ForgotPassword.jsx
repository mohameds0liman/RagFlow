import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  Link,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import api from '../../api/axiosInstance';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSent(true);
      enqueueSnackbar('Reset link sent to your email', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to send reset link', {
        variant: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
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
          sx={{
            width: '100%',
            maxWidth: 400,
            p: 4,
            backgroundColor: '#1E2330',
            border: '1px solid #2D3448',
            borderRadius: '12px',
            textAlign: 'center',
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 600, color: '#E0E0E0', mb: 1 }}>
            Check Your Email
          </Typography>
          <Typography variant="body2" sx={{ color: '#9099B0', mb: 3 }}>
            We've sent a password reset link to {email}
          </Typography>
          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/login')}
          >
            Back to Sign In
          </Button>
        </Box>
      </Box>
    );
  }

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
            Reset Password
          </Typography>
          <Typography variant="body2" sx={{ color: '#9099B0', mt: 0.5 }}>
            Enter your email to receive a reset link
          </Typography>
        </Box>

        <TextField
          fullWidth
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          sx={{ mb: 3 }}
        />

        <Button
          type="submit"
          fullWidth
          variant="contained"
          disabled={loading}
          sx={{ py: 1.5, mb: 2 }}
        >
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>

        <Box sx={{ textAlign: 'center' }}>
          <Link
            underline="hover"
            sx={{ color: '#4B72FF', fontSize: '0.8125rem', cursor: 'pointer' }}
            onClick={() => navigate('/login')}
          >
            Back to Sign In
          </Link>
        </Box>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
