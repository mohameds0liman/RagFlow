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
  useTheme,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import * as kbApi from '../../../api/knowledgeBaseApi';

const CONFIG_KEYS = [
  { key: 'embedder', label: 'Embedder', category: 'embedding' },
  { key: 'vector_store', label: 'Vector Store', category: 'vectorstore' },
  { key: 'record_manager', label: 'Record Manager', category: 'recordmanager' },
];

const UpsertionConfigDialog = ({ open, onClose, kbId, existingConfig }) => {
  const theme = useTheme();
  const { enqueueSnackbar } = useSnackbar();

  const [components, setComponents] = useState({});
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
          comps[key] = data;
          if (data.length > 0) {
            const { data: schema } = await kbApi.getComponentSchema(data[0].name, category);
            schs[key] = schema;
          }
        }
        setComponents(comps);
        setSchemas(schs);
        if (existingConfig) {
          setConfig({
            embedder: existingConfig.embedder || { name: '', build_config: {} },
            vector_store: existingConfig.vector_store || { name: '', build_config: {} },
            record_manager: existingConfig.record_manager || { name: '', build_config: {} },
          });
        }
      } catch (err) {
        enqueueSnackbar('Failed to load components', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [open, kbId, existingConfig, enqueueSnackbar]);

  const handleComponentChange = useCallback(async (section, name) => {
    const entry = CONFIG_KEYS.find((c) => c.key === section);
    setConfig((prev) => ({ ...prev, [section]: { ...prev[section], name, build_config: {} } }));
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
      enqueueSnackbar('Failed to save configuration', { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const renderFields = (section, schema) => {
    if (!schema?.fields) return null;
    return schema.fields.map((field) => {
      if (field.enum) {
        return (
          <TextField
            key={field.name}
            select
            label={field.label || field.name}
            fullWidth
            size="small"
            value={config[section].build_config[field.name] || ''}
            onChange={(e) => handleFieldChange(section, field.name, e.target.value)}
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
          value={config[section].build_config[field.name] || ''}
          onChange={(e) => handleFieldChange(section, field.name, e.target.value)}
          sx={{ mb: 1.5 }}
        />
      );
    });
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Upsertion Configuration</Typography>
        <IconButton size="small" onClick={() => onClose(false)}>
          <IconX size={20} />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          CONFIG_KEYS.map(({ key, label }) => (
            <Box key={key} sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                {label}
              </Typography>
              <TextField
                select
                label="Component"
                fullWidth
                size="small"
                value={config[key].name}
                onChange={(e) => handleComponentChange(key, e.target.value)}
                sx={{ mb: 2 }}
              >
                {(components[key] || []).map((comp) => (
                  <MenuItem key={comp.name} value={comp.name}>{comp.name}</MenuItem>
                ))}
              </TextField>
              {renderFields(key, schemas[key])}
              {schemas[key] && config[key].name && schemas[key]?.fields?.length === 0 && (
                <Typography variant="body2" sx={{ color: theme.palette.text.secondary, fontStyle: 'italic' }}>
                  No configuration fields required.
                </Typography>
              )}
            </Box>
          ))
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => onClose(false)} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={loading || saving}>
          {saving ? <CircularProgress size={20} /> : existingConfig ? 'Update' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UpsertionConfigDialog;
