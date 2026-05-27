import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Avatar,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Alert,
  CircularProgress,
  Button,
  useTheme,
} from '@mui/material';
import {
  IconRobot,
  IconPlus,
  IconTrash,
  IconMessage,
} from '@tabler/icons-react';
import ChatWindow from '../../components/ChatWindow';
import ConfirmDialog from '../../components/ConfirmDialog';
import * as chatApi from '../../api/chatApi';

const UserChat = () => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [chatbots, setChatbots] = useState([]);
  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await chatApi.userListChatbots();
        setChatbots(data.chatbots || []);
      } catch (err) {
        enqueueSnackbar(err.response?.data?.detail || 'Failed to load chatbots', { variant: 'error' });
      }
    };
    load();
  }, [enqueueSnackbar]);

  const loadSessionsAndMessages = useCallback(async (chatbot) => {
    if (!chatbot) return;
    setLoading(true);
    setMessages([]);
    setActiveSession(null);
    setSessions([]);
    try {
      const { data } = await chatApi.userListSessions();
      const filtered = (data.sessions || []).filter(
        (s) => s.chatbot_id === chatbot.id
      );
      let session;
      if (filtered.length > 0) {
        session = filtered[0];
      } else {
        const { data: created } = await chatApi.userCreateSession(chatbot.id);
        session = created.session;
        filtered.unshift(session);
      }
      setSessions(filtered);
      setActiveSession(session);
      const { data: msgData } = await chatApi.userListMessages(session.id);
      setMessages(msgData.messages || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to load conversations', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const switchSession = useCallback(async (session) => {
    setActiveSession(session);
    try {
      const { data } = await chatApi.userListMessages(session.id);
      setMessages(data.messages || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to load messages', { variant: 'error' });
    }
  }, [enqueueSnackbar]);

  const handleChatbotChange = (chatbotId) => {
    const bot = chatbots.find((b) => b.id === chatbotId);
    if (bot) {
      setSelectedChatbot(bot);
      loadSessionsAndMessages(bot);
    }
  };

  const handleSend = async (message) => {
    if (!activeSession || !selectedChatbot) return;
    setSending(true);
    setRateLimited(false);
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
      if (err.response?.status === 429) {
        setRateLimited(true);
      } else {
        enqueueSnackbar(
          err.response?.data?.detail || 'Failed to send message',
          { variant: 'error' }
        );
      }
    } finally {
      setSending(false);
    }
  };

  const handleDeleteSession = async () => {
    if (!deleteConfirm) return;
    try {
      await chatApi.userDeleteSession(deleteConfirm.id);
      const remaining = sessions.filter((s) => s.id !== deleteConfirm.id);
      setSessions(remaining);
      if (activeSession?.id === deleteConfirm.id) {
        if (remaining.length > 0) {
          await switchSession(remaining[0]);
        } else {
          setActiveSession(null);
          setMessages([]);
        }
      }
      enqueueSnackbar('Session deleted', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to delete session', { variant: 'error' });
    } finally {
      setDeleteConfirm(null);
    }
  };

  const handleNewSession = async () => {
    if (!selectedChatbot) return;
    try {
      const { data } = await chatApi.userCreateSession(selectedChatbot.id);
      setSessions((prev) => [data.session, ...prev]);
      await switchSession(data.session);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to create session', { variant: 'error' });
    }
  };

  return (
    <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', gap: 0 }}>
      {/* Left panel - Session list (ChatGPT style) */}
      <Box
        sx={{
          width: 280,
          borderRight: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
        }}
      >
        {/* Chatbot selector + New session */}
        <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          {chatbots.length > 0 ? (
            <>
              <TextField
                select
                size="small"
                fullWidth
                value={selectedChatbot?.id || ''}
                onChange={(e) => handleChatbotChange(e.target.value)}
                placeholder="Select a chatbot"
                sx={{ mb: 1 }}
              >
                {chatbots.map((bot) => (
                  <MenuItem key={bot.id} value={bot.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <IconRobot size={16} />
                      {bot.name}
                    </Box>
                  </MenuItem>
                ))}
              </TextField>
              {selectedChatbot && (
                <Button
                  fullWidth
                  size="small"
                  variant="outlined"
                  startIcon={<IconPlus size={16} />}
                  onClick={handleNewSession}
                >
                  New Conversation
                </Button>
              )}
            </>
          ) : (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                No chatbots assigned
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Contact your admin
              </Typography>
            </Box>
          )}
        </Box>

        {/* Session list */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {selectedChatbot && sessions.length === 0 && !loading && (
            <Typography
              variant="body2"
              sx={{ p: 2, color: theme.palette.text.secondary, textAlign: 'center' }}
            >
              No conversations yet
            </Typography>
          )}
          <List dense>
            {sessions.map((s) => (
              <ListItemButton
                key={s.id}
                selected={activeSession?.id === s.id}
                onClick={() => switchSession(s)}
                sx={{
                  py: 1,
                  '&.Mui-selected': {
                    borderLeft: `3px solid ${theme.palette.primary.main}`,
                    bgcolor: 'rgba(75,114,255,0.12)',
                  },
                }}
              >
                <ListItemAvatar sx={{ minWidth: 36 }}>
                  <IconMessage size={18} color={theme.palette.text.secondary} />
                </ListItemAvatar>
                <ListItemText
                  primary={s.title}
                  primaryTypographyProps={{
                    variant: 'body2',
                    noWrap: true,
                    sx: { fontWeight: activeSession?.id === s.id ? 600 : 400 },
                  }}
                  secondary={
                    <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                      {s.messages_count != null ? `${s.messages_count} messages` : ''}
                    </Typography>
                  }
                />
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(s);
                  }}
                  sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}
                >
                  <IconTrash size={16} />
                </IconButton>
              </ListItemButton>
            ))}
          </List>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      </Box>

      {/* Center - Chat area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {rateLimited && (
          <Alert severity="warning" onClose={() => setRateLimited(false)}>
            Daily message limit exceeded. Please try again later.
          </Alert>
        )}
        {selectedChatbot ? (
          <>
            <Box
              sx={{
                p: 1.5,
                borderBottom: `1px solid ${theme.palette.divider}`,
                bgcolor: theme.palette.background.paper,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.primary.main }}>
                <IconRobot size={16} />
              </Avatar>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                {selectedChatbot.name}
              </Typography>
            </Box>
            <Box sx={{ flex: 1, overflow: 'hidden' }}>
              <ChatWindow
                messages={messages}
                onSend={handleSend}
                loading={sending}
                disabled={rateLimited}
              />
            </Box>
          </>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
            <Box sx={{ textAlign: 'center', color: theme.palette.text.secondary }}>
              <IconMessage size={64} stroke={1.5} />
              <Typography variant="h6" sx={{ mt: 2, color: theme.palette.text.primary }}>
                RAGFlow Chat
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Select a chatbot to start chatting
              </Typography>
            </Box>
          </Box>
        )}
      </Box>

      <ConfirmDialog
        open={!!deleteConfirm}
        title="Delete Conversation"
        message={`Are you sure you want to delete "${deleteConfirm?.title}"?`}
        onConfirm={handleDeleteSession}
        onCancel={() => setDeleteConfirm(null)}
      />
    </Box>
  );
};

export default UserChat;
