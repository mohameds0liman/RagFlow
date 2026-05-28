import { useState, useEffect } from 'react';
import { useSnackbar } from 'notistack';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Chip,
  CircularProgress,
  IconButton,
  useTheme,
} from '@mui/material';
import { IconArrowLeft } from '@tabler/icons-react';
import MainCard from '../../components/MainCard';
import * as profileApi from '../../api/profileApi';

const UserProfilePage = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({ profile: false, password: false });

  const [username, setUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await profileApi.getUserProfile();
        setProfile(data.profile);
        setUsername(data.profile.username || '');
      } catch (err) {
        enqueueSnackbar(err.response?.data?.detail || 'Failed to load profile', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [enqueueSnackbar]);

  const handleSaveProfile = async () => {
    setSaving((prev) => ({ ...prev, profile: true }));
    try {
      const { data } = await profileApi.updateUserProfile({ username });
      setProfile(data.profile);
      enqueueSnackbar('Profile updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to update profile', { variant: 'error' });
    } finally {
      setSaving((prev) => ({ ...prev, profile: false }));
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      enqueueSnackbar('Passwords do not match', { variant: 'error' });
      return;
    }
    setSaving((prev) => ({ ...prev, password: true }));
    try {
      await profileApi.changeUserPassword(currentPassword, newPassword);
      enqueueSnackbar('Password updated', { variant: 'success' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to change password', { variant: 'error' });
    } finally {
      setSaving((prev) => ({ ...prev, password: false }));
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 720, mx: 'auto', py: 4, px: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <IconButton onClick={() => navigate('/chat')} sx={{ color: theme.palette.text.secondary }}>
          <IconArrowLeft size={22} />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Profile
        </Typography>
      </Box>

      <MainCard title="Personal Info" sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            fullWidth
          />
          <TextField
            label="Email"
            value={profile?.email || ''}
            fullWidth
            disabled
            helperText="Email cannot be changed"
          />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Role:
            </Typography>
            <Chip
              label={profile?.role || 'user'}
              size="small"
              sx={{
                bgcolor: `${theme.palette.primary.main}20`,
                color: theme.palette.primary.main,
                fontWeight: 600,
                textTransform: 'capitalize',
              }}
            />
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSaveProfile}
              disabled={saving.profile}
              startIcon={saving.profile ? <CircularProgress size={16} /> : null}
            >
              {saving.profile ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>
      </MainCard>

      <MainCard title="Change Password">
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
          <TextField
            label="Current Password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            fullWidth
          />
          <TextField
            label="New Password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            fullWidth
          />
          <TextField
            label="Confirm New Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            fullWidth
          />
          <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleChangePassword}
              disabled={saving.password || !currentPassword || !newPassword || !confirmPassword}
              startIcon={saving.password ? <CircularProgress size={16} /> : null}
            >
              {saving.password ? 'Saving...' : 'Save'}
            </Button>
          </Box>
        </Box>
      </MainCard>
    </Box>
  );
};

export default UserProfilePage;
