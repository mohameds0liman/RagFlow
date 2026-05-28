import { Box, Chip, useTheme } from '@mui/material';

const ChatbotSwitcher = ({ chatbots = [], activeChatbotId, onSwitch }) => {
  const theme = useTheme();

  if (chatbots.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', gap: 1, overflow: 'auto', px: 1 }}>
      {chatbots.map((bot) => {
        const isActive = bot.id === activeChatbotId;
        return (
          <Chip
            key={bot.id}
            label={bot.name}
            onClick={() => onSwitch(bot)}
            size="small"
            sx={{
              fontWeight: 600,
              fontSize: '0.8125rem',
              px: 1,
              bgcolor: isActive ? theme.palette.primary.main : 'transparent',
              color: isActive ? '#fff' : theme.palette.text.secondary,
              border: isActive
                ? `1px solid ${theme.palette.primary.main}`
                : `1px solid ${theme.palette.divider}`,
              '&:hover': {
                bgcolor: isActive ? theme.palette.primary.main : `${theme.palette.primary.main}14`,
              },
            }}
          />
        );
      })}
    </Box>
  );
};

export default ChatbotSwitcher;
