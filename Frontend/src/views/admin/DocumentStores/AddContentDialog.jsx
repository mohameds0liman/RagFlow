import { useState, useEffect, useCallback, useRef } from 'react';
import { useSnackbar } from 'notistack';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
  LinearProgress,
  IconButton,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import {
  IconX,
  IconUpload,
  IconFile,
  IconWorld,
  IconCircleCheckFilled,
  IconPlayerPlay,
  IconSettings,
  IconCheck,
} from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { uploadDocument, addWebPage, ingestDocument } from '../../../store/slices/kbSlice';
import ComponentIcon from '../../../components/ComponentIcon';
import * as kbApi from '../../../api/knowledgeBaseApi';

const STEPS = [
  { label: 'Select Loader', icon: IconPlayerPlay },
  { label: 'Setting', icon: IconSettings },
  { label: 'Process', icon: IconCheck },
];

const ACCEPTED_FORMATS = ['pdf', 'docx', 'txt', 'csv', 'html', 'md', 'json'];
const MAX_FILE_SIZE_MB = 50;

const AddContentDialog = ({ open, onClose, kbId }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const [activeStep, setActiveStep] = useState(0);
  const [loaders, setLoaders] = useState([]);
  const [chunkers, setChunkers] = useState([]);
  const [loaderSchema, setLoaderSchema] = useState(null);
  const [loadingComps, setLoadingComps] = useState(false);

  const [selectedLoader, setSelectedLoader] = useState('');
  const [loaderConfig, setLoaderConfig] = useState({});

  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [url, setUrl] = useState('');
  const [webName, setWebName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedDoc, setUploadedDoc] = useState(null);

  const [chunkerName, setChunkerName] = useState('');
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [ingesting, setIngesting] = useState(false);

  const fileInputRef = useRef(null);

  const isWeb = selectedLoader?.toLowerCase().includes('web');

  useEffect(() => {
    if (!open) return;
    const init = async () => {
      setLoadingComps(true);
      try {
        const { data: loaderData } = await kbApi.listComponents('loader');
        const loaderList = Object.entries(loaderData || {}).map(([name]) => name);
        setLoaders(loaderList);
        const { data: chunkerData } = await kbApi.listComponents('chunker');
        const chunkerList = Object.entries(chunkerData || {}).map(([name]) => name);
        setChunkers(chunkerList);
      } catch (err) {
        enqueueSnackbar(err.response?.data?.detail || 'Failed to load components', { variant: 'error' });
      } finally {
        setLoadingComps(false);
      }
    };
    init();
  }, [open, enqueueSnackbar]);

  useEffect(() => {
    if (!selectedLoader) return;
    const fetchSchema = async () => {
      try {
        const { data } = await kbApi.getComponentSchema(selectedLoader, 'loader');
        setLoaderSchema(data);
        const defaultConfig = {};
        if (data?.inputs) {
          data.inputs.forEach((inp) => {
            if (inp.default !== undefined && inp.default !== null) {
              defaultConfig[inp.name] = inp.default;
            }
          });
        }
        setLoaderConfig(defaultConfig);
      } catch {
        setLoaderSchema(null);
        setLoaderConfig({});
      }
    };
    fetchSchema();
  }, [selectedLoader]);

  const handleLoaderFieldChange = (field, value) => {
    setLoaderConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSetFile(dropped);
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) validateAndSetFile(selected);
  };

  const validateAndSetFile = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_FORMATS.includes(ext)) {
      enqueueSnackbar(`Format .${ext} is not supported. Accepted: ${ACCEPTED_FORMATS.join(', ')}`, { variant: 'error' });
      return;
    }
    if (f.size / (1024 * 1024) > MAX_FILE_SIZE_MB) {
      enqueueSnackbar(`File exceeds ${MAX_FILE_SIZE_MB} MB limit`, { variant: 'error' });
      return;
    }
    setFile(f);
  };

  const doUpload = async () => {
    setUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 12, 85));
    }, 250);
    try {
      let result;
      if (isWeb) {
        result = await dispatch(addWebPage({ id: kbId, url: url.trim(), name: webName.trim() || undefined })).unwrap();
      } else {
        result = await dispatch(uploadDocument({ id: kbId, file })).unwrap();
      }
      clearInterval(interval);
      setUploadProgress(100);
      setUploadedDoc(result);
      enqueueSnackbar(isWeb ? 'Web page added' : 'File uploaded', { variant: 'success' });
      await new Promise((r) => setTimeout(r, 400));
      setActiveStep(1);
    } catch (err) {
      clearInterval(interval);
      setUploadProgress(0);
      enqueueSnackbar(err, { variant: 'error' });
      throw err;
    } finally {
      setUploading(false);
    }
  };

  const handleNext = async () => {
    if (activeStep === 0) {
      if (!selectedLoader) {
        enqueueSnackbar('Please select a loader', { variant: 'error' });
        return;
      }
      if (!isWeb && !file) {
        enqueueSnackbar('Please select a file to upload', { variant: 'error' });
        return;
      }
      if (isWeb && !url.trim()) {
        enqueueSnackbar('Please enter a URL', { variant: 'error' });
        return;
      }
      await doUpload();
      return;
    }

    if (activeStep === 1) {
      if (!chunkerName) {
        enqueueSnackbar('Please select a chunker', { variant: 'error' });
        return;
      }
      setActiveStep(2);
      return;
    }
  };

  const handleProcess = async () => {
    setIngesting(true);
    try {
      await dispatch(ingestDocument({
        id: kbId,
        payload: {
          loader_name: selectedLoader,
          chunker_name: chunkerName,
          loader_config: { ...loaderConfig },
          chunker_config: { chunk_size: chunkSize, chunk_overlap: chunkOverlap },
          doc_id: uploadedDoc?.id,
        },
      })).unwrap();
      enqueueSnackbar('Content added successfully', { variant: 'success' });
      handleClose(true);
    } catch (err) {
      enqueueSnackbar(err, { variant: 'error' });
    } finally {
      setIngesting(false);
    }
  };

  const handleClose = async (saved) => {
    if (uploading || ingesting) return;
    if (!saved && uploadedDoc) {
      try {
        await kbApi.deleteDocument(kbId, uploadedDoc.id);
      } catch {
        /* cleanup best-effort */
      }
    }
    setActiveStep(0);
    setSelectedLoader('');
    setLoaderSchema(null);
    setLoaderConfig({});
    setFile(null);
    setUrl('');
    setWebName('');
    setUploadedDoc(null);
    setChunkerName('');
    setChunkSize(1000);
    setChunkOverlap(200);
    setUploadProgress(0);
    onClose(saved);
  };

  const renderLoaderFields = () => {
    if (!loaderSchema?.inputs) return null;
    return loaderSchema.inputs.map((field) => {
      if (field.name === 'file_path' || field.name === 'web_path') return null;
      if (field.enum) {
        return (
          <TextField
            key={field.name}
            select
            label={field.label || field.name}
            fullWidth
            size="small"
            value={loaderConfig[field.name] ?? field.default ?? ''}
            onChange={(e) => handleLoaderFieldChange(field.name, e.target.value)}
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
          value={loaderConfig[field.name] ?? field.default ?? ''}
          onChange={(e) => handleLoaderFieldChange(field.name, e.target.value)}
          placeholder={field.default ? String(field.default) : ''}
          sx={{ mb: 1.5 }}
        />
      );
    });
  };

  const renderStepContent = () => {
    if (loadingComps) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      );
    }

    switch (activeStep) {
      case 0:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                  Loader Component
                </Typography>
                <TextField
                  select
                  label="Loader"
                  fullWidth
                  size="small"
                  value={selectedLoader}
                  onChange={(e) => setSelectedLoader(e.target.value)}
                  sx={{ mb: 1 }}
                >
                  {loaders.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ComponentIcon category="loader" name={name} size={18} />
                        {name}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                {renderLoaderFields()}
              </CardContent>
            </Card>

            {selectedLoader && (
              <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                    {isWeb ? 'Web Page Details' : 'File Upload'}
                  </Typography>
                  {isWeb ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <TextField
                        label="URL"
                        placeholder="https://example.com/page"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                      <TextField
                        label="Name (optional)"
                        placeholder="My Web Page"
                        value={webName}
                        onChange={(e) => setWebName(e.target.value)}
                        fullWidth
                        variant="outlined"
                        size="small"
                      />
                    </Box>
                  ) : (
                    <Box>
                      <Box
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={handleFileDrop}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          border: `2px dashed ${dragOver ? theme.palette.primary.main : theme.palette.divider}`,
                          borderRadius: '12px',
                          p: 3,
                          textAlign: 'center',
                          cursor: 'pointer',
                          backgroundColor: dragOver ? `${theme.palette.primary.main}0a` : 'transparent',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: theme.palette.primary.main,
                            backgroundColor: `${theme.palette.primary.main}0a`,
                          },
                        }}
                      >
                        <input ref={fileInputRef} type="file" hidden onChange={handleFileSelect} accept={ACCEPTED_FORMATS.map((f) => `.${f}`).join(',')} />
                        {file ? (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <IconFile size={32} style={{ color: theme.palette.primary.main }} />
                            <Typography variant="body2" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                              {file.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                              {(file.size / 1024 / 1024).toFixed(2)} MB / {MAX_FILE_SIZE_MB} MB limit
                            </Typography>
                            <Button size="small" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                              Remove
                            </Button>
                          </Box>
                        ) : (
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                            <IconUpload size={32} style={{ color: theme.palette.text.disabled }} />
                            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                              Drop a file or click to browse
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center', mt: 0.5 }}>
                              {ACCEPTED_FORMATS.map((fmt) => (
                                <Typography key={fmt} variant="caption" sx={{ color: theme.palette.text.disabled, px: 0.5 }}>
                                  .{fmt}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        );

      case 1:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                  Chunker Component
                </Typography>
                <TextField
                  select
                  label="Component"
                  fullWidth
                  size="small"
                  value={chunkerName}
                  onChange={(e) => setChunkerName(e.target.value)}
                  sx={{ mb: 1.5 }}
                >
                  {chunkers.map((name) => (
                    <MenuItem key={name} value={name}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <ComponentIcon category="chunker" name={name} size={18} />
                        {name}
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    label="Chunk Size"
                    type="number"
                    size="small"
                    fullWidth
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Number(e.target.value))}
                  />
                  <TextField
                    label="Chunk Overlap"
                    type="number"
                    size="small"
                    fullWidth
                    value={chunkOverlap}
                    onChange={(e) => setChunkOverlap(Number(e.target.value))}
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}>
                  Summary
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, backgroundColor: `${theme.palette.primary.main}0a`, borderRadius: '8px' }}>
                    <ComponentIcon category="loader" name={selectedLoader} size={24} />
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                        Loader
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                        {selectedLoader}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, backgroundColor: `${theme.palette.success.main}0a`, borderRadius: '8px' }}>
                    {isWeb ? <IconWorld size={24} style={{ color: theme.palette.primary.main }} /> : <IconFile size={24} style={{ color: theme.palette.primary.main }} />}
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                        {isWeb ? 'Web Page' : 'Document'}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                        {uploadedDoc?.file_name}
                      </Typography>
                      {!isWeb && (
                        <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                          {uploadedDoc?.file_size_mb?.toFixed?.(2) || '0'} MB
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 1.5, backgroundColor: `${theme.palette.warning.main}0a`, borderRadius: '8px' }}>
                    <ComponentIcon category="chunker" name={chunkerName} size={24} />
                    <Box>
                      <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block' }}>
                        Chunker
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.text.primary }}>
                        {chunkerName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                        Size: {chunkSize} | Overlap: {chunkOverlap}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={() => handleClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6">Add Content</Typography>
        <IconButton size="small" onClick={() => handleClose(false)} disabled={uploading || ingesting}>
          <IconX size={20} />
        </IconButton>
      </DialogTitle>

      <Box sx={{ px: 3, pb: 2, pt: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
          {STEPS.map((step, idx) => (
            <Box key={idx} sx={{ display: 'flex', alignItems: 'center', flex: 1, position: 'relative' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, flex: 1, zIndex: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: idx < activeStep
                      ? theme.palette.success.main
                      : idx === activeStep
                        ? theme.palette.primary.main
                        : theme.palette.divider,
                    color: idx <= activeStep ? '#fff' : theme.palette.text.disabled,
                    transition: 'all 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: idx === activeStep ? `0 0 0 4px ${theme.palette.primary.main}30` : 'none',
                  }}
                >
                  {idx < activeStep ? (
                    <IconCircleCheckFilled size={20} />
                  ) : (
                    <step.icon size={18} />
                  )}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: idx === activeStep ? 700 : 500,
                    color: idx <= activeStep ? theme.palette.text.primary : theme.palette.text.disabled,
                    fontSize: '0.68rem',
                    whiteSpace: 'nowrap',
                    transition: 'color 0.3s',
                  }}
                >
                  {step.label}
                </Typography>
              </Box>
              {idx < STEPS.length - 1 && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 18,
                    left: 'calc(50% + 20px)',
                    right: 'calc(-50% + 20px)',
                    height: 3,
                    backgroundColor: idx < activeStep ? theme.palette.success.main : theme.palette.divider,
                    transition: 'background-color 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRadius: 2,
                    zIndex: 0,
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </Box>

      {uploading && (
        <Box sx={{ px: 3, pb: 1 }}>
          <LinearProgress variant="determinate" value={uploadProgress} sx={{ borderRadius: 4, height: 6 }} />
          <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'center', color: theme.palette.text.secondary }}>
            {isWeb ? 'Adding web page...' : 'Uploading...'} {uploadProgress}%
          </Typography>
        </Box>
      )}

      <DialogContent sx={{ pt: 1 }}>
        {renderStepContent()}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, display: 'flex', justifyContent: 'space-between' }}>
        <Button onClick={() => handleClose(false)} disabled={uploading || ingesting}>
          Cancel
        </Button>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeStep > 0 && (
            <Button
              onClick={async () => {
                if (uploadedDoc) {
                  try {
                    await kbApi.deleteDocument(kbId, uploadedDoc.id);
                  } catch { /* best-effort */ }
                  setUploadedDoc(null);
                  setFile(null);
                  setUploadProgress(0);
                }
                setActiveStep((s) => s - 1);
              }}
              disabled={uploading || ingesting}
            >
              Back
            </Button>
          )}
          {activeStep < 2 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                uploading ||
                (activeStep === 0 && !selectedLoader) ||
                (activeStep === 0 && !isWeb && !file) ||
                (activeStep === 0 && isWeb && !url.trim()) ||
                (activeStep === 1 && !chunkerName)
              }
            >
              {uploading ? <CircularProgress size={20} /> : 'Next'}
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleProcess}
              disabled={ingesting}
              sx={{
                backgroundColor: theme.palette.success.main,
                '&:hover': { backgroundColor: theme.palette.success.dark || '#1e8449' },
              }}
            >
              {ingesting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Process'}
            </Button>
          )}
        </Box>
      </DialogActions>
    </Dialog>
  );
};

export default AddContentDialog;
