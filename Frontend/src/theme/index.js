import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  breakpoints: {
    values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  },
  palette: {
    mode: 'dark',
    background: {
      default: '#1A1F2E',
      paper: '#1E2330',
    },
    primary: {
      main: '#4B72FF',
      hover: '#3A5EE0',
      contrastText: '#E0E0E0',
    },
    secondary: {
      main: '#9099B0',
    },
    text: {
      primary: '#E0E0E0',
      secondary: '#9099B0',
    },
    divider: '#2D3448',
    error: {
      main: '#E74C3C',
    },
    success: {
      main: '#27AE60',
    },
    warning: {
      main: '#F39C12',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontWeight: 700, fontSize: '2rem' },
    h2: { fontWeight: 600, fontSize: '1.5rem' },
    h3: { fontWeight: 600, fontSize: '1.25rem' },
    h4: { fontWeight: 600, fontSize: '1rem' },
    body1: { fontSize: '0.875rem' },
    body2: { fontSize: '0.8125rem' },
    caption: { fontSize: '0.75rem', color: '#9099B0' },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#1A1F2E',
          minHeight: '100vh',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#171C2B',
          borderRight: '1px solid #2D3448',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#1A1F2E',
          borderBottom: '1px solid #2D3448',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          fontWeight: 600,
          borderRadius: 8,
          padding: '8px 16px',
        },
        containedPrimary: {
          backgroundColor: '#4B72FF',
          '&:hover': {
            backgroundColor: '#3A5EE0',
          },
        },
        outlined: {
          borderColor: '#2D3448',
          color: '#E0E0E0',
          '&:hover': {
            borderColor: '#4B72FF',
            backgroundColor: 'rgba(75,114,255,0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#232839',
            '& fieldset': {
              borderColor: '#2D3448',
            },
            '&:hover fieldset': {
              borderColor: '#4B72FF',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#4B72FF',
            },
          },
          '& .MuiInputLabel-root': {
            color: '#9099B0',
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#232839',
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&.Mui-selected': {
            backgroundColor: 'rgba(75,114,255,0.12)',
          },
          '&:hover': {
            backgroundColor: 'rgba(75,114,255,0.08)',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          color: '#9099B0',
          '&:hover': {
            backgroundColor: 'rgba(75,114,255,0.08)',
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundImage: 'none',
          backgroundColor: '#1E2330',
          border: '1px solid #2D3448',
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            backgroundColor: '#232839',
            color: '#9099B0',
            fontWeight: 600,
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottomColor: '#2D3448',
          color: '#E0E0E0',
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#232839',
          border: '1px solid #2D3448',
          color: '#E0E0E0',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#1E2330',
          border: '1px solid #2D3448',
          backgroundImage: 'none',
        },
      },
    },
  },
});

export default theme;
