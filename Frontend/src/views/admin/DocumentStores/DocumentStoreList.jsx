import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconDatabase,
  IconFileDescription,
  IconNumbers,
  IconRobot,
} from '@tabler/icons-react';
import MainCard from '../../../components/MainCard';
import StatusChip from '../../../components/StatusChip';
import ConfirmDialog from '../../../components/ConfirmDialog';
import {
  fetchKnowledgeBases,
  createKnowledgeBase,
  updateKnowledgeBase,
  deleteKnowledgeBase,
} from '../../../store/slices/kbSlice';

const DocumentStoreList = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { list, loading } = useSelector((state) => state.knowledgeBases);

  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedKB, setSelectedKB] = useState(null);
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [saving, setSaving] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuKB, setMenuKB] = useState(null);

  useEffect(() => {
    dispatch(fetchKnowledgeBases());
  }, [dispatch]);

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      await dispatch(createKnowledgeBase({ name: formName.trim(), description: formDesc.trim() })).unwrap();
      enqueueSnackbar('Knowledge base created', { variant: 'success' });
      setCreateOpen(false);
      setFormName('');
      setFormDesc('');
    } catch (err) {
      enqueueSnackbar(err, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    try {
      await dispatch(updateKnowledgeBase({
        id: selectedKB.id,
        payload: { name: formName.trim(), description: formDesc.trim() },
      })).unwrap();
      enqueueSnackbar('Knowledge base updated', { variant: 'success' });
      setEditOpen(false);
    } catch (err) {
      enqueueSnackbar(err, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await dispatch(deleteKnowledgeBase(selectedKB.id)).unwrap();
      enqueueSnackbar('Knowledge base deleted', { variant: 'success' });
      setDeleteOpen(false);
    } catch (err) {
      enqueueSnackbar(err, { variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (kb) => {
    setSelectedKB(kb);
    setFormName(kb.name);
    setFormDesc(kb.description || '');
    setEditOpen(true);
  };

  const openDelete = (kb) => {
    setSelectedKB(kb);
    setDeleteOpen(true);
  };

  const handleMenuOpen = (e, kb) => {
    setMenuAnchor(e.currentTarget);
    setMenuKB(kb);
  };

  return (
    <MainCard title="Document Stores">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<IconPlus size={18} />}
          onClick={() => {
            setFormName('');
            setFormDesc('');
            setCreateOpen(true);
          }}
        >
          Add Document Store
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : list.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <IconDatabase size={48} style={{ color: theme.palette.text.disabled }} />
          <Typography variant="h6" sx={{ mt: 2, color: theme.palette.text.secondary }}>
            No document stores yet
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.disabled, mb: 3 }}>
            Create your first document store to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => {
              setFormName('');
              setFormDesc('');
              setCreateOpen(true);
            }}
          >
            Add Document Store
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {list.map((kb) => (
            <Grid item xs={12} sm={6} md={4} key={kb.id}>
              <Card
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  '&:hover': {
                    borderColor: theme.palette.primary.main,
                  },
                  position: 'relative',
                }}
                onClick={() => navigate(`/admin/document-stores/${kb.id}`)}
              >
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="h6" noWrap sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 0.5 }}>
                        {kb.name}
                      </Typography>
                      {kb.description && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: theme.palette.text.secondary,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            mb: 1.5,
                          }}
                        >
                          {kb.description}
                        </Typography>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMenuOpen(e, kb);
                      }}
                      sx={{ ml: 1, color: theme.palette.text.secondary }}
                    >
                      <IconDots size={18} />
                    </IconButton>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <StatusChip status={kb.status} />
                    {kb.upsertion_config_ready && <StatusChip status="Configured" />}
                  </Box>
                </CardContent>
                <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconFileDescription size={14} style={{ color: theme.palette.text.disabled }} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                        {kb.documents_count ?? 0} docs
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconNumbers size={14} style={{ color: theme.palette.text.disabled }} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                        {kb.chunks_count ?? 0} chunks
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <IconRobot size={14} style={{ color: theme.palette.text.disabled }} />
                      <Typography variant="caption" sx={{ color: theme.palette.text.disabled }}>
                        {kb.chatbots_count ?? 0} bots
                      </Typography>
                    </Box>
                  </Box>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setMenuAnchor(null); openEdit(menuKB); }}>
          <ListItemIcon><IconEdit size={18} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); openDelete(menuKB); }}>
          <ListItemIcon><IconTrash size={18} color={theme.palette.error.main} /></ListItemIcon>
          <ListItemText sx={{ color: theme.palette.error.main }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Document Store</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Name"
            fullWidth
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!formName.trim() || saving}>
            {saving ? <CircularProgress size={20} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Document Store</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            label="Name"
            fullWidth
            required
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            sx={{ mt: 1, mb: 2 }}
          />
          <TextField
            label="Description (optional)"
            fullWidth
            multiline
            rows={3}
            value={formDesc}
            onChange={(e) => setFormDesc(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)} disabled={saving}>Cancel</Button>
          <Button variant="contained" onClick={handleEdit} disabled={!formName.trim() || saving}>
            {saving ? <CircularProgress size={20} /> : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Document Store"
        message={`Are you sure you want to delete "${selectedKB?.name}"? This will also delete all documents, chunks, and linked chatbots. This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={saving}
      />
    </MainCard>
  );
};

export default DocumentStoreList;
