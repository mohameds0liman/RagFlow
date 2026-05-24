import { useState, useEffect } from 'react';
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
  IconButton,
  Card,
  CardContent,
  useTheme,
} from '@mui/material';
import { IconX } from '@tabler/icons-react';
import { useDispatch } from 'react-redux';
import { ingestDocument } from '../../../store/slices/kbSlice';
import * as kbApi from '../../../api/knowledgeBaseApi';

const IngestStatusDialog = ({ open, onClose, kbId, document: doc }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();

  const [loaders, setLoaders] = useState([]);
  const [chunkers, setChunkers] = useState([]);
  const [loaderName, setLoaderName] = useState('');
  const [chunkerName, setChunkerName] = useState('');
  const [chunkSize, setChunkSize] = useState(1000);
  const [chunkOverlap, setChunkOverlap] = useState(200);
  const [loading, setLoading] = useState(false);
  const [ingesting, setIngesting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const init = async () => {
      setLoading(true);
      try {
        const { data: loaderData } = await kbApi.listComponents('loader');
        const loaderList = Object.entries(loaderData || {}).map(([name, inputs]) => ({ name, inputs }));
        setLoaders(loaderList);
        if (loaderList.length > 0) setLoaderName(loaderList[0].name);

        const { data: chunkerData } = await kbApi.listComponents('chunker');
        const chunkerList = Object.entries(chunkerData || {}).map(([name, inputs]) => ({ name, inputs }));
        setChunkers(chunkerList);
        if (chunkerList.length > 0) setChunkerName(chunkerList[0].name);
      } catch {
        enqueueSnackbar('Failed to load components', { variant: 'error' });
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [open, enqueueSnackbar]);

  const handleIngest = async () => {
    if (!loaderName || !chunkerName) return;
    setIngesting(true);
    try {
      await dispatch(ingestDocument({
        id: kbId,
        payload: {
          loader_name: loaderName,
          chunker_name: chunkerName,
          loader_config: {},
          chunker_config: { chunk_size: chunkSize, chunk_overlap: chunkOverlap },
          doc_id: doc.id,
        },
      })).unwrap();
      enqueueSnackbar('Document loaded and chunked successfully', { variant: 'success' });
      onClose(true);
    } catch (err) {
      enqueueSnackbar(err, { variant: 'error' });
    } finally {
      setIngesting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6">Load</Typography>
        <IconButton size="small" onClick={() => onClose(false)}>
          <IconX size={20} />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 2 }}>
              Document: <strong>{doc?.file_name}</strong>
            </Typography>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                    Loader
                  </Typography>
                  <TextField
                    select
                    label="Component"
                    fullWidth
                    size="small"
                    value={loaderName}
                    onChange={(e) => setLoaderName(e.target.value)}
                    sx={{ mb: 1 }}
                  >
                    {loaders.map((l) => (
                      <MenuItem key={l.name} value={l.name}>{l.name}</MenuItem>
                    ))}
                  </TextField>
                </CardContent>
              </Card>

              <Card sx={{ backgroundColor: theme.palette.background.paper, border: `1px solid ${theme.palette.divider}`, borderRadius: '12px' }}>
                <CardContent>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, color: theme.palette.text.primary }}>
                    Chunker
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
                    {chunkers.map((c) => (
                      <MenuItem key={c.name} value={c.name}>{c.name}</MenuItem>
                    ))}
                  </TextField>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      label="Chunk Size"
                      type="number"
                      size="small"
                      fullWidth
                      placeholder="1000"
                      value={chunkSize}
                      onChange={(e) => setChunkSize(Number(e.target.value))}
                    />
                    <TextField
                      label="Chunk Overlap"
                      type="number"
                      size="small"
                      fullWidth
                      placeholder="200"
                      value={chunkOverlap}
                      onChange={(e) => setChunkOverlap(Number(e.target.value))}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={() => onClose(false)} disabled={ingesting}>Cancel</Button>
        <Button variant="contained" onClick={handleIngest} disabled={loading || ingesting || !loaderName || !chunkerName}>
          {ingesting ? <CircularProgress size={20} /> : 'Load & Chunk'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default IngestStatusDialog;
