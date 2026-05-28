import { Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Avatar,
  useTheme,
} from '@mui/material';

const UserLayout = () => {
  const theme = useTheme();
  const selectedChatbot = useSelector((state) => state.userChat.selectedChatbot);
  const activeSessionId = useSelector((state) => state.userChat.activeSessionId);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
          boxShadow: 'none',
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar sx={{ minHeight: '56px !important', gap: 2 }}>
          {/* Logo */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
            <Avatar
              sx={{
                bgcolor: theme.palette.primary.main,
                width: 28,
                height: 28,
                borderRadius: 1,
                fontWeight: 700,
                fontSize: '0.75rem',
              }}
            >
              R
            </Avatar>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 700,
                color: theme.palette.text.primary,
                display: { xs: 'none', sm: 'block' },
              }}
            >
              RAGFlow
            </Typography>
          </Box>

          {/* Current chatbot name - only when a session is active */}
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'center', minWidth: 0 }}>
            {selectedChatbot && activeSessionId && (
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 600,
                  color: theme.palette.text.secondary,
                  px: 2,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: `${theme.palette.primary.main}08`,
                }}
              >
                {selectedChatbot.name}
              </Typography>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flex: 1,
          mt: '56px',
          backgroundColor: theme.palette.background.default,
          overflow: 'hidden',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default UserLayout;
