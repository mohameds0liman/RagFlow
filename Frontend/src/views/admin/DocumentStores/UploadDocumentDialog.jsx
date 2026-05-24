import { useState, useCallback } from 'react';
import { useSnackbar } from 'notistack';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  CircularProgress,
  LinearProgress,
  IconButton,
  useTheme,
} from '@mui/material';
import { IconX, IconUpload, IconFile } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { uploadDocument } from '../../../store/slices/kbSlice';

const ACCEPTED_FORMATS = ['pdf', 'docx', 'txt', 'csv', 'html', 'md', 'json'];

const UploadDocumentDialog = ({ open, onClose, kbId }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [file, setFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSet(dropped);
  }, []);

  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) validateAndSet(selected);
  };

  const validateAndSet = (f) => {
    const ext = f.name.split('.').pop().toLowerCase();
    if (!ACCEPTED_FORMATS.includes(ext)) {
      enqueueSnackbar(`Format .${ext} is not supported. Accepted: ${ACCEPTED_FORMATS.join(', ')}`, { variant: 'error' });
      return;
    }
    setFile(f);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85));
    }, 300);
    try {
      await dispatch(uploadDocument({ id: kbId, file })).unwrap();
      clearInterval(interval);
      setProgress(100);
      enqueueSnackbar(`"${file.name}" uploaded successfully`, { variant: 'success' });
      setTimeout(() => {
        setFile(null);
        setProgress(0);
        onClose(true);
      }, 500);
    } catch (err) {
      clearInterval(interval);
      setProgress(0);
      enqueueSnackbar(err, { variant: 'error' });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => { if (!uploading) onClose(false); }} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Upload Document</Typography>
        <IconButton size="small" onClick={() => onClose(false)} disabled={uploading}>
          <IconX size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 2 }}>
          {ACCEPTED_FORMATS.map((fmt) => (
            <Chip key={fmt} label={`.${fmt}`} size="small" variant="outlined"
              sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider }}
            />
          ))}
        </Box>

        <Box
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('file-input').click()}
          sx={{
            border: `2px dashed ${dragOver ? theme.palette.primary.main : theme.palette.divider}`,
            borderRadius: '12px',
            p: 4,
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
          <input
            id="file-input"
            type="file"
            hidden
            onChange={handleFileSelect}
            accept={ACCEPTED_FORMATS.map((f) => `.${f}`).join(',')}
          />
          {file ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <IconFile size={36} style={{ color: theme.palette.primary.main }} />
              <Typography variant="body1" sx={{ fontWeight: 500, color: theme.palette.text.primary }}>
                {file.name}
              </Typography>
              <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </Typography>
              <Button size="small" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                Remove
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
              <IconUpload size={36} style={{ color: theme.palette.text.disabled }} />
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                Drop a file here or click to browse
              </Typography>
            </Box>
          )}
        </Box>

        {uploading && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 4 }} />
            <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'center', color: theme.palette.text.secondary }}>
              Uploading... {progress}%
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => onClose(false)} disabled={uploading}>Cancel</Button>
        <Button variant="contained" onClick={handleUpload} disabled={!file || uploading}>
          {uploading ? <CircularProgress size={20} /> : 'Upload'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UploadDocumentDialog;
