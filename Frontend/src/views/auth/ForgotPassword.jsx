import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  useTheme,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { forgotPasswordApi } from '../../api/authApi';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
});

const ForgotPassword = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const [sent, setSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await forgotPasswordApi(values.email);
      setSentEmail(values.email);
      setSent(true);
      enqueueSnackbar('Reset link sent to your email', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to send reset link', {
        variant: 'error',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const cardSx = {
    width: '100%',
    maxWidth: 400,
    p: 4,
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: '12px',
  };

  if (sent) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Box sx={{ ...cardSx, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
            Check Your Email
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
            We've sent a password reset link to {sentEmail}
          </Typography>
          <Button fullWidth variant="contained" onClick={() => navigate('/login')}>
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
        backgroundColor: theme.palette.background.default,
      }}
    >
      <Box sx={cardSx}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Avatar
            sx={{
              bgcolor: theme.palette.primary.main,
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: theme.palette.text.primary }}>
            Reset Password
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Enter your email to receive a reset link
          </Typography>
        </Box>

        <Formik
          initialValues={{ email: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Field
                as={TextField}
                fullWidth
                name="email"
                label="Email"
                type="email"
                error={touched.email && Boolean(errors.email)}
                helperText={touched.email && errors.email}
                sx={{ mb: 3 }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting}
                sx={{ py: 1.5, mb: 2 }}
              >
                {isSubmitting ? 'Sending...' : 'Send Reset Link'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Link
                  to="/login"
                  style={{ color: theme.palette.primary.main, fontSize: '0.8125rem', textDecoration: 'none' }}
                >
                  Back to Sign In
                </Link>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  );
};

export default ForgotPassword;
