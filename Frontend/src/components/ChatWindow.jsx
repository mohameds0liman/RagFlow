import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Avatar,
  Tooltip,
  useTheme,
} from '@mui/material';
import { IconSend, IconRobot } from '@tabler/icons-react';
import ReactMarkdown from 'react-markdown';

const ChatWindow = ({
  messages = [],
  onSend,
  loading = false,
  disabled = false,
  placeholder = 'Type your message...',
  error = null,
  chatbotName = 'AI',
  userName = 'You',
  chatbotColor = '#4B72FF',
}) => {
  const theme = useTheme();
  const [input, setInput] = useState('');
  const [hoveredMsgId, setHoveredMsgId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = useCallback(() => {
    if (!input.trim() || loading || disabled) return;
    onSend(input.trim());
    setInput('');
  }, [input, loading, disabled, onSend]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const getFormattedTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      {/* Messages area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          px: { xs: 2, md: 4 },
          py: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 1,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': {
            bgcolor: theme.palette.divider,
            borderRadius: 3,
          },
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
            <Box sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: chatbotColor,
                  mx: 'auto',
                  mb: 1.5,
                }}
              >
                <IconRobot size={24} />
              </Avatar>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: theme.palette.text.primary }}
              >
                {chatbotName}
              </Typography>
            </Box>
          </Box>
        )}
        {messages.map((msg) => {
          const isUser = msg.role === 'human';
          const time = getFormattedTime(msg.created_date);
          return (
            <Box
              key={msg.id}
              id={`msg-${msg.id}`}
              sx={{
                display: 'flex',
                justifyContent: isUser ? 'flex-end' : 'flex-start',
                gap: 1.5,
                maxWidth: '100%',
              }}
              onMouseEnter={() => setHoveredMsgId(msg.id)}
              onMouseLeave={() => setHoveredMsgId(null)}
            >
              {!isUser && (
                <Tooltip title={chatbotName} placement="left">
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: chatbotColor,
                      flexShrink: 0,
                    }}
                  >
                    <IconRobot size={18} />
                  </Avatar>
                </Tooltip>
              )}
              <Box sx={{ maxWidth: '70%', position: 'relative' }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
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
                    '& p': { m: 0 },
                  }}
                >
                  {isUser ? (
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                      {msg.content}
                    </Typography>
                  ) : (
                    <Box sx={{ '& p': { m: 0 } }}>
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </Box>
                  )}
                </Box>
                {hoveredMsgId === msg.id && (
                  <Typography
                    variant="caption"
                    sx={{
                      color: theme.palette.text.disabled,
                      position: 'absolute',
                      bottom: -18,
                      ...(isUser ? { right: 0 } : { left: 0 }),
                      fontSize: '0.65rem',
                    }}
                  >
                    {time}
                  </Typography>
                )}
              </Box>
              {isUser && (
                <Tooltip title={userName} placement="right">
                  <Avatar
                    sx={{
                      width: 32,
                      height: 32,
                      bgcolor: theme.palette.primary.main,
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    U
                  </Avatar>
                </Tooltip>
              )}
            </Box>
          );
        })}
        {loading && (
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start',
              gap: 1.5,
            }}
          >
            <Avatar
              sx={{
                width: 32,
                height: 32,
                bgcolor: chatbotColor,
              }}
            >
              <IconRobot size={18} />
            </Avatar>
            <Box
              sx={{
                px: 2,
                py: 1.5,
                borderRadius: '18px 18px 18px 4px',
                bgcolor: theme.palette.background.paper,
                border: `1px solid ${theme.palette.divider}`,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
              }}
            >
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

      {/* Input bar - floating card */}
      <Box
        sx={{
          px: { xs: 2, md: 4 },
          py: 1.25,
          mt: -0.5,
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: 1,
            bgcolor: theme.palette.background.paper,
            borderRadius: '16px',
            p: 0.5,
            pl: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
            transition: 'box-shadow 0.2s',
            '&:focus-within': {
              boxShadow: '0 4px 24px rgba(75,114,255,0.2)',
            },
          }}
        >
          <TextField
            fullWidth
            multiline
            minRows={1}
            maxRows={3}
            placeholder={disabled ? 'Daily limit reached' : placeholder}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            variant="standard"
            InputProps={{ disableUnderline: true }}
            sx={{
              '& .MuiInputBase-root': {
                fontSize: '0.875rem',
                py: 1.125,
                lineHeight: 1.3,
              },
              '& .MuiInputBase-root:before': { borderBottom: 'none !important' },
              '& .MuiInputBase-root:after': { borderBottom: 'none !important' },
              '& .MuiInputBase-root:hover:not(.Mui-disabled):before': { borderBottom: 'none !important' },
              '& .MuiInputBase-input': {
                '&::placeholder': {
                  color: disabled ? theme.palette.error.main : theme.palette.text.disabled,
                  opacity: 1,
                  display: 'flex',
                  alignItems: 'center',
                },
              },
            }}
          />
          <IconButton
            onClick={handleSend}
            disabled={!input.trim() || loading || disabled}
            sx={{
              color: theme.palette.primary.main,
              bgcolor: !input.trim() || loading || disabled
                ? 'transparent'
                : `${theme.palette.primary.main}15`,
              borderRadius: '12px',
              width: 36,
              height: 36,
              '&:hover': {
                bgcolor: `${theme.palette.primary.main}25`,
              },
            }}
          >
            {loading ? (
              <CircularProgress size={18} />
            ) : (
              <IconSend size={18} />
            )}
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatWindow;
