import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import {
  Box,
  Typography,
  Button,
  Breadcrumbs,
  Link,
  IconButton,
  Tooltip,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Chip,
  Grid,
  useTheme,
} from '@mui/material';
import {
  IconArrowLeft,
  IconUpload,
  IconWorld,
  IconSettings,
  IconPlayerPlay,
  IconCloudUpload,
  IconCircleCheckFilled,
  IconEye,
  IconTrash,
  IconFileDescription,
  IconFile,
  IconNumbers,
} from '@tabler/icons-react';
import MainCard from '../../../components/MainCard';
import StatusChip from '../../../components/StatusChip';
import ConfirmDialog from '../../../components/ConfirmDialog';
import {
  fetchKnowledgeBases,
  fetchDocuments,
  deleteDocument,
  triggerUpsert,
  setSelectedKB,
} from '../../../store/slices/kbSlice';
import UpsertionConfigDialog from './UpsertionConfigDialog';
import UploadDocumentDialog from './UploadDocumentDialog';
import AddWebPageDialog from './AddWebPageDialog';
import IngestStatusDialog from './IngestStatusDialog';
import ChunksViewDialog from './ChunksViewDialog';

const DocumentStoreDetail = () => {
  const { id } = useParams();
  const theme = useTheme();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { list, selectedKB, documents, documentLoading } = useSelector((state) => state.knowledgeBases);

  const [upsertConfigOpen, setUpsertConfigOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [webPageOpen, setWebPageOpen] = useState(false);
  const [ingestOpen, setIngestOpen] = useState(false);
  const [chunksOpen, setChunksOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (list.length === 0) {
      dispatch(fetchKnowledgeBases());
    }
  }, [dispatch, list.length]);

  useEffect(() => {
    const kb = list.find((k) => k.id === id);
    if (kb) {
      dispatch(setSelectedKB(kb));
      dispatch(fetchDocuments(id));
    }
  }, [dispatch, id, list]);

  const handleDeleteDoc = useCallback(async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      await dispatch(deleteDocument({ id, docId: deleteConfirm.id })).unwrap();
      enqueueSnackbar('Document deleted', { variant: 'success' });
      setDeleteConfirm(null);
    } catch (err) {
      enqueueSnackbar(err, { variant: 'error' });
    } finally {
      setDeleting(false);
    }
  }, [dispatch, id, deleteConfirm, enqueueSnackbar]);

  const [upsertingDocId, setUpsertingDocId] = useState(null);
  const [recentUpsert, setRecentUpsert] = useState(null);

  const handleUpsert = useCallback(async (doc) => {
    setUpsertingDocId(doc.id);
    try {
      await dispatch(triggerUpsert({ id, docId: doc.id })).unwrap();
      setUpsertingDocId(null);
      setRecentUpsert(doc.id);
      setTimeout(() => setRecentUpsert(null), 2000);
    } catch (err) {
      setUpsertingDocId(null);
      const msg = typeof err === 'string' ? err : JSON.stringify(err?.response?.data || err);
      enqueueSnackbar(msg, { variant: 'error' });
    }
  }, [dispatch, id, enqueueSnackbar]);

  return (
    <>
      <Box sx={{ mb: 2 }}>
        <Breadcrumbs sx={{ mb: 1 }}>
          <Link
            underline="hover"
            color="inherit"
            sx={{ cursor: 'pointer', color: theme.palette.text.secondary }}
            onClick={() => navigate('/admin/document-stores')}
          >
            Document Stores
          </Link>
          <Typography sx={{ color: theme.palette.text.primary }}>
            {selectedKB?.name || 'Loading...'}
          </Typography>
        </Breadcrumbs>
      </Box>

      <MainCard title={selectedKB?.name || 'Document Store'}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button
              variant="text"
              startIcon={<IconArrowLeft size={18} />}
              onClick={() => navigate('/admin/document-stores')}
              sx={{ color: theme.palette.text.secondary }}
            >
              Back
            </Button>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<IconUpload size={18} />}
              onClick={() => setUploadOpen(true)}
            >
              Upload
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconWorld size={18} />}
              onClick={() => setWebPageOpen(true)}
            >
              Add Web Page
            </Button>
            <Button
              variant="outlined"
              startIcon={<IconSettings size={18} />}
              onClick={() => setUpsertConfigOpen(true)}
            >
              Upsert Config
            </Button>
          </Box>
        </Box>

        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2, color: theme.palette.text.primary }}>
          Documents
        </Typography>

        {documentLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : documents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <IconFileDescription size={40} style={{ color: theme.palette.text.disabled }} />
            <Typography variant="body1" sx={{ mt: 1, color: theme.palette.text.secondary }}>
              No documents added yet
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                startIcon={<IconUpload size={18} />}
                onClick={() => setUploadOpen(true)}
              >
                Upload Document
              </Button>
              <Button
                variant="outlined"
                startIcon={<IconWorld size={18} />}
                onClick={() => setWebPageOpen(true)}
              >
                Add Web Page
              </Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
            {documents.map((doc) => (
              <Card
                  sx={{
                    backgroundColor: theme.palette.background.paper,
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: '12px',
                    display: 'flex',
                    flexDirection: 'column',
                    aspectRatio: '5 / 2',
                    transition: 'border-color 0.2s',
                    '&:hover': {
                      borderColor: theme.palette.primary.main,
                    },
                  }}
                >
                  <CardContent sx={{ pb: 1, flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                      {doc.file_type === 'url' ? (
                        <IconWorld size={24} style={{ color: theme.palette.primary.main, marginTop: 2, flexShrink: 0 }} />
                      ) : (
                        <IconFile size={24} style={{ color: theme.palette.primary.main, marginTop: 2, flexShrink: 0 }} />
                      )}
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" noWrap sx={{ fontWeight: 600, color: theme.palette.text.primary, fontSize: '1rem' }}>
                          {doc.file_name}
                        </Typography>
                        {doc.file_type === 'url' && (
                          <Typography variant="caption" noWrap sx={{ color: theme.palette.text.disabled, mt: 0.25, display: 'block' }}>
                            {doc.file_path}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                      <CardActions sx={{ pt: 0, px: 2, pb: 1.5, display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <StatusChip status={doc.status} />
                          {doc.file_type === 'url' ? (
                            <Chip label="URL" size="small" variant="outlined" sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, height: 28 }} />
                          ) : (
                            <Chip label={`.${doc.file_type}`} size="small" variant="outlined" sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, height: 28 }} />
                          )}
                          {doc.file_type !== 'url' && (
                            <Chip label={`${doc.file_size_mb?.toFixed(2)} MB`} size="small" variant="outlined" sx={{ color: theme.palette.text.secondary, borderColor: theme.palette.divider, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, height: 28 }} />
                          )}
                          <Chip label={`${doc.chunks_count ?? 0} chunks`} size="small" variant="outlined" sx={{ color: theme.palette.warning.main, borderColor: theme.palette.warning.main, borderRadius: '8px', fontSize: '0.8rem', fontWeight: 500, height: 28 }} />
                        </Box>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Load">
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedDoc(doc); setIngestOpen(true); }}
                          disabled={doc.status === 'ready'}
                          sx={{ width: 32, height: 32 }}
                        >
                          <IconPlayerPlay size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Upsert">
                        <IconButton
                          size="small"
                          onClick={() => handleUpsert(doc)}
                          disabled={doc.status !== 'ready' || upsertingDocId === doc.id}
                          sx={{
                            width: 32,
                            height: 32,
                            color: recentUpsert === doc.id ? theme.palette.success.main : theme.palette.primary.main,
                          }}
                        >
                          {upsertingDocId === doc.id ? (
                            <Box sx={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, ml: -1, mt: -1 }}>
                              <IconCloudUpload size={18} />
                              <CircularProgress size={32} thickness={2.5} sx={{ position: 'absolute', top: 0, left: 0, color: theme.palette.primary.main }} />
                            </Box>
                          ) : recentUpsert === doc.id ? (
                            <IconCircleCheckFilled size={18} />
                          ) : (
                            <IconCloudUpload size={18} />
                          )}
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View & Edit Chunks">
                        <IconButton
                          size="small"
                          onClick={() => { setSelectedDoc(doc); setChunksOpen(true); }}
                          disabled={doc.status !== 'ready'}
                          sx={{ width: 32, height: 32 }}
                        >
                          <IconEye size={18} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          onClick={() => setDeleteConfirm(doc)}
                          sx={{ color: theme.palette.error.main, width: 32, height: 32 }}
                        >
                          <IconTrash size={18} />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </Card>
            ))}
          </Box>
        )}
      </MainCard>

      <UpsertionConfigDialog
        open={upsertConfigOpen}
        onClose={(saved) => {
          setUpsertConfigOpen(false);
          if (saved) dispatch(fetchKnowledgeBases());
        }}
        kbId={id}
        existingConfig={selectedKB?.upsert_config_snapshot || null}
      />

      <UploadDocumentDialog
        open={uploadOpen}
        onClose={(uploaded) => {
          setUploadOpen(false);
          if (uploaded) {
            dispatch(fetchDocuments(id));
            dispatch(fetchKnowledgeBases());
          }
        }}
        kbId={id}
      />

      <AddWebPageDialog
        open={webPageOpen}
        onClose={(added) => {
          setWebPageOpen(false);
          if (added) {
            dispatch(fetchDocuments(id));
            dispatch(fetchKnowledgeBases());
          }
        }}
        kbId={id}
      />

      <IngestStatusDialog
        open={ingestOpen}
        onClose={(ingested) => {
          setIngestOpen(false);
          if (ingested) dispatch(fetchDocuments(id));
        }}
        kbId={id}
        document={selectedDoc}
      />

      <ChunksViewDialog
        open={chunksOpen}
        onClose={() => setChunksOpen(false)}
        kbId={id}
        document={selectedDoc}
      />

      <ConfirmDialog
        open={Boolean(deleteConfirm)}
        title="Delete Document"
        message={`Are you sure you want to delete "${deleteConfirm?.file_name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteDoc}
        onCancel={() => setDeleteConfirm(null)}
        loading={deleting}
      />
    </>
  );
};

export default DocumentStoreDetail;
