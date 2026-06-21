import { useState, useEffect, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  CircularProgress,
  Divider,
  IconButton,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import ComponentIcon from '../../../components/ComponentIcon';
import * as kbApi from '../../../api/knowledgeBaseApi';
import { createChatbot, updateChatbot } from '../../../store/slices/chatbotSlice';

const CHAIN_TYPES = ['stuff', 'map_reduce', 'refine', 'map_rerank'];

const NUMERIC_TYPES = ['float', 'integer', 'number'];

const castValue = (value, type) => {
  if (NUMERIC_TYPES.includes(type)) {
    const n = type === 'integer' ? parseInt(value, 10) : parseFloat(value);
    return isNaN(n) ? value : n;
  }
  return value;
};

const DEFAULT_PROMPT_TEMPLATE = `Use the following pieces of context to answer the question at the end.
If you don't know the answer, just say that you don't know.
{context}
Chat History:
{chat_history}
Question: {question}
Helpful Answer:`;

const ChatbotSettingsDialog = ({ open, onClose, existingBot }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { saving } = useSelector((state) => state.chatbots);
  const kbList = useSelector((state) => state.knowledgeBases.list);

  const [llmComponents, setLlmComponents] = useState([]);
  const [llmSchema, setLlmSchema] = useState(null);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
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
    if (!open) return;
    const init = async () => {
      setLoading(true);
      try {
        const { data: llmData } = await kbApi.listComponents('chat_model');
        const comps = Object.entries(llmData || {}).map(([name, inputs]) => ({ name, inputs }));
        setLlmComponents(comps);

        if (existingBot) {
          const llmCfg = existingBot.llm_config || {};
          const chainCfg = existingBot.chain_config || {};
          const promptCfg = existingBot.prompt_config || {};

          setForm({
            name: existingBot.name || '',
            description: existingBot.description || '',
            store_id: existingBot.store_id || '',
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
            } catch { /* skip */ }
          }
        } else {
          setForm({
            name: '',
            description: '',
            store_id: '',
            llm_provider: '',
            llm_config: {},
            chain_type: 'stuff',
            k: 4,
            last_k_message_pairs: 3,
            prompt_template: DEFAULT_PROMPT_TEMPLATE,
          });
          setLlmSchema(null);
        }
      } catch (err) {
        enqueueSnackbar(err.response?.data?.detail || 'Failed to load components', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [open, existingBot, enqueueSnackbar]);

  const loadLlmSchema = useCallback(async (name) => {
    try {
      const { data } = await kbApi.getComponentSchema(name, 'chat_model');
      setLlmSchema(data);
    } catch (err) {
      setLlmSchema(null);
      enqueueSnackbar(err.response?.data?.detail || 'Failed to load LLM schema', { variant: 'error' });
    }
  }, []);

  const handleLlmProviderChange = (value) => {
    setForm((prev) => ({ ...prev, llm_provider: value, llm_config: {} }));
    loadLlmSchema(value);
  };

  const handleLlmFieldChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      llm_config: { ...prev.llm_config, [field]: value },
    }));
  };

  const renderSchemaFields = (schema, config, onChange) => {
    if (!schema?.inputs) return null;
    return schema.inputs.map((field) => {
      if (field.enum) {
        return (
          <TextField
            key={field.name}
            select
            label={field.description || field.label || field.name}
            fullWidth
            size="small"
            value={config[field.name] ?? field.default ?? ''}
            onChange={(e) => onChange(field.name, e.target.value)}
            placeholder={field.default ? String(field.default) : ''}
            sx={{ mb: 1.5 }}
          >
            {field.enum.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </TextField>
        );
      }
      if (field.type === 'bool') {
        return (
          <TextField
            key={field.name}
            select
            label={field.description || field.label || field.name}
            fullWidth
            size="small"
            value={config[field.name] !== undefined ? String(config[field.name]) : String(field.default ?? true)}
            onChange={(e) => onChange(field.name, e.target.value === 'true')}
            sx={{ mb: 1.5 }}
          >
            <MenuItem value="true">true</MenuItem>
            <MenuItem value="false">false</MenuItem>
          </TextField>
        );
      }
      return (
        <TextField
          key={field.name}
          label={field.description || field.label || field.name}
          fullWidth
          size="small"
          type={NUMERIC_TYPES.includes(field.type) ? 'number' : 'text'}
          value={config[field.name] ?? ''}
          onChange={(e) => onChange(field.name, e.target.value)}
          placeholder={field.default ? String(field.default) : ''}
          sx={{ mb: 1.5 }}
        />
      );
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      enqueueSnackbar('Name is required', { variant: 'error' });
      return;
    }

    const typedConfig = {};
    if (llmSchema?.inputs) {
      llmSchema.inputs.forEach((field) => {
        const raw = form.llm_config[field.name];
        const value = (raw !== undefined && raw !== '') ? raw : field.default;
        if (value !== undefined && value !== null) {
          typedConfig[field.name] = castValue(value, field.type);
        }
      });
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      store_id: form.store_id || null,
      llm_config: form.llm_provider
        ? { name: form.llm_provider, build_config: typedConfig }
        : null,
      chain_config: {
        chain_type: form.chain_type,
        k: form.k,
        last_k_message_pairs: form.last_k_message_pairs,
      },
      prompt_config: form.prompt_template.trim()
        ? { template: form.prompt_template.trim() }
        : null,
    };

    try {
      if (existingBot) {
        await dispatch(updateChatbot({ id: existingBot.id, payload })).unwrap();
        enqueueSnackbar('Chatbot updated', { variant: 'success' });
      } else {
        await dispatch(createChatbot(payload)).unwrap();
        enqueueSnackbar('Chatbot created', { variant: 'success' });
      }
      onClose(true);
    } catch (err) {
      enqueueSnackbar(err, { variant: 'error' });
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6">{existingBot ? 'Edit Chatbot' : 'Add Chatbot'}</Typography>
        <IconButton size="small" onClick={() => onClose(false)}>
          <IconX size={20} />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                  Basic Info
                </Typography>
                <TextField
                  autoFocus
                  label="Name"
                  fullWidth
                  required
                  size="small"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  label="Description"
                  fullWidth
                  multiline
                  rows={3}
                  size="small"
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
              </CardContent>
            </Card>

            <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                  Knowledge Base
                </Typography>
                <TextField
                  select
                  label="Knowledge Base"
                  fullWidth
                  size="small"
                  value={form.store_id}
                  onChange={(e) => setForm((p) => ({ ...p, store_id: e.target.value }))}
                >
                  <MenuItem value="">None</MenuItem>
                  {kbList.map((kb) => (
                    <MenuItem key={kb.id} value={kb.id}>{kb.name}</MenuItem>
                  ))}
                </TextField>
              </CardContent>
            </Card>

            <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                  LLM Configuration
                </Typography>
                <TextField
                  select
                  label="LLM Provider"
                  fullWidth
                  size="small"
                  value={form.llm_provider}
                  onChange={(e) => handleLlmProviderChange(e.target.value)}
                  sx={{ mb: 1.5 }}
                >
                  <MenuItem value="">None</MenuItem>
                  {llmComponents.map((comp) => (
                    <MenuItem key={comp.name} value={comp.name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ComponentIcon category="chat_model" name={comp.name} size={18} />
                        {comp.name}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                {renderSchemaFields(llmSchema, form.llm_config, handleLlmFieldChange)}
                {llmSchema && form.llm_provider && llmSchema?.inputs?.length === 0 && (
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                    No configuration fields required.
                  </Typography>
                )}
              </CardContent>
            </Card>

            <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                  Chain
                </Typography>
                <TextField
                  select
                  label="Chain Type"
                  fullWidth
                  size="small"
                  value={form.chain_type}
                  onChange={(e) => setForm((p) => ({ ...p, chain_type: e.target.value }))}
                  sx={{ mb: 1.5 }}
                >
                  {CHAIN_TYPES.map((ct) => (
                    <MenuItem key={ct} value={ct}>
                      {ct}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Top K (retrieved documents)"
                  fullWidth
                  size="small"
                  type="number"
                  value={form.k}
                  onChange={(e) => setForm((p) => ({ ...p, k: parseInt(e.target.value, 10) || 0 }))}
                  placeholder="4"
                  sx={{ mb: 1.5 }}
                />
                <TextField
                  label="Last K message pairs (chat history)"
                  fullWidth
                  size="small"
                  type="number"
                  value={form.last_k_message_pairs}
                  onChange={(e) => setForm((p) => ({ ...p, last_k_message_pairs: parseInt(e.target.value, 10) || 0 }))}
                  placeholder="3"
                />
              </CardContent>
            </Card>

            <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                  Instructions / Prompt Template
                </Typography>
                <TextField
                  label="Prompt Template"
                  fullWidth
                  multiline
                  rows={6}
                  size="small"
                  value={form.prompt_template}
                  onChange={(e) => setForm((p) => ({ ...p, prompt_template: e.target.value }))}
                />
              </CardContent>
            </Card>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => onClose(false)} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading || saving || !form.name.trim()}>
          {saving ? <CircularProgress size={20} /> : existingBot ? 'Update' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChatbotSettingsDialog;
