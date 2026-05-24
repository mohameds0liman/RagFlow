import { Chip, useTheme } from '@mui/material';

const StatusChip = ({ status, ...props }) => {
  const theme = useTheme();

  const statusColorMap = {
    Pending: { bg: theme.palette.action.hover, color: theme.palette.text.secondary },
    Configured: { bg: `${theme.palette.success.main}26`, color: theme.palette.success.main },
    Active: { bg: `${theme.palette.success.main}26`, color: theme.palette.success.main },
    Inactive: { bg: `${theme.palette.error.main}26`, color: theme.palette.error.main },
    Loaded: { bg: `${theme.palette.primary.main}26`, color: theme.palette.primary.main },
    Processing: { bg: `${theme.palette.warning.main}26`, color: theme.palette.warning.main },
    Error: { bg: `${theme.palette.error.main}26`, color: theme.palette.error.main },
    Granted: { bg: `${theme.palette.success.main}26`, color: theme.palette.success.main },
    Revoked: { bg: `${theme.palette.error.main}26`, color: theme.palette.error.main },
    uploaded: { bg: `${theme.palette.primary.main}26`, color: theme.palette.primary.main },
    processing: { bg: `${theme.palette.warning.main}26`, color: theme.palette.warning.main },
    ready: { bg: `${theme.palette.success.main}26`, color: theme.palette.success.main },
    error: { bg: `${theme.palette.error.main}26`, color: theme.palette.error.main },
    active: { bg: `${theme.palette.success.main}26`, color: theme.palette.success.main },
    inactive: { bg: `${theme.palette.error.main}26`, color: theme.palette.error.main },
    pending: { bg: theme.palette.action.hover, color: theme.palette.text.secondary },
    completed: { bg: `${theme.palette.success.main}26`, color: theme.palette.success.main },
    embedded: { bg: `${theme.palette.primary.main}26`, color: theme.palette.primary.main },
  };

  const style = statusColorMap[status] || { bg: theme.palette.action.hover, color: theme.palette.text.secondary };

  return (
    <Chip
      label={status}
      size="small"
      sx={{
        backgroundColor: style.bg,
        color: style.color,
        fontWeight: 500,
        borderRadius: '6px',
        fontSize: '0.75rem',
      }}
      {...props}
    />
  );
};

export default StatusChip;
