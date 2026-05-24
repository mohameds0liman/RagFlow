import { Card, CardContent, CardHeader, Divider } from '@mui/material';

const MainCard = ({ title, children, sx, ...props }) => (
  <Card
    sx={{
      backgroundColor: '#1E2330',
      border: '1px solid #2D3448',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      ...sx,
    }}
    {...props}
  >
    {title && (
      <>
        <CardHeader
          title={title}
          titleTypographyProps={{
            variant: 'h6',
            sx: { fontWeight: 600, fontSize: '1rem', color: '#E0E0E0' },
          }}
          sx={{ pb: 0 }}
        />
        <Divider sx={{ borderColor: '#2D3448', mt: 1.5 }} />
      </>
    )}
    <CardContent sx={{ '&:last-child': { pb: 2 } }}>{children}</CardContent>
  </Card>
);

export default MainCard;
