import { createTheme } from '@mui/material/styles';

const lightPalette = {
  background: { default: '#ffffff', paper: '#ffffff' },
  primary: { main: '#2196f3', light: '#e3f2fd', dark: '#1e88e5', contrastText: '#ffffff' },
  secondary: { main: '#673ab7', light: '#ede7f6', dark: '#5e35b1', contrastText: '#ffffff' },
  text: { primary: '#212121', secondary: '#9e9e9e' },
  divider: '#eeeeee',
  error: { main: '#f44336' },
  success: { main: '#00e676' },
  warning: { main: '#ffc107' },
};

const darkPalette = {
  background: { default: '#191b1f', paper: '#23262c' },
  primary: { main: '#7c4dff', light: '#454c59', dark: '#191b1f', contrastText: '#bdc8f0' },
  secondary: { main: '#7c4dff', light: '#454c59', dark: '#ffffff', contrastText: '#bdc8f0' },
  text: { primary: '#bdc8f0', secondary: '#8492c4' },
  divider: '#32353b',
  error: { main: '#f44336' },
  success: { main: '#00e676' },
  warning: { main: '#ffc107' },
};

const getTheme = (mode) => {
  const isDark = mode === 'dark';
  const palette = isDark ? darkPalette : lightPalette;

  return createTheme({
    breakpoints: {
      values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
    },
    palette: {
      mode: isDark ? 'dark' : 'light',
      ...palette,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: { fontWeight: 700, fontSize: '2rem' },
      h2: { fontWeight: 600, fontSize: '1.5rem' },
      h3: { fontWeight: 600, fontSize: '1.25rem' },
      h4: { fontWeight: 600, fontSize: '1rem' },
      body1: { fontSize: '0.875rem' },
      body2: { fontSize: '0.8125rem' },
      caption: { fontSize: '0.75rem', color: isDark ? '#8492c4' : '#9e9e9e' },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: palette.background.default,
            minHeight: '100vh',
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: { backgroundImage: 'none' },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: isDark ? '#191b1f' : '#fafafa',
            borderRight: `1px solid ${palette.divider}`,
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            backgroundColor: palette.background.default,
            borderBottom: `1px solid ${palette.divider}`,
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
            '&:hover': { opacity: 0.9 },
          },
          outlined: {
            borderColor: palette.divider,
            color: palette.text.primary,
            '&:hover': {
              borderColor: palette.primary.main,
              backgroundColor: `${palette.primary.main}14`,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              backgroundColor: isDark ? '#252525' : '#fafafa',
              '& fieldset': { borderColor: palette.divider },
              '&:hover fieldset': { borderColor: palette.primary.main },
              '&.Mui-focused fieldset': { borderColor: palette.primary.main },
            },
            '& .MuiInputLabel-root': { color: palette.text.secondary },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: { backgroundColor: isDark ? '#252525' : '#fafafa' },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            '&.Mui-selected': { backgroundColor: `${palette.primary.main}1f` },
            '&:hover': { backgroundColor: `${palette.primary.main}14` },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: palette.text.secondary,
            '&:hover': { backgroundColor: `${palette.primary.main}14` },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: { borderRadius: 6, fontWeight: 500 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            backgroundImage: 'none',
            backgroundColor: palette.background.paper,
            border: `1px solid ${palette.divider}`,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-head': {
              backgroundColor: isDark ? '#252525' : '#fafafa',
              color: palette.text.secondary,
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
            borderBottomColor: palette.divider,
            color: palette.text.primary,
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: isDark ? '#252525' : '#f5f5f5',
            border: `1px solid ${palette.divider}`,
            color: palette.text.primary,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: palette.background.paper,
            border: `1px solid ${palette.divider}`,
            backgroundImage: 'none',
          },
        },
      },
    },
  });
};

export default getTheme;
