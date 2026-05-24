import { DataGrid } from '@mui/x-data-grid';
import { Box, useTheme } from '@mui/material';

const StyledDataGrid = (props) => {
  const theme = useTheme();

  return (
    <Box sx={{ width: '100%', '& .MuiDataGrid-root': { border: 'none' } }}>
      <DataGrid
        sx={{
          backgroundColor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          borderRadius: '12px',
          color: theme.palette.text.primary,
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: theme.palette.action.hover,
            color: theme.palette.text.secondary,
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            borderBottom: `1px solid ${theme.palette.divider}`,
          },
          '& .MuiDataGrid-cell': {
            borderBottom: `1px solid ${theme.palette.divider}`,
            color: theme.palette.text.primary,
          },
          '& .MuiDataGrid-row:hover': {
            backgroundColor: `${theme.palette.primary.main}0a`,
          },
          '& .MuiDataGrid-footerContainer': {
            borderTop: `1px solid ${theme.palette.divider}`,
            backgroundColor: theme.palette.action.hover,
          },
          '& .MuiTablePagination-root': {
            color: theme.palette.text.secondary,
          },
          '& .MuiDataGrid-selectedRowCount': {
            color: theme.palette.text.secondary,
          },
          '& .MuiCheckbox-root': {
            color: theme.palette.primary.main,
          },
          '& .MuiDataGrid-sortIcon': {
            color: theme.palette.text.secondary,
          },
          '& .MuiDataGrid-menuIcon': {
            color: theme.palette.text.secondary,
          },
          '& .MuiDataGrid-columnSeparator': {
            color: theme.palette.divider,
          },
          '& .MuiDataGrid-withBorder': {
            borderRight: `1px solid ${theme.palette.divider}`,
          },
        }}
        autoHeight
        disableRowSelectionOnClick
        {...props}
      />
    </Box>
  );
};

export default StyledDataGrid;
