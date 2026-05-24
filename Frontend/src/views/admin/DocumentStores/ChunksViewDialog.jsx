import { useEffect, useState } from 'react';
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
  IconButton,
  CircularProgress,
  Divider,
  Tooltip,
  useTheme,
} from '@mui/material';
import {
  IconX,
  IconEdit,
  IconTrash,
} from '@tabler/icons-react';
import { useDispatch, useSelector } from 'react-redux';
import StyledDataGrid from '../../../components/StyledDataGrid';
import ConfirmDialog from '../../../components/ConfirmDialog';
import {
  fetchChunks,
  updateChunk,
  deleteChunk,
} from '../../../store/slices/kbSlice';

const ChunksViewDialog = ({ open, onClose, kbId, document: doc }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { chunks, chunkLoading } = useSelector((state) => state.knowledgeBases);

  const [editChunk, setEditChunk] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [deleteChunkId, setDeleteChunkId] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && doc?.id) {
      dispatch(fetchChunks({ id: kbId, docId: doc.id }));
    }
  }, [open, kbId, doc, dispatch]);

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    try {
      await dispatch(updateChunk({
        id: kbId,
        chunkId: editChunk.id,
        payload: { content: editContent, meta_data: editChunk.meta_data || {} },
      })).unwrap();
      enqueueSnackbar('Chunk updated', { variant: 'success' });
      setEditChunk(null);
    } catch (err) {
      enqueueSnackbar(err, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await dispatch(deleteChunk({ id: kbId, chunkId: deleteChunkId })).unwrap();
      enqueueSnackbar('Chunk deleted', { variant: 'success' });
      setDeleteChunkId(null);
    } catch (err) {
      enqueueSnackbar(err, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpsert = async () => {
    setUpserting(true);
    try {
      await dispatch(triggerUpsert({ id: kbId, docId: doc.id })).unwrap();
      enqueueSnackbar('Upsert triggered successfully', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err, { variant: 'error' });
    } finally {
      setUpserting(false);
    }
  };

  const columns = [
    { field: 'chunk_no', headerName: '#', width: 60 },
    {
      field: 'page_content',
      headerName: 'Content',
      flex: 1,
      minWidth: 300,
      renderCell: (params) => (
        <Typography
          variant="body2"
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            color: theme.palette.text.primary,
            lineHeight: 1.4,
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => (
        <Typography
          variant="caption"
          sx={{
            color: params.value === 'embedded' ? theme.palette.success.main : theme.palette.text.secondary,
            fontWeight: 500,
          }}
        >
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Edit">
            <IconButton
              size="small"
              onClick={() => {
                setEditChunk(params.row);
                setEditContent(params.row.page_content);
              }}
            >
              <IconEdit size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => setDeleteChunkId(params.row.id)}
              sx={{ color: theme.palette.error.main }}
            >
              <IconTrash size={16} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="lg" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6">Chunks: {doc?.file_name}</Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
              {chunks.length} chunk{chunks.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            <IconButton size="small" onClick={() => onClose(false)}>
              <IconX size={20} />
            </IconButton>
          </Box>
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ minHeight: 400 }}>
          {chunkLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : chunks.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                No chunks found. Load the document first.
              </Typography>
            </Box>
          ) : (
            <StyledDataGrid
              rows={chunks}
              columns={columns}
              getRowId={(row) => row.id}
              pageSize={20}
              rowsPerPageOptions={[20]}
              disableRowSelectionOnClick
              autoHeight
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => onClose(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(editChunk)} onClose={() => setEditChunk(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          Edit Chunk #{editChunk?.chunk_no}
          <IconButton size="small" onClick={() => setEditChunk(null)} sx={{ float: 'right' }}>
            <IconX size={20} />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <TextField
            multiline
            rows={10}
            fullWidth
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditChunk(null)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveEdit} disabled={!editContent.trim() || saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteChunkId)}
        title="Delete Chunk"
        message="Are you sure you want to delete this chunk? This action cannot be undone."
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteChunkId(null)}
        loading={saving}
      />
    </>
  );
};

export default ChunksViewDialog;
