import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useSnackbar } from 'notistack';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  ListItemIcon,
  Button,
  CircularProgress,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  Menu,
  MenuItem,
  TextField,
  useTheme,
} from '@mui/material';
import {
  IconEdit,
  IconTrash,
  IconMessage,
  IconRobot,
  IconUserCircle,
  IconLogout,
  IconSun,
  IconMoon,
  IconDotsVertical,
  IconPencil,
} from '@tabler/icons-react';
import ChatWindow from '../../components/ChatWindow';
import ConfirmDialog from '../../components/ConfirmDialog';
import * as chatApi from '../../api/chatApi';
import * as profileApi from '../../api/profileApi';
import { setUserChatbots, setSelectedUserChatbot, setActiveSessionId } from '../../store/slices/userChatSlice';
import { logout } from '../../store/slices/authSlice';
import { toggleTheme } from '../../store/slices/themeSlice';

const getBotColor = (name) => {
  const colors = ['#4B72FF', '#E74C3C', '#27AE60', '#F39C12', '#9B59B6', '#1ABC9C'];
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getDateGroup = (dateStr) => {
  if (!dateStr) return 'Older';
  const date = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setDate(yesterdayStart.getDate() - 1);

  if (date >= todayStart) return 'Today';
  if (date >= yesterdayStart) return 'Yesterday';
  return 'Older';
};

const UserChat = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const dispatch = useDispatch();
  const themeMode = useSelector((state) => state.theme.mode);
  const chatbots = useSelector((state) => state.userChat.chatbots);
  const selectedChatbot = useSelector((state) => state.userChat.selectedChatbot);

  const [allSessions, setAllSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [hoveredSession, setHoveredSession] = useState(null);
  const [newChatDialogOpen, setNewChatDialogOpen] = useState(false);
  const [menuAnchorEl, setMenuAnchorEl] = useState(null);
  const [menuSession, setMenuSession] = useState(null);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renameSession, setRenameSession] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const prevBotIdRef = useRef(null);

  const groupedSessions = useMemo(() => {
    const groups = { Today: [], Yesterday: [], Older: [] };
    allSessions.forEach((s) => {
      const group = getDateGroup(s.updated_date || s.created_date);
      groups[group].push(s);
    });
    return groups;
  }, [allSessions]);

  const groupOrder = ['Today', 'Yesterday', 'Older'];

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await chatApi.userListChatbots();
        dispatch(setUserChatbots(data.chatbots || []));
      } catch (err) {
        enqueueSnackbar(err.response?.data?.detail || 'Failed to load chatbots', { variant: 'error' });
      }
    };
    load();
  }, [dispatch, enqueueSnackbar]);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await profileApi.getUserProfile();
      } catch {}
    };
    loadProfile();
  }, []);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await chatApi.userListSessions();
      setAllSessions(data.sessions || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to load sessions', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  const switchSession = useCallback(async (session) => {
    setActiveSession(session);
    dispatch(setActiveSessionId(session.id));
    const bot = chatbots.find((b) => b.id === session.chatbot_id);
    if (bot) {
      dispatch(setSelectedUserChatbot(bot));
    }
    try {
      const { data } = await chatApi.userListMessages(session.id);
      setMessages(data.messages || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to load messages', { variant: 'error' });
    }
  }, [dispatch, chatbots, enqueueSnackbar]);

  const handleSend = async (message) => {
    if (!activeSession || !selectedChatbot) return;
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: 'human', content: message },
    ]);
    try {
      const { data } = await chatApi.userSendMessage(
        selectedChatbot.id,
        activeSession.id,
        message
      );
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        data.user_message,
        data.ai_message,
      ]);
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      enqueueSnackbar(
        err.response?.data?.detail || 'Failed to send message',
        { variant: 'error' }
      );
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteConfirm) return;
    try {
      await chatApi.userDeleteSession(deleteConfirm.id);
      const remaining = allSessions.filter((s) => s.id !== deleteConfirm.id);
      setAllSessions(remaining);
      if (activeSession?.id === deleteConfirm.id) {
        if (remaining.length > 0) {
          await switchSession(remaining[0]);
        } else {
          setActiveSession(null);
          setMessages([]);
          dispatch(setActiveSessionId(null));
        }
      }
      enqueueSnackbar('Session deleted', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to delete session', { variant: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleCreateSession = async (bot) => {
    setNewChatDialogOpen(false);
    try {
      const { data } = await chatApi.userCreateSession(bot.id);
      const newSession = data.session;

      if (newSession) {
        await chatApi.userUpdateSession(newSession.id, { title: bot.name });
        newSession.title = bot.name;
      }

      dispatch(setSelectedUserChatbot(bot));
      dispatch(setActiveSessionId(newSession.id));
      setAllSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      setMessages([]);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to create session', { variant: 'error' });
    }
  };

  const handleRename = async () => {
    if (!renameSession || !renameValue.trim()) return;
    try {
      await chatApi.userUpdateSession(renameSession.id, { title: renameValue.trim() });
      setAllSessions((prev) =>
        prev.map((s) =>
          s.id === renameSession.id ? { ...s, title: renameValue.trim() } : s
        )
      );
      if (activeSession?.id === renameSession.id) {
        setActiveSession((prev) => ({ ...prev, title: renameValue.trim() }));
      }
      enqueueSnackbar('Session renamed', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to rename session', { variant: 'error' });
    } finally {
      setRenameDialogOpen(false);
      setRenameSession(null);
      setRenameValue('');
    }
  };

  const handleLogout = useCallback(async () => {
    await dispatch(logout());
    navigate('/login');
  }, [dispatch, navigate]);

  const getSessionTitle = (session) => {
    if (session.title) return session.title;
    return session.chatbot_name || 'Chat';
  };

  const getRelativeTimestamp = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Box sx={{ display: 'flex', height: '100%', gap: 0 }}>
      {/* Left panel - Session list */}
      <Box
        sx={{
          width: 280,
          borderRight: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.mode === 'dark' ? '#182840' : '#E8F4FD',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* New Chat button */}
        {chatbots.length > 0 && (
          <Box sx={{ p: 1.5, pb: 0.5 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<IconEdit size={16} />}
              onClick={() => setNewChatDialogOpen(true)}
              sx={{
                borderRadius: '10px',
                borderColor: theme.palette.primary.main,
                color: theme.palette.primary.main,
                py: 1,
                '&:hover': {
                  borderColor: theme.palette.primary.main,
                  bgcolor: `${theme.palette.primary.main}10`,
                },
              }}
            >
              New Chat
            </Button>
          </Box>
        )}

        {/* Session list */}
        <Box sx={{ flex: 1, overflow: 'auto', pb: 0.5 }}>
          {allSessions.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 4, px: 2 }}>
              <IconMessage size={32} stroke={1.5} color={theme.palette.text.disabled} />
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mt: 1 }}>
                No conversations yet
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                Create one with the button above
              </Typography>
            </Box>
          )}
          {groupOrder.map((group) => {
            const items = groupedSessions[group];
            if (items.length === 0) return null;
            return (
              <Box key={group}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    px: 2,
                    py: 0.75,
                    position: 'relative',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      left: 0,
                      top: '50%',
                      transform: 'translateY(-50%)',
                      width: 3,
                      height: 14,
                      borderRadius: '0 2px 2px 0',
                      bgcolor: theme.palette.primary.main,
                    },
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.disabled,
                      fontWeight: 700,
                      fontSize: '0.65rem',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      ml: 1,
                    }}
                  >
                    {group}
                  </Typography>
                </Box>
                <List dense sx={{ px: 1 }}>
                  {items.map((s) => (
                    <ListItemButton
                      key={s.id}
                      selected={activeSession?.id === s.id}
                      onClick={() => switchSession(s)}
                      onMouseEnter={() => setHoveredSession(s.id)}
                      onMouseLeave={() => setHoveredSession(null)}
                      sx={{
                        borderRadius: 1.5,
                        mb: 0.25,
                        py: 1.25,
                        px: 1.5,
                        '&.Mui-selected': {
                          bgcolor: `${theme.palette.primary.main}20`,
                        },
                        '&:hover': {
                          bgcolor: theme.palette.mode === 'dark'
                            ? 'rgba(75,114,255,0.18)'
                            : 'rgba(75,114,255,0.12)',
                        },
                      }}
                    >
                      <ListItemText
                        primary={getSessionTitle(s)}
                        primaryTypographyProps={{
                          variant: 'body2',
                          noWrap: true,
                          sx: {
                            fontWeight: activeSession?.id === s.id ? 600 : 400,
                            color: theme.palette.text.primary,
                          },
                        }}
                        secondary={
                          <Typography
                            variant="caption"
                            sx={{
                              color: activeSession?.id === s.id
                                ? theme.palette.text.secondary
                                : theme.palette.text.disabled,
                            }}
                          >
                            {getRelativeTimestamp(s.updated_date || s.created_date)}
                          </Typography>
                        }
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          setMenuAnchorEl(e.currentTarget);
                          setMenuSession(s);
                        }}
                        sx={{
                          color: theme.palette.text.disabled,
                          opacity: hoveredSession === s.id || menuAnchorEl ? 1 : 0,
                          transition: 'opacity 0.15s',
                        }}
                      >
                        <IconDotsVertical size={16} />
                      </IconButton>
                    </ListItemButton>
                  ))}
                </List>
              </Box>
            );
          })}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>

        {/* Bottom section - Profile, Theme, Logout */}
        <Box
          sx={{
            borderTop: `1px solid ${theme.palette.divider}`,
            px: 1,
            py: 0.5,
          }}
        >
          <ListItemButton
            onClick={() => navigate('/chat/profile')}
            sx={{ borderRadius: 1.5, mb: 0.25, py: 1, px: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <IconUserCircle size={18} />
            </ListItemIcon>
            <ListItemText
              primary="Profile"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
            />
          </ListItemButton>
          <ListItemButton
            onClick={() => dispatch(toggleTheme())}
            sx={{ borderRadius: 1.5, mb: 0.25, py: 1, px: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              {themeMode === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
            </ListItemIcon>
            <ListItemText
              primary={themeMode === 'dark' ? 'Light Mode' : 'Dark Mode'}
              primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
            />
          </ListItemButton>
          <ListItemButton
            onClick={handleLogout}
            sx={{ borderRadius: 1.5, py: 1, px: 1.5 }}
          >
            <ListItemIcon sx={{ minWidth: 32 }}>
              <IconLogout size={18} />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
            />
          </ListItemButton>
        </Box>
      </Box>

      {/* Center - Chat area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {activeSession && selectedChatbot ? (
          <Box sx={{ flex: 1, overflow: 'hidden' }}>
            <ChatWindow
              messages={messages}
              onSend={handleSend}
              loading={sending}
              chatbotName={selectedChatbot.name}
              userName="You"
              chatbotColor={getBotColor(selectedChatbot.name)}
            />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Box sx={{ textAlign: 'center', color: theme.palette.text.secondary }}>
              <IconMessage size={56} stroke={1.5} />
              <Typography variant="h6" sx={{ mt: 2, color: theme.palette.text.primary }}>
                RAGFlow Chat
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Select a conversation to start chatting
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      {/* New Chat - chatbot selection dialog */}
      <Dialog
        open={newChatDialogOpen}
        onClose={() => setNewChatDialogOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 3,
            bgcolor: theme.palette.background.paper,
            minWidth: 320,
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 700, pb: 0 }}>
          Select a Chatbot
        </DialogTitle>
        <DialogContent sx={{ pt: 1.5, pb: 2 }}>
          <List>
            {chatbots.map((bot) => (
              <ListItemButton
                key={bot.id}
                onClick={() => handleCreateSession(bot)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  py: 1.25,
                  '&:hover': {
                    bgcolor: `${getBotColor(bot.name)}15`,
                  },
                }}
              >
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: getBotColor(bot.name),
                      width: 36,
                      height: 36,
                    }}
                  >
                    <IconRobot size={20} />
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={bot.name}
                  primaryTypographyProps={{ fontWeight: 600 }}
                />
              </ListItemButton>
            ))}
          </List>
        </DialogContent>
      </Dialog>

      {/* Session context menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={() => { setMenuAnchorEl(null); setMenuSession(null); }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            setMenuAnchorEl(null);
            if (menuSession) {
              setRenameSession(menuSession);
              setRenameValue(menuSession.title || '');
              setRenameDialogOpen(true);
            }
          }}
        >
          <ListItemIcon><IconPencil size={16} /></ListItemIcon>
          <ListItemText>Rename</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            setMenuAnchorEl(null);
            if (menuSession) setDeleteConfirm(menuSession);
          }}
        >
          <ListItemIcon><IconTrash size={16} /></ListItemIcon>
          <ListItemText sx={{ color: theme.palette.error.main }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

      {/* Rename dialog */}
      <Dialog
        open={renameDialogOpen}
        onClose={() => { setRenameDialogOpen(false); setRenameSession(null); setRenameValue(''); }}
        PaperProps={{ sx: { borderRadius: 3, bgcolor: theme.palette.background.paper, minWidth: 360 } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Rename Session</DialogTitle>
        <DialogContent sx={{ pt: 1.5 }}>
          <TextField
            fullWidth
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRename(); } }}
            placeholder="Enter new title"
            variant="outlined"
          />
        </DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 3, pb: 2 }}>
          <Button onClick={() => { setRenameDialogOpen(false); setRenameSession(null); setRenameValue(''); }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleRename} disabled={!renameValue.trim()}>
            Rename
          </Button>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${deleteConfirm?.title || 'this conversation'}"?`}
        onConfirm={handleDeleteSession}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
};

export default UserChat;
