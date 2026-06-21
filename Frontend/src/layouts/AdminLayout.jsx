import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
  useTheme,
} from '@mui/material';
import {
  IconLayoutDashboard,
  IconDatabase,
  IconRobot,
  IconMessage,
  IconUsers,
  IconUserCircle,
  IconSettings,
  IconLogout,
  IconMenu2,
  IconSun,
  IconMoon,
} from '@tabler/icons-react';
import { logout } from '../store/slices/authSlice';
import { toggleTheme } from '../store/slices/themeSlice';

const SIDEBAR_WIDTH = 260;

const navItems = [
  { label: 'Dashboard', path: '/admin/dashboard', icon: IconLayoutDashboard },
  { label: 'Document Stores', path: '/admin/document-stores', icon: IconDatabase },
  { label: 'Chatbots', path: '/admin/chatbots', icon: IconRobot },
  { label: 'Chat', path: '/admin/chat', icon: IconMessage },
  { label: 'Users', path: '/admin/users', icon: IconUsers },
];

const bottomNavItems = [
  { label: 'Profile', path: '/admin/profile', icon: IconUserCircle },
  { label: 'Settings', path: '/admin/settings', icon: IconSettings },
];

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const theme = useTheme();
  const themeMode = useSelector((state) => state.theme.mode);
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
        <Box
          component="img"
          src="/logo.png"
          alt="RAGFlow"
          sx={{ width: 120, height: 'auto', flexShrink: 0 }}
        />
      </Box>
      <Divider sx={{ borderColor: theme.palette.divider }} />
      <List sx={{ flex: 1, px: 3, py: 3 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || location.pathname.startsWith(item.path + '/');
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
                mb: 1.75,
                pl: 4,
                borderLeft: isActive ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                backgroundColor: isActive ? `${theme.palette.primary.main}1f` : 'transparent',
                '&:hover': {
                  backgroundColor: isActive
                    ? `${theme.palette.primary.main}26`
                    : `${theme.palette.primary.main}0f`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                <Icon size={20} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>
      <Divider sx={{ borderColor: theme.palette.divider }} />
      <List sx={{ px: 2, py: 1.25 }}>
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.path;
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
                pl: 3,
                borderLeft: isActive ? `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                backgroundColor: isActive ? `${theme.palette.primary.main}1f` : 'transparent',
                '&:hover': {
                  backgroundColor: isActive
                    ? `${theme.palette.primary.main}26`
                    : `${theme.palette.primary.main}0f`,
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 36,
                  color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                }}
              >
                <Icon size={20} />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  color: isActive ? theme.palette.text.primary : theme.palette.text.secondary,
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
          backgroundColor: theme.palette.background.paper,
          borderBottom: `1px solid ${theme.palette.divider}`,
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
          <Typography variant="body1" sx={{ flexGrow: 1, color: theme.palette.text.secondary }}>
            {navItems.find((item) => location.pathname.startsWith(item.path))?.label || 'RAGFlow'}
          </Typography>
          <IconButton onClick={() => dispatch(toggleTheme())} sx={{ mr: 1 }}>
            {themeMode === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
          </IconButton>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.875rem',
                fontWeight: 600,
                cursor: 'pointer',
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
            <MenuItem onClick={() => { setAnchorEl(null); navigate('/admin/profile'); }}>
              <ListItemIcon>
                <IconUserCircle size={18} />
              </ListItemIcon>
              <ListItemText>Profile</ListItemText>
            </MenuItem>
            <Divider sx={{ borderColor: theme.palette.divider }} />
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
          backgroundColor: theme.palette.background.default,
          minHeight: 'calc(100vh - 64px)',
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
};

export default AdminLayout;
