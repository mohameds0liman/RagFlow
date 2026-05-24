import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';

const ConfirmDialog = ({
  open,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  loading = false,
}) => (
  <Dialog
    open={open}
    onClose={onCancel}
    maxWidth="xs"
    fullWidth
  >
    <DialogTitle sx={{ color: '#E0E0E0', fontWeight: 600 }}>{title}</DialogTitle>
    <DialogContent>
      <DialogContentText sx={{ color: '#9099B0' }}>
        {message}
      </DialogContentText>
    </DialogContent>
    <DialogActions sx={{ px: 3, pb: 2 }}>
      <Button onClick={onCancel} disabled={loading} sx={{ color: '#9099B0' }}>
        {cancelText}
      </Button>
      <Button
        onClick={onConfirm}
        variant="contained"
        disabled={loading}
        sx={{
          backgroundColor: '#E74C3C',
          '&:hover': { backgroundColor: '#c0392b' },
        }}
      >
        {confirmText}
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
