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
  useTheme,
} from '@mui/material';
import {
  IconArrowLeft,
  IconUpload,
  IconSettings,
  IconPlayerPlay,
  IconEye,
  IconTrash,
  IconFileDescription,
} from '@tabler/icons-react';
import MainCard from '../../../components/MainCard';
import StyledDataGrid from '../../../components/StyledDataGrid';
import StatusChip from '../../../components/StatusChip';
import ConfirmDialog from '../../../components/ConfirmDialog';
import {
  fetchKnowledgeBases,
  fetchDocuments,
  deleteDocument,
  setSelectedKB,
} from '../../../store/slices/kbSlice';
import UpsertionConfigDialog from './UpsertionConfigDialog';
import UploadDocumentDialog from './UploadDocumentDialog';
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

  const columns = [
    { field: 'file_name', headerName: 'File Name', flex: 1, minWidth: 200 },
    {
      field: 'file_type',
      headerName: 'Type',
      width: 80,
      renderCell: (params) => (
        <Typography variant="caption" sx={{ color: theme.palette.text.secondary, textTransform: 'uppercase' }}>
          {params.value}
        </Typography>
      ),
    },
    {
      field: 'file_size_mb',
      headerName: 'Size (MB)',
      width: 100,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {params.value?.toFixed(2)}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: 'created_date',
      headerName: 'Uploaded',
      width: 170,
      renderCell: (params) => (
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          {params.value ? new Date(params.value).toLocaleString() : '-'}
        </Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Load & Chunk">
            <IconButton
              size="small"
              onClick={() => { setSelectedDoc(params.row); setIngestOpen(true); }}
              disabled={params.row.status === 'ready'}
            >
              <IconPlayerPlay size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="View Chunks">
            <IconButton
              size="small"
              onClick={() => { setSelectedDoc(params.row); setChunksOpen(true); }}
              disabled={params.row.status !== 'ready'}
            >
              <IconEye size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton
              size="small"
              onClick={() => setDeleteConfirm(params.row)}
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
            <StatusChip status={selectedKB?.status} />
            {selectedKB?.upsertion_config_ready && <StatusChip status="Configured" />}
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
              startIcon={<IconSettings size={18} />}
              onClick={() => setUpsertConfigOpen(true)}
            >
              Upsertion Config
            </Button>
          </Box>
        </Box>

        {selectedKB?.description && (
          <Typography variant="body2" sx={{ color: theme.palette.text.secondary, mb: 3 }}>
            {selectedKB.description}
          </Typography>
        )}

        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
              {selectedKB?.documents_count ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Documents</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
              {selectedKB?.chunks_count ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Chunks</Typography>
          </Box>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h4" sx={{ color: theme.palette.primary.main, fontWeight: 700 }}>
              {selectedKB?.chatbots_count ?? 0}
            </Typography>
            <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>Chatbots</Typography>
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
              No documents uploaded yet
            </Typography>
            <Button
              variant="contained"
              startIcon={<IconUpload size={18} />}
              onClick={() => setUploadOpen(true)}
              sx={{ mt: 2 }}
            >
              Upload Document
            </Button>
          </Box>
        ) : (
          <StyledDataGrid
            rows={documents}
            columns={columns}
            getRowId={(row) => row.id}
            pageSize={10}
            rowsPerPageOptions={[10]}
            disableRowSelectionOnClick
            autoHeight
          />
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
