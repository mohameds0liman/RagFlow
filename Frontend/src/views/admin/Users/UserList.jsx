import { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import {
  Box,
  TextField,
  MenuItem,
  IconButton,
  Menu,
  MenuItem as MenuItemMui,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  useTheme,
} from '@mui/material';
import {
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconFilter,
} from '@tabler/icons-react';
import MainCard from '../../../components/MainCard';
import StyledDataGrid from '../../../components/StyledDataGrid';
import StatusChip from '../../../components/StatusChip';
import ConfirmDialog from '../../../components/ConfirmDialog';
import UserAccessDrawer from './UserAccessDrawer';
import {
  fetchUsers,
  deleteUser,
  clearError,
} from '../../../store/slices/usersSlice';

const roleOptions = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const UserList = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  const { list, loading, saving } = useSelector((state) => state.users);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuUser, setMenuUser] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteUserData, setDeleteUserData] = useState(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerUser, setDrawerUser] = useState(null);

  useEffect(() => {
    dispatch(fetchUsers());
  }, [dispatch]);

  const filteredList = useMemo(() => {
    return list.filter((user) => {
      const matchSearch =
        !search ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.username.toLowerCase().includes(search.toLowerCase());
      const matchRole = !roleFilter || user.role === roleFilter;
      const matchStatus =
        !statusFilter ||
        (statusFilter === 'active' ? user.is_active : !user.is_active);
      return matchSearch && matchRole && matchStatus;
    });
  }, [list, search, roleFilter, statusFilter]);

  const handleMenuOpen = (e, user) => {
    setMenuAnchor(e.currentTarget);
    setMenuUser(user);
  };

  const handleOpenDrawer = (user) => {
    setDrawerUser(user);
    setDrawerOpen(true);
  };

  const handleDeleteClick = (user) => {
    setDeleteUserData(user);
    setDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteUserData) return;
    try {
      await dispatch(deleteUser(deleteUserData.id)).unwrap();
      enqueueSnackbar('User deleted', { variant: 'success' });
    } catch (err) {
      enqueueSnackbar(err || 'Failed to delete user', { variant: 'error' });
    } finally {
      setDeleteOpen(false);
      setDeleteUserData(null);
    }
  };

  const columns = useMemo(() => [
    {
      field: 'username',
      headerName: 'Username',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.5,
      minWidth: 200,
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 100,
      renderCell: (params) => (
        <StatusChip
          status={params.value === 'admin' ? 'Active' : 'Pending'}
          label={params.value}
        />
      ),
    },
    {
      field: 'is_active',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => (
        <StatusChip status={params.value ? 'active' : 'inactive'} />
      ),
    },
    {
      field: 'is_verified',
      headerName: 'Verified',
      width: 100,
      renderCell: (params) => (
        <StatusChip status={params.value ? 'Active' : 'Pending'} />
      ),
    },
    {
      field: 'daily_message_limit',
      headerName: 'Daily Limit',
      width: 120,
      type: 'number',
    },
    {
      field: 'messages_used_today',
      headerName: 'Used Today',
      width: 110,
      type: 'number',
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          size="small"
          onClick={(e) => handleMenuOpen(e, params.row)}
          sx={{ color: theme.palette.text.secondary }}
        >
          <IconDots size={20} />
        </IconButton>
      ),
    },
  ], [theme]);

  return (
    <MainCard title="Users">
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <TextField
          size="small"
          placeholder="Search by email or username..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <IconSearch size={18} style={{ marginRight: 8, color: theme.palette.text.secondary }} />,
          }}
          sx={{ minWidth: 280 }}
        />
        <TextField
          select
          size="small"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          sx={{ minWidth: 130 }}
        >
          {roleOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 130 }}
        >
          {statusOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </TextField>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <StyledDataGrid
          rows={filteredList}
          columns={columns}
          getRowId={(row) => row.id}
          pageSizeOptions={[10, 25, 50]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } },
          }}
          localeText={{
            noRowsLabel: 'No users found',
          }}
        />
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItemMui onClick={() => { setMenuAnchor(null); handleOpenDrawer(menuUser); }}>
          <ListItemIcon><IconEdit size={18} /></ListItemIcon>
          <ListItemText>Manage Access</ListItemText>
        </MenuItemMui>
        <MenuItemMui onClick={() => { setMenuAnchor(null); handleDeleteClick(menuUser); }}>
          <ListItemIcon><IconTrash size={18} color={theme.palette.error.main} /></ListItemIcon>
          <ListItemText sx={{ color: theme.palette.error.main }}>Delete</ListItemText>
        </MenuItemMui>
      </Menu>

      {drawerOpen && drawerUser && (
        <UserAccessDrawer
          open={drawerOpen}
          onClose={() => { setDrawerOpen(false); setDrawerUser(null); }}
          user={drawerUser}
        />
      )}

      <ConfirmDialog
        open={deleteOpen}
        title="Delete User"
        message={`Are you sure you want to delete "${deleteUserData?.username}" (${deleteUserData?.email})? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => { setDeleteOpen(false); setDeleteUserData(null); }}
        loading={saving}
      />
    </MainCard>
  );
};

export default UserList;
