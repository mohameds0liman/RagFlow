import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Chip,
  useTheme,
} from '@mui/material';
import {
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconMessage,
  IconRobot,
  IconDatabase,
  IconMessages,
} from '@tabler/icons-react';
import MainCard from '../../../components/MainCard';
import StatusChip from '../../../components/StatusChip';
import ConfirmDialog from '../../../components/ConfirmDialog';
import ChatbotSettingsDialog from './ChatbotSettingsDialog';
import {
  fetchChatbots,
  deleteChatbot,
} from '../../../store/slices/chatbotSlice';

import { fetchKnowledgeBases } from '../../../store/slices/kbSlice';

const ChatbotList = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, loading, saving } = useSelector((state) => state.chatbots);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [editBot, setEditBot] = useState(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedBot, setSelectedBot] = useState(null);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuBot, setMenuBot] = useState(null);

  useEffect(() => {
    dispatch(fetchChatbots());
    dispatch(fetchKnowledgeBases());
  }, [dispatch]);

  const handleDelete = async () => {
    try {
      await dispatch(deleteChatbot(selectedBot.id)).unwrap();
      setDeleteOpen(false);
    } catch { /* error handled by slice */ }
  };

  const handleMenuOpen = (e, bot) => {
    setMenuAnchor(e.currentTarget);
    setMenuBot(bot);
  };

  const handleOpenSettings = (bot = null) => {
    setEditBot(bot);
    setSettingsOpen(true);
  };

  return (
    <MainCard title="Chatbots">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<IconPlus size={18} />}
          onClick={() => handleOpenSettings()}
        >
          Add Chatbot
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : list.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <IconRobot size={48} style={{ color: theme.palette.text.disabled }} />
          <Typography variant="h6" sx={{ mt: 2, color: theme.palette.text.secondary }}>
            No chatbots yet
          </Typography>
          <Typography variant="body2" sx={{ color: theme.palette.text.disabled, mb: 3 }}>
            Create your first chatbot to get started
          </Typography>
          <Button
            variant="contained"
            startIcon={<IconPlus size={18} />}
            onClick={() => handleOpenSettings()}
          >
            Add Chatbot
          </Button>
        </Box>
      ) : (
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3 }}>
          {list.map((bot) => (
            <Card
              key={bot.id}
              sx={{
                backgroundColor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                borderRadius: '12px',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                aspectRatio: '5 / 2',
              }}
            >
              <CardContent sx={{ pb: 1, flex: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      variant="h6"
                      noWrap
                      sx={{ fontWeight: 700, color: theme.palette.text.primary, fontSize: '1.3rem', mb: 0.5 }}
                    >
                      {bot.name}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 0.5 }}>
                      <StatusChip status={bot.status} />
                    </Box>
                    {bot.document_store_name && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <IconDatabase size={14} style={{ color: theme.palette.text.secondary }} />
                        <Typography
                          variant="caption"
                          noWrap
                          sx={{ color: theme.palette.text.secondary, fontSize: '0.75rem' }}
                        >
                          {bot.document_store_name}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuOpen(e, bot);
                    }}
                    sx={{ ml: 1, color: theme.palette.text.secondary, flexShrink: 0 }}
                  >
                    <IconDots size={24} />
                  </IconButton>
                </Box>
              </CardContent>
              <CardActions sx={{ pt: 0, px: 2, pb: 1.5 }}>
                <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <IconMessages size={20} style={{ color: theme.palette.text.disabled }} />
                    <Typography variant="body2" sx={{ color: theme.palette.text.disabled, fontSize: '0.9rem' }}>
                      {bot.sessions_count ?? 0}
                    </Typography>
                  </Box>
                  {bot.llm_config?.name && (
                    <Chip
                      icon={<IconRobot size={14} />}
                      label={bot.llm_config.name}
                      size="small"
                      variant="outlined"
                      sx={{ color: theme.palette.primary.main, borderColor: theme.palette.primary.main, fontSize: '0.7rem', height: 22 }}
                    />
                  )}
                </Box>
              </CardActions>
            </Card>
          ))}
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => setMenuAnchor(null)}
      >
        <MenuItem onClick={() => { setMenuAnchor(null); handleOpenSettings(menuBot); }}>
          <ListItemIcon><IconEdit size={18} /></ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); navigate('/admin/chat'); }}>
          <ListItemIcon><IconMessage size={18} /></ListItemIcon>
          <ListItemText>Open Chat</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setMenuAnchor(null); setSelectedBot(menuBot); setDeleteOpen(true); }}>
          <ListItemIcon><IconTrash size={18} color={theme.palette.error.main} /></ListItemIcon>
          <ListItemText sx={{ color: theme.palette.error.main }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

      <ChatbotSettingsDialog
        open={settingsOpen}
        onClose={() => { setSettingsOpen(false); setEditBot(null); }}
        existingBot={editBot}
      />

      <ConfirmDialog
        open={deleteOpen}
        title="Delete Chatbot"
        message={`Are you sure you want to delete "${selectedBot?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
        loading={saving}
      />
    </MainCard>
  );
};

export default ChatbotList;
