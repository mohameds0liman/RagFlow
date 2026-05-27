import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  TextField,
  MenuItem,
  Switch,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  IconX,
  IconRobot,
  IconCheck,
} from '@tabler/icons-react';
import StatusChip from '../../../components/StatusChip';
import ConfirmDialog from '../../../components/ConfirmDialog';
import * as usersApi from '../../../api/usersApi';
import * as chatbotApi from '../../../api/chatbotApi';
import {
  updateUserAccess,
  updateUserFeatures,
  updateUserRole,
  fetchChatbotAccess,
  grantChatbotAccess,
  revokeChatbotAccess,
  fetchUserById,
} from '../../../store/slices/usersSlice';

const DRAWER_WIDTH = 420;

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

const UserAccessDrawer = ({ open, onClose, user }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { saving, chatbotAccesses, chatbotAccessLoading } = useSelector((state) => state.users);

  const [userDetail, setUserDetail] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const [isActive, setIsActive] = useState(false);
  const [role, setRole] = useState('user');
  const [savingAccount, setSavingAccount] = useState(false);

  const [sttEnabled, setSttEnabled] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(100);
  const [savingFeatures, setSavingFeatures] = useState(false);

  const [allChatbots, setAllChatbots] = useState([]);
  const [selectedChatbotId, setSelectedChatbotId] = useState('');
  const [savingChatbot, setSavingChatbot] = useState(false);
  const [revokeConfirm, setRevokeConfirm] = useState(null);

  const loadData = useCallback(async () => {
    setLoadingDetail(true);
    try {
      const [userRes, chatbotRes] = await Promise.all([
        usersApi.getUser(user.id),
        chatbotApi.listChatbots(),
      ]);
      setUserDetail(userRes.data);
      setIsActive(userRes.data.is_active);
      setRole(userRes.data.role);
      setSttEnabled(userRes.data.stt_enabled);
      setTtsEnabled(userRes.data.tts_enabled);
      setDailyLimit(userRes.data.daily_message_limit ?? 100);
      setAllChatbots(chatbotRes.data.chatbots || []);
      dispatch(fetchChatbotAccess(user.id));
    } catch {
      enqueueSnackbar('Failed to load user details', { variant: 'error' });
    } finally {
      setLoadingDetail(false);
    }
  }, [user.id, dispatch, enqueueSnackbar]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open, loadData]);

  const handleSaveActive = async () => {
    setSavingAccount(true);
    try {
      await dispatch(updateUserAccess({ userId: user.id, granted: isActive })).unwrap();
      enqueueSnackbar('Access updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err || 'Failed to update access', { variant: 'error' });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveRole = async () => {
    setSavingAccount(true);
    try {
      await dispatch(updateUserRole({ userId: user.id, role })).unwrap();
      enqueueSnackbar('Role updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err || 'Failed to update role', { variant: 'error' });
    } finally {
      setSavingAccount(false);
    }
  };

  const handleSaveFeatures = async () => {
    setSavingFeatures(true);
    try {
      await dispatch(updateUserFeatures({
        userId: user.id,
        features: { stt_enabled: sttEnabled, tts_enabled: ttsEnabled, daily_message_limit: dailyLimit },
      })).unwrap();
      enqueueSnackbar('Features updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err || 'Failed to update features', { variant: 'error' });
    } finally {
      setSavingFeatures(false);
    }
  };

  const handleGrantChatbot = async () => {
    if (!selectedChatbotId) return;
    setSavingChatbot(true);
    try {
      await dispatch(grantChatbotAccess({ userId: user.id, chatbotId: selectedChatbotId })).unwrap();
      setSelectedChatbotId('');
      enqueueSnackbar('Chatbot access granted', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err || 'Failed to grant access', { variant: 'error' });
    } finally {
      setSavingChatbot(false);
    }
  };

  const handleRevokeChatbot = async () => {
    if (!revokeConfirm) return;
    try {
      await dispatch(revokeChatbotAccess({ userId: user.id, chatbotId: revokeConfirm.chatbot_id })).unwrap();
      enqueueSnackbar('Chatbot access revoked', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err || 'Failed to revoke access', { variant: 'error' });
    } finally {
      setRevokeConfirm(null);
    }
  };

  const grantedChatbotIds = chatbotAccesses.map((a) => a.chatbot_id);
  const availableChatbots = allChatbots.filter((b) => !grantedChatbotIds.includes(b.id));

  const getChatbotName = (chatbotId) => {
    const bot = allChatbots.find((b) => b.id === chatbotId);
    return bot?.name || chatbotId;
  };

  return (
    <>
      <Drawer
        anchor="right"
        open={open}
        onClose={onClose}
        PaperProps={{
          sx: {
            width: DRAWER_WIDTH,
            backgroundColor: theme.palette.background.paper,
            borderLeft: `1px solid ${theme.palette.divider}`,
          },
        }}
      >
        <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              p: 2,
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
              Manage User Access
            </Typography>
            <IconButton size="small" onClick={onClose}>
              <IconX size={20} />
            </IconButton>
          </Box>

          <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
            {loadingDetail ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {/* Account Section */}
                <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1.5 }}>
                      Account
                    </Typography>
                    <TextField
                      label="Username"
                      fullWidth
                      size="small"
                      value={user?.username || ''}
                      disabled
                      sx={{ mb: 1.5 }}
                    />
                    <TextField
                      label="Email"
                      fullWidth
                      size="small"
                      value={user?.email || ''}
                      disabled
                      sx={{ mb: 1.5 }}
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Active
                      </Typography>
                      <Switch
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
                      <TextField
                        select
                        label="Role"
                        size="small"
                        value={role}
                        onChange={(e) => setRole(e.target.value)}
                        sx={{ flex: 1 }}
                      >
                        {roleOptions.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                      </TextField>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleSaveRole}
                        disabled={savingAccount}
                        sx={{ minWidth: 60, height: 40 }}
                      >
                        {savingAccount ? <CircularProgress size={16} /> : 'Save'}
                      </Button>
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <StatusChip status={userDetail?.is_verified ? 'Active' : 'Pending'} />
                      <Typography variant="caption" sx={{ ml: 1, color: theme.palette.text.secondary }}>
                        {userDetail?.is_verified ? 'Verified' : 'Not verified'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>

                {/* Features Section */}
                <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1.5 }}>
                      Features
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Speech-to-Text (STT)
                      </Typography>
                      <Switch
                        checked={sttEnabled}
                        onChange={(e) => setSttEnabled(e.target.checked)}
                        size="small"
                      />
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                        Text-to-Speech (TTS)
                      </Typography>
                      <Switch
                        checked={ttsEnabled}
                        onChange={(e) => setTtsEnabled(e.target.checked)}
                        size="small"
                      />
                    </Box>
                    <TextField
                      label="Daily Message Limit"
                      type="number"
                      fullWidth
                      size="small"
                      value={dailyLimit}
                      onChange={(e) => setDailyLimit(parseInt(e.target.value, 10) || 0)}
                      sx={{ mb: 1.5 }}
                    />
                    <Button
                      variant="contained"
                      fullWidth
                      size="small"
                      onClick={handleSaveFeatures}
                      disabled={savingFeatures}
                    >
                      {savingFeatures ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                      Save Features
                    </Button>
                  </CardContent>
                </Card>

                {/* Chatbot Access Section */}
                <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1.5 }}>
                      Chatbot Access
                    </Typography>

                    {/* Granted chatbots */}
                    {chatbotAccessLoading ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={20} />
                      </Box>
                    ) : chatbotAccesses.length === 0 ? (
                      <Typography variant="body2" sx={{ color: theme.palette.text.disabled, mb: 1.5, fontStyle: 'italic' }}>
                        No chatbots granted yet
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
                        {chatbotAccesses.map((access) => (
                          <Chip
                            key={access.id}
                            icon={<IconRobot size={14} />}
                            label={getChatbotName(access.chatbot_id)}
                            onDelete={() => setRevokeConfirm(access)}
                            size="small"
                            variant="outlined"
                            sx={{
                              color: theme.palette.success.main,
                              borderColor: theme.palette.success.main,
                            }}
                          />
                        ))}
                      </Box>
                    )}

                    <Divider sx={{ borderColor: theme.palette.divider, mb: 1.5 }} />

                    {/* Grant new chatbot */}
                    <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}>
                      Grant Access
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <TextField
                        select
                        size="small"
                        value={selectedChatbotId}
                        onChange={(e) => setSelectedChatbotId(e.target.value)}
                        sx={{ flex: 1 }}
                        placeholder="Select chatbot"
                      >
                        <MenuItem value="">Select a chatbot</MenuItem>
                        {availableChatbots.map((bot) => (
                          <MenuItem key={bot.id} value={bot.id}>{bot.name}</MenuItem>
                        ))}
                      </TextField>
                      <Button
                        variant="contained"
                        size="small"
                        onClick={handleGrantChatbot}
                        disabled={!selectedChatbotId || savingChatbot}
                        sx={{ minWidth: 40, height: 40 }}
                      >
                        {savingChatbot ? <CircularProgress size={16} /> : <IconCheck size={18} />}
                      </Button>
                    </Box>
                    {availableChatbots.length === 0 && (
                      <Typography variant="caption" sx={{ color: theme.palette.text.disabled, mt: 0.5, display: 'block' }}>
                        All chatbots already granted
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Box>
            )}
          </Box>
        </Box>
      </Drawer>

      <ConfirmDialog
        open={!!revokeConfirm}
        title="Revoke Chatbot Access"
        message={`Are you sure you want to revoke access to "${getChatbotName(revokeConfirm?.chatbot_id)}"?`}
        confirmText="Revoke"
        onConfirm={handleRevokeChatbot}
        onCancel={() => setRevokeConfirm(null)}
        loading={saving}
      />
    </>
  );
};

export default UserAccessDrawer;
