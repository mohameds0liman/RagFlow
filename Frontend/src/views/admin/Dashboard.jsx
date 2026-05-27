import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Box, Card, CardContent, Typography, CircularProgress, useTheme } from '@mui/material';
import {
  IconDatabase,
  IconFileDescription,
  IconFileImport,
  IconNumbers,
  IconRobot,
  IconMessages,
} from '@tabler/icons-react';
import MainCard from '../../components/MainCard';
import StyledDataGrid from '../../components/StyledDataGrid';
import StatusChip from '../../components/StatusChip';
import { fetchDashboardStats, fetchKnowledgeBases } from '../../store/slices/kbSlice';
import { fetchChatbots } from '../../store/slices/chatbotSlice';

const STAT_CARDS = [
  { key: 'knowledge_bases', label: 'Knowledge Bases', icon: IconDatabase, color: '#4B72FF' },
  { key: 'documents', label: 'Documents', icon: IconFileDescription, color: '#27AE60' },
  { key: 'loaders', label: 'Loaders', icon: IconFileImport, color: '#F39C12' },
  { key: 'chunks', label: 'Chunks', icon: IconNumbers, color: '#E74C3C' },
  { key: 'chatbots', label: 'Chatbots', icon: IconRobot, color: '#9B59B6' },
];

const Dashboard = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { dashboardStats, dashboardLoading } = useSelector((state) => state.knowledgeBases);
  const chatbotList = useSelector((state) => state.chatbots.list);
  const chatbotLoading = useSelector((state) => state.chatbots.loading);

  useEffect(() => {
    dispatch(fetchDashboardStats());
    dispatch(fetchKnowledgeBases());
    dispatch(fetchChatbots());
  }, [dispatch]);

  const recentChatbots = (chatbotList || []).slice(0, 5);

  const columns = [
    { field: 'name', headerName: 'Name', flex: 1, minWidth: 150 },
    {
      field: 'document_store_name',
      headerName: 'Knowledge Base',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      renderCell: (params) => <StatusChip status={params.value} />,
    },
    {
      field: 'sessions_count',
      headerName: 'Sessions',
      width: 100,
      type: 'number',
      valueFormatter: (params) => params.value ?? 0,
    },
    {
      field: 'created_date',
      headerName: 'Created',
      width: 180,
      valueFormatter: (params) => {
        if (!params.value) return '';
        return new Date(params.value).toLocaleDateString();
      },
    },
  ];

  return (
    <MainCard title="Dashboard">
      {dashboardLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2 }}>
            {STAT_CARDS.map(({ key, label, icon: Icon, color }) => (
              <Card
                key={key}
                sx={{
                  backgroundColor: theme.palette.background.paper,
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: '12px',
                }}
              >
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${color}1a`,
                      }}
                    >
                      <Icon size={22} style={{ color }} />
                    </Box>
                  </Box>
                  <Typography
                    variant="h4"
                    sx={{ fontWeight: 700, color: theme.palette.text.primary, mb: 0.25 }}
                  >
                    {dashboardStats?.[key] ?? 0}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    {label}
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>

          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 2 }}>
              Recent Chatbots
            </Typography>
            {chatbotLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} />
              </Box>
            ) : recentChatbots.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <IconMessages size={40} style={{ color: theme.palette.text.disabled }} />
                <Typography variant="body2" sx={{ mt: 1, color: theme.palette.text.secondary }}>
                  No chatbots created yet
                </Typography>
              </Box>
            ) : (
              <StyledDataGrid
                rows={recentChatbots}
                columns={columns}
                getRowId={(row) => row.id}
                pageSizeOptions={[5]}
                hideFooterPagination
                disableRowSelectionOnClick
                autoHeight
                localeText={{ noRowsLabel: 'No chatbots' }}
              />
            )}
          </Box>
        </Box>
      )}
    </MainCard>
  );
};

export default Dashboard;