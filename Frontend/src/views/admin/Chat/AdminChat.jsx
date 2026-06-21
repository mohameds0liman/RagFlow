import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Avatar,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material';
import {
  IconRobot,
  IconPlus,
  IconTrash,
  IconSettings,
  IconX,
  IconMessage,
  IconSend,
} from '@tabler/icons-react';
import ChatWindow from '../../../components/ChatWindow';
import ConfirmDialog from '../../../components/ConfirmDialog';
import * as chatApi from '../../../api/chatApi';
import * as kbApi from '../../../api/knowledgeBaseApi';
import * as chatbotApi from '../../../api/chatbotApi';
import {
  fetchChatbots,
  updateChatbot as updateChatbotThunk,
} from '../../../store/slices/chatbotSlice';
import { fetchKnowledgeBases } from '../../../store/slices/kbSlice';

const CHAIN_TYPES = ['stuff', 'map_reduce', 'refine', 'map_rerank'];
const NUMERIC_TYPES = ['float', 'integer', 'number'];

const DEFAULT_PROMPT_TEMPLATE = `Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know.
{context}
Chat History:
{chat_history}
Question: {question}
Helpful Answer:`;

const castValue = (value, type) => {
  if (NUMERIC_TYPES.includes(type)) {
    const n = type === 'integer' ? parseInt(value, 10) : parseFloat(value);
    return isNaN(n) ? value : n;
  }
  return value;
};

