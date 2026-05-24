import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { IconLogout, IconMessage } from '@tabler/icons-react';
import { logout } from '../store/slices/authSlice';

const UserLayout = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: '#171C2B',
          borderBottom: '1px solid #2D3448',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <Avatar
            sx={{
              bgcolor: '#4B72FF',
              width: 32,
              height: 32,
              borderRadius: 1.5,
              mr: 1.5,
              fontWeight: 700,
              fontSize: '0.875rem',
            }}
          >
            R
          </Avatar>
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#E0E0E0', flexGrow: 1 }}
          >
            RAGFlow
          </Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: '#4B72FF',
                fontSize: '0.875rem',
                fontWeight: 600,
              }}
            >
              U
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <IconLogout size={18} />
              </ListItemIcon>
              <ListItemText>Logout</ListItemText>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px',
          backgroundColor: '#1A1F2E',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default UserLayout;
