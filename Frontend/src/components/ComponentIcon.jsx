import { useState } from 'react';
import { Box } from '@mui/material';

const ComponentIcon = ({ category, name, size = 20 }) => {
  const [error, setError] = useState(false);
  const baseUrl = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
  const iconUrl = `${baseUrl}/admin/components/${category}/${name}/icon`;

  if (error) {
    return (
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '4px',
          bgcolor: 'primary.main',
          color: '#fff',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: size * 0.5,
          fontWeight: 700,
          flexShrink: 0,
          lineHeight: 1,
        }}
      >
        {name.charAt(0).toUpperCase()}
      </Box>
    );
  }

  return (
    <Box
      component="img"
      src={iconUrl}
      alt={name}
      onError={() => setError(true)}
      sx={{
        width: size,
        height: size,
        borderRadius: '4px',
        objectFit: 'contain',
        flexShrink: 0,
      }}
    />
  );
};

export default ComponentIcon;
