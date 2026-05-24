import { Chip } from '@mui/material';

const statusColorMap = {
  Pending: { bg: '#2D3448', color: '#9099B0' },
  Configured: { bg: 'rgba(39,174,96,0.15)', color: '#27AE60' },
  Active: { bg: 'rgba(39,174,96,0.15)', color: '#27AE60' },
  Inactive: { bg: 'rgba(231,76,60,0.15)', color: '#E74C3C' },
  Loaded: { bg: 'rgba(75,114,255,0.15)', color: '#4B72FF' },
  Processing: { bg: 'rgba(243,156,18,0.15)', color: '#F39C12' },
  Error: { bg: 'rgba(231,76,60,0.15)', color: '#E74C3C' },
  Granted: { bg: 'rgba(39,174,96,0.15)', color: '#27AE60' },
  Revoked: { bg: 'rgba(231,76,60,0.15)', color: '#E74C3C' },
};

const defaultStyle = { bg: '#2D3448', color: '#9099B0' };

const StatusChip = ({ status, ...props }) => {
  const style = statusColorMap[status] || defaultStyle;

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
