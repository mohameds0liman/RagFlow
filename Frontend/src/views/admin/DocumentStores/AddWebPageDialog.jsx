import { useState } from 'react';
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
  CircularProgress,
  IconButton,
  useTheme,
} from '@mui/material';
import { IconX, IconWorld } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { addWebPage } from '../../../store/slices/kbSlice';

const AddWebPageDialog = ({ open, onClose, kbId }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      enqueueSnackbar('Please enter a URL', { variant: 'error' });
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(addWebPage({ id: kbId, url: trimmedUrl, name: name.trim() || undefined })).unwrap();
      enqueueSnackbar('Web page added successfully', { variant: 'success' });
      setUrl('');
      setName('');
      onClose(true);
    } catch (err) {
      enqueueSnackbar(err, { variant: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setUrl('');
    setName('');
    onClose(false);
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Add Web Page</Typography>
        <IconButton size="small" onClick={handleClose} disabled={submitting}>
          <IconX size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
              py: 3,
              border: `2px dashed ${theme.palette.divider}`,
              borderRadius: '12px',
              backgroundColor: `${theme.palette.primary.main}06`,
            }}
          >
            <IconWorld size={40} style={{ color: theme.palette.primary.main }} />
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              Enter a web page URL to add as a document
            </Typography>
          </Box>
          <TextField
            label="URL"
            placeholder="https://example.com/page"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            fullWidth
            variant="outlined"
            disabled={submitting}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme.palette.divider },
                '&:hover fieldset': { borderColor: theme.palette.primary.main },
              },
            }}
          />
          <TextField
            label="Name (optional)"
            placeholder="My Web Page"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            variant="outlined"
            disabled={submitting}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: theme.palette.divider },
                '&:hover fieldset': { borderColor: theme.palette.primary.main },
              },
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>Cancel</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={!url.trim() || submitting}>
          {submitting ? <CircularProgress size={20} /> : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddWebPageDialog;
