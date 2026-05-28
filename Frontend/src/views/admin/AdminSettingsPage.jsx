import { Box, Typography, useTheme } from '@mui/material';
import MainCard from '../../components/MainCard';

const AdminSettingsPage = () => {
  const theme = useTheme();

  const sections = [
    { title: 'General Settings', description: 'Configure application-wide settings like site name, logo, and default language.' },
    { title: 'Security', description: 'Manage authentication policies, session timeouts, and password requirements.' },
    { title: 'AI Providers', description: 'Configure default AI provider settings, API keys, and model preferences.' },
    { title: 'Notifications', description: 'Set up email notifications, alerts, and webhook integrations.' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>
        Settings
      </Typography>
      {sections.map((section) => (
        <MainCard key={section.title} title={section.title} sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
              {section.description}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: theme.palette.warning.main,
                fontWeight: 600,
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                bgcolor: `${theme.palette.warning.main}15`,
              }}
            >
              Coming Soon
            </Typography>
          </Box>
        </MainCard>
      ))}
    </Box>
  );
};

export default AdminSettingsPage;
