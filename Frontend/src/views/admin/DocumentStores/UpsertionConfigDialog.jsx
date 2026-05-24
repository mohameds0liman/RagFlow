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
import * as kbApi from '../../../api/knowledgeBaseApi';

const CONFIG_KEYS = [
  { key: 'embedder', label: 'Embedder', category: 'embedder' },
  { key: 'vector_store', label: 'Vector Store', category: 'vector_store' },
  { key: 'record_manager', label: 'Record Manager', category: 'record_manager' },
];

const UpsertionConfigDialog = ({ open, onClose, kbId, existingConfig }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [componentList, setComponentList] = useState({});
  const [schemas, setSchemas] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    embedder: { name: '', build_config: {} },
    vector_store: { name: '', build_config: {} },
    record_manager: { name: '', build_config: {} },
  });

  useEffect(() => {
    if (!open) return;
    const init = async () => {
      setLoading(true);
      try {
        const comps = {};
        const schs = {};
        for (const { key, category } of CONFIG_KEYS) {
          const { data } = await kbApi.listComponents(category);
          comps[key] = Object.entries(data || {}).map(([name, inputs]) => ({ name, inputs }));
        }
        setComponentList(comps);

        if (existingConfig) {
          const prefill = {};
          for (const { key, category } of CONFIG_KEYS) {
            const saved = existingConfig[key];
            prefill[key] = saved || { name: '', build_config: {} };
            if (saved?.name) {
              try {
                const { data: schema } = await kbApi.getComponentSchema(saved.name, category);
                schs[key] = schema;
              } catch { /* skip */ }
            }
          }
          setConfig(prefill);
        } else {
          const prefill = {};
          for (const { key, category } of CONFIG_KEYS) {
            const list = comps[key] || [];
            if (list.length > 0) {
              try {
                const { data: schema } = await kbApi.getComponentSchema(list[0].name, category);
                schs[key] = schema;
                prefill[key] = { name: list[0].name, build_config: {} };
              } catch { /* skip */ }
            }
          }
          setConfig((prev) => ({ ...prev, ...prefill }));
        }
        setSchemas(schs);
      } catch (err) {
        enqueueSnackbar(err.response?.data?.detail || 'Failed to load components', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [open, kbId, existingConfig, enqueueSnackbar]);

  const handleComponentChange = useCallback(async (section, name) => {
    const entry = CONFIG_KEYS.find((c) => c.key === section);
    setConfig((prev) => ({ ...prev, [section]: { name, build_config: {} } }));
    try {
      const { data } = await kbApi.getComponentSchema(name, entry.category);
      setSchemas((prev) => ({ ...prev, [section]: data }));
    } catch {
      setSchemas((prev) => ({ ...prev, [section]: null }));
    }
  }, []);

  const handleFieldChange = (section, field, value) => {
    setConfig((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        build_config: { ...prev[section].build_config, [field]: value },
      },
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        embedder_name: config.embedder.name,
        vector_store_name: config.vector_store.name,
        record_manager_name: config.record_manager.name,
        embedder_config: config.embedder.build_config,
        vector_store_config: config.vector_store.build_config,
        record_manager_config: config.record_manager.build_config,
      };
      if (existingConfig) {
        await kbApi.updateUpsertionConfig(kbId, payload);
      } else {
        await kbApi.createUpsertionConfig(kbId, payload);
      }
      enqueueSnackbar(existingConfig ? 'Configuration updated' : 'Configuration saved', { variant: 'success' });
      onClose(true);
    } catch (err) {
      enqueueSnackbar(err.response?.data?.detail || 'Failed to save configuration', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderFields = (section, schema) => {
    if (!schema?.inputs) return null;
    return schema.inputs.map((field) => {
      if (field.enum) {
        return (
          <TextField
            key={field.name}
            select
            label={field.label || field.name}
            fullWidth
            size="small"
            value={config[section].build_config[field.name] ?? ''}
            onChange={(e) => handleFieldChange(section, field.name, e.target.value)}
            placeholder={field.default ? String(field.default) : ''}
            sx={{ mb: 1.5 }}
          >
            {field.enum.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </TextField>
        );
      }
      return (
        <TextField
          key={field.name}
          label={field.label || field.name}
          fullWidth
          size="small"
          type={field.type === 'integer' || field.type === 'number' ? 'number' : 'text'}
          value={config[section].build_config[field.name] ?? ''}
          onChange={(e) => handleFieldChange(section, field.name, e.target.value)}
          placeholder={field.default ? String(field.default) : ''}
          sx={{ mb: 1.5 }}
        />
      );
    });
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6">Upsert Configuration</Typography>
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
            {CONFIG_KEYS.map(({ key, label }) => (
              <Card
                key={key}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '12px',
                }}
              >
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                    {label}
                  </Typography>
                  <TextField
                    select
                    label="Component"
                    fullWidth
                    size="small"
                    value={config[key].name}
                    onChange={(e) => handleComponentChange(key, e.target.value)}
                    sx={{ mb: 1.5 }}
                  >
                    {(componentList[key] || []).map((comp) => (
                      <MenuItem key={comp.name} value={comp.name}>{comp.name}</MenuItem>
                    ))}
                  </TextField>
                  {renderFields(key, schemas[key])}
                  {schemas[key] && config[key].name && schemas[key]?.inputs?.length === 0 && (
                    <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                      No configuration fields required.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => onClose(false)} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading || saving || !config.embedder.name || !config.vector_store.name || !config.record_manager.name}>
          {saving ? <CircularProgress size={20} /> : existingConfig ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpsertionConfigDialog;
