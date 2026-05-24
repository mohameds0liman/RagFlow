import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  IconLayoutDashboard,
  IconDatabase,
  IconRobot,
  IconMessage,
  IconUsers,
  IconLogout,
  IconMenu2,
} from '@tabler/icons-react';
import { logout } from '../store/slices/authSlice';

const SIDEBAR_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: IconLayoutDashboard },
  { label: 'Document Stores', path: '/admin/document-stores', icon: IconDatabase },
  { label: 'Chatbots', path: '/admin/chatbots', icon: IconRobot },
  { label: 'Chat', path: '/admin/chat', icon: IconMessage },
  { label: 'Users', path: '/admin/users', icon: IconUsers },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const handleLogout = async () => {
    setAnchorEl(null);
    await dispatch(logout());
    navigate('/login');
  };

  const content = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ p: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar
          sx={{
            bgcolor: '#4B72FF',
            width: 36,
            height: 36,
            borderRadius: 1.5,
            fontWeight: 700,
            fontSize: '1rem',
          }}
        >
          R
        </Avatar>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#E0E0E0', fontSize: '1.1rem' }}>
          RAGFlow
        </Typography>
      </Box>
      <Divider sx={{ borderColor: '#2D3448' }} />
      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;
          return (
            <ListItemButton
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 1.5,
                mb: 0.5,
                pl: 2,
                borderLeft: isActive ? '4px solid #4B72FF' : '4px solid transparent',
                backgroundColor: isActive ? 'rgba(75,114,255,0.12)' : 'transparent',
                '&:hover': {
                  backgroundColor: isActive
                    ? 'rgba(75,114,255,0.15)'
                    : 'rgba(75,114,255,0.06)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: isActive ? '#4B72FF' : '#9099B0',
                }}
              >
                <Icon size={20} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? '#E0E0E0' : '#9099B0',
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          ml: { md: `${SIDEBAR_WIDTH}px` },
          backgroundColor: '#1A1F2E',
          borderBottom: '1px solid #2D3448',
          boxShadow: 'none',
        }}
      >
        <Toolbar sx={{ minHeight: '64px !important' }}>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <IconMenu2 size={22} />
          </IconButton>
          <Typography variant="body1" sx={{ flexGrow: 1, color: '#9099B0' }}>
            {navItems.find((item) => location.pathname.startsWith(item.path))?.label || 'RAGFlow'}
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
              A
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
        component="nav"
        sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: SIDEBAR_WIDTH },
          }}
        >
          {content}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: SIDEBAR_WIDTH },
          }}
          open
        >
          {content}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          mt: '64px',
          width: { md: `calc(100% - ${SIDEBAR_WIDTH}px)` },
          backgroundColor: '#1A1F2E',
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
