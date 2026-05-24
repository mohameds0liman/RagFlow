import { DataGrid } from '@mui/x-data-grid';
import { Box } from '@mui/material';

const StyledDataGrid = (props) => (
  <Box sx={{ width: '100%', '& .MuiDataGrid-root': { border: 'none' } }}>
    <DataGrid
      sx={{
        backgroundColor: '#1E2330',
        border: '1px solid #2D3448',
        borderRadius: '12px',
        color: '#E0E0E0',
        '& .MuiDataGrid-columnHeaders': {
          backgroundColor: '#232839',
          color: '#9099B0',
          fontWeight: 600,
          fontSize: '0.75rem',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          borderBottom: '1px solid #2D3448',
        },
        '& .MuiDataGrid-cell': {
          borderBottom: '1px solid #2D3448',
          color: '#E0E0E0',
        },
        '& .MuiDataGrid-row:hover': {
          backgroundColor: 'rgba(75,114,255,0.04)',
        },
        '& .MuiDataGrid-footerContainer': {
          borderTop: '1px solid #2D3448',
          backgroundColor: '#232839',
        },
        '& .MuiTablePagination-root': {
          color: '#9099B0',
        },
        '& .MuiDataGrid-selectedRowCount': {
          color: '#9099B0',
        },
        '& .MuiCheckbox-root': {
          color: '#4B72FF',
        },
        '& .MuiDataGrid-sortIcon': {
          color: '#9099B0',
        },
        '& .MuiDataGrid-menuIcon': {
          color: '#9099B0',
        },
        '& .MuiDataGrid-columnSeparator': {
          color: '#2D3448',
        },
        '& .MuiDataGrid-withBorder': {
          borderRight: '1px solid #2D3448',
        },
      }}
      autoHeight
      disableRowSelectionOnClick
      {...props}
    />
  </Box>
);

export default StyledDataGrid;
