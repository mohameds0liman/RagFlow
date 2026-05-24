import { Typography, Box } from '@mui/material';
import { IconMessage } from '@tabler/icons-react';

const UserChat = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: 'calc(100vh - 64px)',
      color: '#9099B0',
      gap: 2,
    }}
  >
    <IconMessage size={48} />
    <Typography variant="h6" sx={{ color: '#9099B0' }}>
      Select a chatbot to start chatting
    </Typography>
  </Box>
);

export default UserChat;
