import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, useField } from 'formik';
import * as Yup from 'yup';
import {
  Box,
  TextField,
  Button,
  Typography,
  Avatar,
  CircularProgress,
  InputAdornment,
  IconButton,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
  useTheme,
} from '@mui/material';
import { IconEye, IconEyeOff } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import { login } from '../../store/slices/authSlice';

const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const PasswordField = ({ label, name }) => {
  const [field, meta] = useField(name);
  const [show, setShow] = useState(false);
  const theme = useTheme();

  return (
    <FormControl fullWidth variant="outlined" sx={{ mb: 1 }} error={meta.touched && Boolean(meta.error)}>
      <InputLabel>{label}</InputLabel>
      <OutlinedInput
        {...field}
        type={show ? 'text' : 'password'}
        label={label}
        endAdornment={
          <InputAdornment position="end">
            <IconButton onClick={() => setShow(!show)} edge="end" size="small" sx={{ color: theme.palette.text.secondary }}>
              {show ? <IconEyeOff size={20} /> : <IconEye size={20} />}
            </IconButton>
          </InputAdornment>
        }
      />
      {meta.touched && meta.error && <FormHelperText>{meta.error}</FormHelperText>}
    </FormControl>
  );
};

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const result = await dispatch(login(values));
      setSubmitting(false);
      if (login.fulfilled.match(result)) {
        const role = (result.payload.user?.role || result.payload.role || '').toLowerCase();
        navigate(role === 'admin' ? '/admin/dashboard' : '/chat');
      } else {
        console.error('Login rejected:', result);
        enqueueSnackbar(result.payload || 'Login failed', { variant: 'error' });
      }
    } catch (err) {
      setSubmitting(false);
      console.error('Login error:', err);
      enqueueSnackbar('An unexpected error occurred', { variant: 'error' });
    }
  };

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
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          p: 4,
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
        }}
      >
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
            Welcome to RAGFlow
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Sign in to your account
          </Typography>
        </Box>

        <Formik
          initialValues={{ email: '', password: '' }}
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
                sx={{ mb: 2 }}
              />
              <PasswordField label="Password" name="password" />

              <Box sx={{ textAlign: 'right', mb: 2 }}>
                <Link
                  to="/forgot-password"
                  style={{ color: theme.palette.primary.main, fontSize: '0.8125rem', textDecoration: 'none' }}
                >
                  Forgot password?
                </Link>
              </Box>

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting || loading}
                sx={{ py: 1.5, mb: 2 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Sign In'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, display: 'inline' }}>
                  Don't have an account?{' '}
                </Typography>
                <Link
                  to="/register"
                  style={{ color: theme.palette.primary.main, fontSize: '0.8125rem', textDecoration: 'none' }}
                >
                  Sign Up
                </Link>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  );
};

export default Login;