const AdminChat = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const chatbotList = useSelector((state) => state.chatbots.list);
  const kbList = useSelector((state) => state.knowledgeBases.list);

  const [selectedChatbot, setSelectedChatbot] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const [compareMode, setCompareMode] = useState(false);
  const [compareBot, setCompareBot] = useState(null);
  const [compareSession, setCompareSession] = useState(null);
  const [compareMessages, setCompareMessages] = useState([]);
  const [compareSending, setCompareSending] = useState(false);
  const [savedFormSnapshot, setSavedFormSnapshot] = useState(null);
  const [sharedInput, setSharedInput] = useState('');

  const [llmComponents, setLlmComponents] = useState([]);
  const [llmSchema, setLlmSchema] = useState(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    description: '',
    store_id: '',
    llm_provider: '',
    llm_config: {},
    chain_type: 'stuff',
    k: 4,
    last_k_message_pairs: 3,
    prompt_template: '',
  });

  useEffect(() => {
    dispatch(fetchChatbots());
    dispatch(fetchKnowledgeBases());
  }, [dispatch]);

  const loadSessionsAndMessages = useCallback(async (chatbot) => {
    if (!chatbot) return;
    setLoading(true);
    setMessages([]);
    setActiveSession(null);
    setSessions([]);
    try {
      const { data } = await chatApi.adminListSessions(chatbot.id);
      let session;
      const list = data.sessions || [];
      if (list.length > 0) {
        session = list[0];
      } else {
        const { data: created } = await chatApi.adminCreateSession(chatbot.id);
        session = created.session;
        list.unshift(session);
      }
      setSessions(list);
      setActiveSession(session);
      const { data: msgData } = await chatApi.adminListMessages(chatbot.id, session.id);
      setMessages(msgData.messages || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to load conversations', { variant: 'error' });
    } finally {
      setLoading(false);
    }
  }, [enqueueSnackbar]);

  const switchSession = useCallback(async (session) => {
    if (!selectedChatbot) return;
    setActiveSession(session);
    try {
      const { data } = await chatApi.adminListMessages(selectedChatbot.id, session.id);
      setMessages(data.messages || []);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to load messages', { variant: 'error' });
    }
  }, [selectedChatbot, enqueueSnackbar]);

  const handleChatbotChange = (chatbotId) => {
    const bot = chatbotList.find((b) => b.id === chatbotId);
    if (bot) {
      setSelectedChatbot(bot);
      setShowSettings(false);
      loadSessionsAndMessages(bot);
    }
  };

  const initSettings = useCallback(async (bot) => {
    if (!bot) return;
    setSettingsLoading(true);
    try {
      const { data } = await kbApi.listComponents('chat_model');
      const comps = Object.entries(data || {}).map(([name, inputs]) => ({ name, inputs }));
      setLlmComponents(comps);

      const llmCfg = bot.llm_config || {};
      const chainCfg = bot.chain_config || {};
      const promptCfg = bot.prompt_config || {};

      setSettingsForm({
        name: bot.name || '',
        description: bot.description || '',
        store_id: bot.store_id || '',
        llm_provider: llmCfg.name || '',
        llm_config: llmCfg.build_config || {},
        chain_type: chainCfg.chain_type || 'stuff',
        k: chainCfg.k ?? 4,
        last_k_message_pairs: chainCfg.last_k_message_pairs ?? 3,
        prompt_template: promptCfg.template || DEFAULT_PROMPT_TEMPLATE,
      });

      if (llmCfg.name) {
        try {
          const { data: schema } = await kbApi.getComponentSchema(llmCfg.name, 'chat_model');
          setLlmSchema(schema);
        } catch (err) {
          setLlmSchema(null);
          enqueueSnackbar(err.response?.data?.detail || 'Failed to load LLM schema', { variant: 'error' });
        }
      } else {
        setLlmSchema(null);
      }
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to load settings', { variant: 'error' });
    } finally {
      setSettingsLoading(false);
    }
  }, [enqueueSnackbar]);

  useEffect(() => {
    if (showSettings && selectedChatbot) {
      initSettings(selectedChatbot);
    }
  }, [showSettings, selectedChatbot, initSettings]);

  const handleLlmProviderChange = async (value) => {
    setSettingsForm((prev) => ({ ...prev, llm_provider: value, llm_config: {} }));
    if (!value) { setLlmSchema(null); return; }
    try {
      const { data } = await kbApi.getComponentSchema(value, 'chat_model');
      setLlmSchema(data);
    } catch (err) {
      setLlmSchema(null);
      enqueueSnackbar(err.response?.data?.detail || 'Failed to load LLM schema', { variant: 'error' });
    }
  };

  const handleLlmFieldChange = (field, value) => {
    setSettingsForm((prev) => ({
      ...prev,
      llm_config: { ...prev.llm_config, [field]: value },
    }));
  };

  const handleUpdateSettings = async () => {
    if (!selectedChatbot) return;
    if (!settingsForm.name.trim()) {
      enqueueSnackbar('Name is required', { variant: 'error' });
      return;
    }
    setSavingSettings(true);
    const typedConfig = {};
    if (llmSchema?.inputs) {
      llmSchema.inputs.forEach((field) => {
        const raw = settingsForm.llm_config[field.name];
        const value = (raw !== undefined && raw !== '') ? raw : field.default;
        if (value !== undefined && value !== null) {
          typedConfig[field.name] = castValue(value, field.type);
        }
      });
    }

    const payload = {
      name: settingsForm.name.trim(),
      description: settingsForm.description.trim() || null,
      store_id: settingsForm.store_id || null,
      llm_config: settingsForm.llm_provider
        ? { name: settingsForm.llm_provider, build_config: typedConfig }
        : null,
      chain_config: {
        chain_type: settingsForm.chain_type,
        k: settingsForm.k,
        last_k_message_pairs: settingsForm.last_k_message_pairs,
      },
      prompt_config: settingsForm.prompt_template.trim()
        ? { template: settingsForm.prompt_template.trim() }
        : null,
    };

    try {
      const result = await dispatch(
        updateChatbotThunk({ id: selectedChatbot.id, payload })
      ).unwrap();
      setSelectedChatbot(result);
      enqueueSnackbar('Settings updated', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err || 'Failed to update settings', { variant: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSend = async (message) => {
    if (!activeSession || !selectedChatbot) return;
    setSending(true);
    const tempId = `temp_${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: 'human', content: message },
    ]);
    try {
      const { data } = await chatApi.adminSendMessage(
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
    if (!deleteConfirm || !selectedChatbot) return;
    try {
      await chatApi.adminDeleteSession(selectedChatbot.id, deleteConfirm.id);
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
      const { data } = await chatApi.adminCreateSession(selectedChatbot.id);
      setSessions((prev) => [data.session, ...prev]);
      await switchSession(data.session);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to create session', { variant: 'error' });
    }
  };

  const handleCompare = async () => {
    if (!selectedChatbot || !settingsForm.name.trim()) return;
    setSavingSettings(true);
    const typedConfig = {};
    if (llmSchema?.inputs) {
      llmSchema.inputs.forEach((field) => {
        const raw = settingsForm.llm_config[field.name];
        const value = (raw !== undefined && raw !== '') ? raw : field.default;
        if (value !== undefined && value !== null) {
          typedConfig[field.name] = castValue(value, field.type);
        }
      });
    }
    const payload = {
      name: `[Compare] ${settingsForm.name.trim()}`,
      description: settingsForm.description.trim() || null,
      store_id: settingsForm.store_id || selectedChatbot.store_id || null,
      llm_config: settingsForm.llm_provider
        ? { name: settingsForm.llm_provider, build_config: typedConfig }
        : null,
      chain_config: {
        chain_type: settingsForm.chain_type,
        k: settingsForm.k,
        last_k_message_pairs: settingsForm.last_k_message_pairs,
      },
      prompt_config: settingsForm.prompt_template.trim()
        ? { template: settingsForm.prompt_template.trim() }
        : null,
    };
    try {
      if (compareBot) {
        await chatbotApi.deleteChatbot(compareBot.id);
      }
      const { data } = await chatbotApi.createChatbot(payload);
      const newBot = data.chatbot;
      setCompareBot(newBot);
      const { data: sessionData } = await chatApi.adminCreateSession(newBot.id);
      setCompareSession(sessionData.session);
      setCompareMessages([]);
      setSavedFormSnapshot({ ...settingsForm });
      setCompareMode(true);
      setShowSettings(false);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to create comparison', { variant: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleApplyCompare = async () => {
    if (!selectedChatbot || !compareBot) return;
    setSavingSettings(true);
    try {
      const typedConfig = {};
      if (llmSchema?.inputs) {
        llmSchema.inputs.forEach((field) => {
          const raw = settingsForm.llm_config[field.name];
          const value = (raw !== undefined && raw !== '') ? raw : field.default;
          if (value !== undefined && value !== null) {
            typedConfig[field.name] = castValue(value, field.type);
          }
        });
      }
      const payload = {
        name: settingsForm.name.trim(),
        description: settingsForm.description.trim() || null,
        llm_config: settingsForm.llm_provider
          ? { name: settingsForm.llm_provider, build_config: typedConfig }
          : null,
        chain_config: {
          chain_type: settingsForm.chain_type,
          k: settingsForm.k,
          last_k_message_pairs: settingsForm.last_k_message_pairs,
        },
        prompt_config: settingsForm.prompt_template.trim()
          ? { template: settingsForm.prompt_template.trim() }
          : null,
      };
      const result = await dispatch(
        updateChatbotThunk({ id: selectedChatbot.id, payload })
      ).unwrap();
      setSelectedChatbot(result);
      await chatbotApi.deleteChatbot(compareBot.id);
      setCompareMode(false);
      setCompareBot(null);
      setCompareSession(null);
      setCompareMessages([]);
      setShowSettings(false);
      enqueueSnackbar('New settings applied', { variant: 'success' });
      loadSessionsAndMessages(result);
    } catch (err) {
      enqueueSnackbar(err || 'Failed to apply settings', { variant: 'error' });
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDiscardCompare = async () => {
    if (!compareBot) return;
    try {
      await chatbotApi.deleteChatbot(compareBot.id);
    } catch { /* ignore */ }
    setCompareMode(false);
    setCompareBot(null);
    setCompareSession(null);
    setCompareMessages([]);
    setShowSettings(false);
  };

  const handleCompareSend = async (message) => {
    if (!compareBot || !compareSession) return;
    setCompareSending(true);
    const tempId = `temp_${Date.now()}`;
    setCompareMessages((prev) => [
      ...prev,
      { id: tempId, role: 'human', content: message },
    ]);
    try {
      const { data } = await chatApi.adminSendMessage(
        compareBot.id,
        compareSession.id,
        message
      );
      setCompareMessages((prev) => [
        ...prev.filter((m) => m.id !== tempId),
        data.user_message,
        data.ai_message,
      ]);
    } catch (err) {
      setCompareMessages((prev) => prev.filter((m) => m.id !== tempId));
      enqueueSnackbar(
        err.response?.data?.detail || 'Compare bot failed',
        { variant: 'error' }
      );
    } finally {
      setCompareSending(false);
    }
  };

  const handleSharedSend = async () => {
    const msg = sharedInput.trim();
    if (!msg || !activeSession || !selectedChatbot || (!compareBot || !compareSession)) return;
    setSharedInput('');
    // Send to original
    setSending(true);
    setCompareSending(true);
    const tempOrig = `orig_${Date.now()}`;
    const tempComp = `comp_${Date.now()}`;
    setMessages((prev) => [...prev, { id: tempOrig, role: 'human', content: msg }]);
    setCompareMessages((prev) => [...prev, { id: tempComp, role: 'human', content: msg }]);
    try {
      const [origRes, compRes] = await Promise.all([
        chatApi.adminSendMessage(selectedChatbot.id, activeSession.id, msg),
        compareBot && compareSession
          ? chatApi.adminSendMessage(compareBot.id, compareSession.id, msg)
          : Promise.resolve(null),
      ]);
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempOrig),
        origRes.data.user_message,
        origRes.data.ai_message,
      ]);
      if (compRes) {
        setCompareMessages((prev) => [
          ...prev.filter((m) => m.id !== tempComp),
          compRes.data.user_message,
          compRes.data.ai_message,
        ]);
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== tempOrig));
      setCompareMessages((prev) => prev.filter((m) => m.id !== tempComp));
      enqueueSnackbar(
        err.response?.data?.detail || 'Failed to send to one or both bots',
        { variant: 'error' }
      );
    } finally {
      setSending(false);
      setCompareSending(false);
    }
  };

  const renderLlmFields = () => {
    if (!llmSchema?.inputs) return null;
    return llmSchema.inputs.map((field) => (
      <TextField
        key={field.name}
        label={field.description || field.name}
        fullWidth
        size="small"
        type={NUMERIC_TYPES.includes(field.type) ? 'number' : 'text'}
        value={settingsForm.llm_config[field.name] ?? ''}
        onChange={(e) => handleLlmFieldChange(field.name, e.target.value)}
        placeholder={field.default ? String(field.default) : ''}
        sx={{ mb: 1.5 }}
      />
    ));
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
          <TextField
            select
            size="small"
            fullWidth
            value={selectedChatbot?.id || ''}
            onChange={(e) => handleChatbotChange(e.target.value)}
            placeholder="Select a chatbot"
            sx={{ mb: 1 }}
          >
            {chatbotList.map((bot) => (
              <MenuItem key={bot.id} value={bot.id}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconRobot size={16} />
                  {bot.name}
                </Box>
              </MenuItem>
            ))}
          </TextField>
          {selectedChatbot && (
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <Button
                fullWidth
                size="small"
                variant="outlined"
                startIcon={<IconPlus size={16} />}
                onClick={handleNewSession}
              >
                New Conversation
              </Button>
              <IconButton
                size="small"
                onClick={() => setShowSettings((prev) => !prev)}
                color={showSettings ? 'primary' : 'default'}
                title="Settings"
              >
                <IconSettings size={18} />
              </IconButton>
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

{compareMode && compareBot ? (
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Box sx={{ p: 1, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, display: 'flex', alignItems: 'center', gap: 1, justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Compare Mode</Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                Original vs new settings
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              <IconButton size="small" onClick={() => setShowSettings((prev) => !prev)} color={showSettings ? 'primary' : 'default'} title="Settings">
                <IconSettings size={18} />
              </IconButton>
              <Button size="small" variant="outlined" color="error" onClick={handleDiscardCompare} disabled={savingSettings}>
                Discard
              </Button>
              <Button size="small" variant="contained" onClick={handleApplyCompare} disabled={savingSettings}>
                {savingSettings ? <CircularProgress size={16} /> : 'Apply'}
              </Button>
            </Box>
          </Box>
          <Box sx={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${theme.palette.divider}` }}>
              <Box sx={{ p: 1, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.default, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.primary.main }}><IconRobot size={14} /></Avatar>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{selectedChatbot?.name} (Original)</Typography>
              </Box>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <ChatWindow messages={messages} onSend={handleSend} loading={sending} hideInput chatbotName={`${selectedChatbot?.name} (Original)`} />
              </Box>
            </Box>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 1, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.default, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Avatar sx={{ width: 24, height: 24, bgcolor: theme.palette.secondary.main }}><IconRobot size={14} /></Avatar>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{settingsForm.name} (New)</Typography>
              </Box>
              <Box sx={{ flex: 1, overflow: 'hidden' }}>
                <ChatWindow messages={compareMessages} onSend={handleCompareSend} loading={compareSending} hideInput chatbotName={`${settingsForm.name} (New)`} chatbotColor="#7c4dff" />
              </Box>
            </Box>
          </Box>
          <Box sx={{ px: 2, py: 1.25, borderTop: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper }}>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, bgcolor: theme.palette.background.default, borderRadius: '16px', p: 0.5, pl: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.25)' }}>
              <TextField
                fullWidth
                multiline
                minRows={1}
                maxRows={3}
                placeholder="Type a message to compare both bots..."
                value={sharedInput}
                onChange={(e) => setSharedInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSharedSend(); } }}
                variant="standard"
                InputProps={{ disableUnderline: true }}
                sx={{ '& .MuiInputBase-root': { fontSize: '0.875rem', py: 1.125, lineHeight: 1.3 } }}
              />
              <IconButton onClick={handleSharedSend} disabled={!sharedInput.trim() || sending || compareSending} sx={{ color: theme.palette.primary.main, borderRadius: '12px', width: 36, height: 36 }}>
                {(sending || compareSending) ? <CircularProgress size={18} /> : <IconSend size={18} />}
              </IconButton>
            </Box>
          </Box>
          {showSettings && (
            <Box sx={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: 380, borderLeft: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, overflow: 'auto', zIndex: 10, boxShadow: '-4px 0 20px rgba(0,0,0,0.15)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Chatbot Settings</Typography>
                <IconButton size="small" onClick={() => setShowSettings(false)}><IconX size={18} /></IconButton>
              </Box>
              {settingsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" fullWidth onClick={handleCompare} disabled={savingSettings || !settingsForm.name.trim()}>
                      {savingSettings ? <CircularProgress size={16} /> : 'Compare'}
                    </Button>
                  </Box>
                  <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}>Basic Info</Typography>
                      <TextField label="Name" fullWidth required size="small" value={settingsForm.name} onChange={(e) => setSettingsForm((p) => ({ ...p, name: e.target.value }))} sx={{ mb: 1 }} />
                      <TextField label="Description" fullWidth multiline rows={2} size="small" value={settingsForm.description} onChange={(e) => setSettingsForm((p) => ({ ...p, description: e.target.value }))} />
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}>Knowledge Base</Typography>
                      <TextField select label="Knowledge Base" fullWidth size="small" value={settingsForm.store_id} onChange={(e) => setSettingsForm((p) => ({ ...p, store_id: e.target.value }))}>
                        <MenuItem value="">None</MenuItem>
                        {kbList.map((kb) => (<MenuItem key={kb.id} value={kb.id}>{kb.name}</MenuItem>))}
                      </TextField>
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}>LLM Configuration</Typography>
                      <TextField select label="LLM Provider" fullWidth size="small" value={settingsForm.llm_provider} onChange={(e) => handleLlmProviderChange(e.target.value)} sx={{ mb: 1 }}>
                        <MenuItem value="">None</MenuItem>
                        {llmComponents.map((comp) => (<MenuItem key={comp.name} value={comp.name}>{comp.name}</MenuItem>))}
                      </TextField>
                      {renderLlmFields()}
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}>Chain</Typography>
                      <TextField select label="Chain Type" fullWidth size="small" value={settingsForm.chain_type} onChange={(e) => setSettingsForm((p) => ({ ...p, chain_type: e.target.value }))} sx={{ mb: 1 }}>
                        {CHAIN_TYPES.map((ct) => (<MenuItem key={ct} value={ct}>{ct}</MenuItem>))}
                      </TextField>
                      <TextField label="Top K (retrieved documents)" fullWidth size="small" type="number" value={settingsForm.k} onChange={(e) => setSettingsForm((p) => ({ ...p, k: parseInt(e.target.value, 10) || 0 }))} placeholder="4" sx={{ mb: 1 }} />
                      <TextField label="Last K message pairs (chat history)" fullWidth size="small" type="number" value={settingsForm.last_k_message_pairs} onChange={(e) => setSettingsForm((p) => ({ ...p, last_k_message_pairs: parseInt(e.target.value, 10) || 0 }))} placeholder="3" />
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}>Instructions / Prompt Template</Typography>
                      <TextField label="Prompt Template" fullWidth multiline rows={6} size="small" value={settingsForm.prompt_template} onChange={(e) => setSettingsForm((p) => ({ ...p, prompt_template: e.target.value }))} />
                    </CardContent>
                  </Card>
                  <Button variant="contained" fullWidth onClick={handleCompare} disabled={savingSettings || !settingsForm.name.trim()}>
                    {savingSettings ? <CircularProgress size={16} /> : 'Compare'}
                  </Button>
                </Box>
              )}
            </Box>
          )}
        </Box>
      ) : (
        <>
          <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            {selectedChatbot ? (
              <>
                <Box sx={{ p: 1.5, borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Avatar sx={{ width: 28, height: 28, bgcolor: theme.palette.primary.main }}><IconRobot size={16} /></Avatar>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{selectedChatbot.name}</Typography>
                </Box>
                <Box sx={{ flex: 1, overflow: 'hidden' }}>
                  <ChatWindow messages={messages} onSend={handleSend} loading={sending} />
                </Box>
              </>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <Box sx={{ textAlign: 'center', color: theme.palette.text.secondary }}>
                  <IconRobot size={64} stroke={1.5} />
                  <Typography variant="h6" sx={{ mt: 2, color: theme.palette.text.primary }}>RAGFlow Chat</Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>Select a chatbot from the left panel to start chatting</Typography>
                </Box>
              </Box>
            )}
          </Box>
          {showSettings && selectedChatbot && (
            <Box sx={{ width: 380, borderLeft: `1px solid ${theme.palette.divider}`, bgcolor: theme.palette.background.paper, overflow: 'auto', flexShrink: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', p: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>Chatbot Settings</Typography>
                <IconButton size="small" onClick={() => setShowSettings(false)}><IconX size={18} /></IconButton>
              </Box>
              {settingsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
              ) : (
                <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" fullWidth onClick={handleUpdateSettings} disabled={savingSettings || !settingsForm.name.trim()}>
                      {savingSettings ? <CircularProgress size={16} /> : 'Update'}
                    </Button>
                    <Button variant="outlined" fullWidth onClick={handleCompare} disabled={savingSettings || !settingsForm.name.trim()}>
                      Compare
                    </Button>
                  </Box>
                  <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}>Basic Info</Typography>
                      <TextField label="Name" fullWidth required size="small" value={settingsForm.name} onChange={(e) => setSettingsForm((p) => ({ ...p, name: e.target.value }))} sx={{ mb: 1 }} />
                      <TextField label="Description" fullWidth multiline rows={2} size="small" value={settingsForm.description} onChange={(e) => setSettingsForm((p) => ({ ...p, description: e.target.value }))} />
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}>Knowledge Base</Typography>
                      <TextField select label="Knowledge Base" fullWidth size="small" value={settingsForm.store_id} onChange={(e) => setSettingsForm((p) => ({ ...p, store_id: e.target.value }))}>
                        <MenuItem value="">None</MenuItem>
                        {kbList.map((kb) => (<MenuItem key={kb.id} value={kb.id}>{kb.name}</MenuItem>))}
                      </TextField>
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}>LLM Configuration</Typography>
                      <TextField select label="LLM Provider" fullWidth size="small" value={settingsForm.llm_provider} onChange={(e) => handleLlmProviderChange(e.target.value)} sx={{ mb: 1 }}>
                        <MenuItem value="">None</MenuItem>
                        {llmComponents.map((comp) => (<MenuItem key={comp.name} value={comp.name}>{comp.name}</MenuItem>))}
                      </TextField>
                      {renderLlmFields()}
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}>Chain</Typography>
                      <TextField select label="Chain Type" fullWidth size="small" value={settingsForm.chain_type} onChange={(e) => setSettingsForm((p) => ({ ...p, chain_type: e.target.value }))} sx={{ mb: 1 }}>
                        {CHAIN_TYPES.map((ct) => (<MenuItem key={ct} value={ct}>{ct}</MenuItem>))}
                      </TextField>
                      <TextField label="Top K (retrieved documents)" fullWidth size="small" type="number" value={settingsForm.k} onChange={(e) => setSettingsForm((p) => ({ ...p, k: parseInt(e.target.value, 10) || 0 }))} placeholder="4" sx={{ mb: 1 }} />
                      <TextField label="Last K message pairs (chat history)" fullWidth size="small" type="number" value={settingsForm.last_k_message_pairs} onChange={(e) => setSettingsForm((p) => ({ ...p, last_k_message_pairs: parseInt(e.target.value, 10) || 0 }))} placeholder="3" />
                    </CardContent>
                  </Card>
                  <Card sx={{ bgcolor: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                    <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.text.secondary, display: 'block', mb: 1 }}>Instructions / Prompt Template</Typography>
                      <TextField label="Prompt Template" fullWidth multiline rows={6} size="small" value={settingsForm.prompt_template} onChange={(e) => setSettingsForm((p) => ({ ...p, prompt_template: e.target.value }))} />
                    </CardContent>
                  </Card>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button variant="contained" fullWidth onClick={handleUpdateSettings} disabled={savingSettings || !settingsForm.name.trim()}>
                      {savingSettings ? <CircularProgress size={16} /> : 'Update'}
                    </Button>
                    <Button variant="outlined" fullWidth onClick={handleCompare} disabled={savingSettings || !settingsForm.name.trim()}>
                      Compare
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </>
      )}

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

export default AdminChat;
