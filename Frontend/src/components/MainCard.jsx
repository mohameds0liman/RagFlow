import { useTheme } from '@mui/material/styles';
import { Card, CardContent, CardHeader, Divider } from '@mui/material';

const MainCard = ({ title, children, sx, ...props }) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        backgroundColor: theme.palette.background.paper,
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: '12px',
        boxShadow: theme.shadows[1],
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
              sx: { fontWeight: 600, fontSize: '1rem', color: theme.palette.text.primary },
            }}
            sx={{ pb: 0 }}
          />
          <Divider sx={{ borderColor: theme.palette.divider, mt: 1.5 }} />
        </>
      )}
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>{children}</CardContent>
    </Card>
  );
};

export default MainCard;
