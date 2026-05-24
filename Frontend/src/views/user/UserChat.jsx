import { Typography, Box, useTheme } from '@mui/material';
import { IconMessage } from '@tabler/icons-react';

const UserChat = () => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: 'calc(100vh - 64px)',
        color: theme.palette.text.secondary,
        gap: 2,
        p: 4,
      }}
    >
      <IconMessage size={64} stroke={1.5} />
      <Typography variant="h5" sx={{ color: theme.palette.text.primary, fontWeight: 600 }}>
        RAGFlow Chat
      </Typography>
      <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
        Select a chatbot from the list to start chatting
      </Typography>
    </Box>
  );
};

export default UserChat;
