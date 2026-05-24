import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, useField, useFormikContext } from 'formik';
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
  LinearProgress,
  FormControl,
  InputLabel,
  OutlinedInput,
  FormHelperText,
  useTheme,
} from '@mui/material';
import { IconEye, IconEyeOff, IconCheck, IconX } from '@tabler/icons-react';
import { useSnackbar } from 'notistack';
import { register } from '../../store/slices/authSlice';

const validationSchema = Yup.object({
  username: Yup.string()
    .min(3, 'Username must be at least 3 characters')
    .max(64, 'Username too long')
    .required('Username is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Za-z]/, 'Password must contain letters')
    .matches(/[0-9]/, 'Password must contain numbers')
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords must match')
    .required('Please confirm your password'),
});

const PasswordField = ({ label, name }) => {
  const [field, meta] = useField(name);
  const [show, setShow] = useState(false);
  const theme = useTheme();

  return (
    <FormControl fullWidth variant="outlined" sx={{ mb: name === 'password' ? 0.5 : 2 }} error={meta.touched && Boolean(meta.error)}>
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

const requirements = [
  { label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { label: 'Contains a letter', test: (v) => /[A-Za-z]/.test(v) },
  { label: 'Contains a number', test: (v) => /[0-9]/.test(v) },
];

const PasswordStrength = () => {
  const { values } = useFormikContext();
  const theme = useTheme();
  const password = values.password || '';

  const checks = useMemo(() => requirements.map((r) => r.test(password)), [password]);
  const score = checks.filter(Boolean).length;
  const strength = score === 0 ? '' : score <= 1 ? 'Weak' : score === 2 ? 'Medium' : 'Strong';
  const color = score === 0 ? 'transparent' : score <= 1 ? '#E74C3C' : score === 2 ? '#F39C12' : '#27AE60';

  if (!password) return null;

  return (
    <Box sx={{ mb: 2, mt: 0.5 }}>
      <LinearProgress
        variant="determinate"
        value={(score / 3) * 100}
        sx={{
          height: 4,
          borderRadius: 2,
          backgroundColor: theme.palette.divider,
          '& .MuiLinearProgress-bar': { backgroundColor: color },
        }}
      />
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, mb: 1 }}>
        <Typography variant="caption" sx={{ color }}>
          {strength || ''}
        </Typography>
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
          {score}/3
        </Typography>
      </Box>
      {requirements.map((req, i) => (
        <Box key={req.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.25 }}>
          {checks[i] ? (
            <IconCheck size={14} color="#27AE60" />
          ) : (
            <IconX size={14} color={theme.palette.text.secondary} />
          )}
          <Typography variant="caption" sx={{ color: checks[i] ? '#27AE60' : theme.palette.text.secondary }}>
            {req.label}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const Register = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();
  const { loading } = useSelector((state) => state.auth);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      const result = await dispatch(register({
        username: values.username,
        email: values.email,
        password: values.password,
      }));
      setSubmitting(false);
      if (register.fulfilled.match(result)) {
        enqueueSnackbar('Account created successfully! Please sign in.', { variant: 'success' });
        navigate('/login');
      } else {
        enqueueSnackbar(result.payload || 'Registration failed', { variant: 'error' });
      }
    } catch (err) {
      setSubmitting(false);
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
            Create Account
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 0.5 }}>
            Sign up for a new account
          </Typography>
        </Box>

        <Formik
          initialValues={{ username: '', email: '', password: '', confirmPassword: '' }}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ errors, touched, isSubmitting }) => (
            <Form>
              <Field
                as={TextField}
                fullWidth
                name="username"
                label="Username"
                error={touched.username && Boolean(errors.username)}
                helperText={touched.username && errors.username}
                sx={{ mb: 2 }}
              />
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
              <PasswordStrength />
              <PasswordField label="Confirm Password" name="confirmPassword" />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                disabled={isSubmitting || loading}
                sx={{ py: 1.5, mb: 2 }}
              >
                {loading ? <CircularProgress size={22} color="inherit" /> : 'Create Account'}
              </Button>

              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, display: 'inline' }}>
                  Already have an account?{' '}
                </Typography>
                <Link
                  to="/login"
                  style={{ color: theme.palette.primary.main, fontSize: '0.8125rem', textDecoration: 'none' }}
                >
                  Sign In
                </Link>
              </Box>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  );
};

export default Register;
