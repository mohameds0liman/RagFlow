import { useState, useRef, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Avatar,
  useTheme,
} from '@mui/material';
import { IconSend, IconUser, IconRobot } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';

const ChatWindow = ({
  messages = [],
  onSend,
  loading = false,
  disabled = false,
  placeholder = 'Type your message...',
  error = null,
}) => {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = () => {
    if (!input.trim() || loading || disabled) return;
    onSend(input.trim());
    setInput('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: theme.palette.background.default,
      }}
    >
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1.5,
        }}
      >
        {messages.length === 0 && !loading && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
            }}
          >
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              No messages yet. Start a conversation!
            </Typography>
          </Box>
        )}
        {messages.map((msg) => {
          const isUser = msg.role === 'human';
          return (
            <Box
              key={msg.id}
              sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: 1,
              }}
            >
              {!isUser && (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: theme.palette.primary.main,
                  }}
                >
                  <IconRobot size={18} />
                </Avatar>
              )}
              <Box
                sx={{
                  maxWidth: '70%',
                  p: 1.5,
                  borderRadius: '12px',
                  bgcolor: isUser
                    ? theme.palette.primary.main
                    : theme.palette.background.paper,
                  color: isUser ? '#fff' : theme.palette.text.primary,
                  border: isUser
                    ? 'none'
                    : `1px solid ${theme.palette.divider}`,
                  '& pre': {
                    overflow: 'auto',
                    bgcolor: 'rgba(0,0,0,0.2)',
                    p: 1,
                    borderRadius: 1,
                  },
                  '& code': { fontSize: '0.85em' },
                }}
              >
                {isUser ? (
                  <Typography variant="body2">{msg.content}</Typography>
                ) : (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                )}
              </Box>
              {isUser && (
                <Avatar
                  sx={{
                    width: 32,
                    height: 32,
                    bgcolor: theme.palette.secondary.main,
                  }}
                >
                  <IconUser size={18} />
                </Avatar>
              )}
            </Box>
          );
        })}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              gap: 1,
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: theme.palette.primary.main,
              }}
            >
              <IconRobot size={18} />
            </Avatar>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: '12px',
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
              <Typography
                variant="body2"
                sx={{ color: theme.palette.text.secondary }}
              >
                Thinking...
              </Typography>
              <CircularProgress size={14} sx={{ color: theme.palette.primary.main }} />
            </Box>
          </Box>
        )}
        {error && (
          <Typography
            variant="caption"
            sx={{ color: theme.palette.error.main, textAlign: 'center', py: 1 }}
          >
            {error}
          </Typography>
        )}
        <div ref={bottomRef} />
      </Box>
      <Box
        sx={{
          p: 2,
          borderTop: `1px solid ${theme.palette.divider}`,
          bgcolor: theme.palette.background.paper,
        }}
      >
        <TextField
          fullWidth
          size="small"
          multiline
          maxRows={4}
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: theme.palette.background.default,
            },
          }}
          slotProps={{
            input: {
              endAdornment: (
                <IconButton
                  onClick={handleSend}
                  disabled={!input.trim() || loading || disabled}
                  sx={{ color: theme.palette.primary.main }}
                >
                  {loading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <IconSend size={20} />
                  )}
                </IconButton>
              ),
            },
          }}
        />
      </Box>
    </Box>
  );
};

export default ChatWindow;
