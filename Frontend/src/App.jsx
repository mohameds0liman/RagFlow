import { useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import AdminRoutes from './routes/AdminRoutes';
import UserRoutes from './routes/UserRoutes';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';
import getTheme from './theme';

import Login from './views/auth/Login';
import Register from './views/auth/Register';
import ForgotPassword from './views/auth/ForgotPassword';

import Dashboard from './views/admin/Dashboard';
import DocumentStoreList from './views/admin/DocumentStores/DocumentStoreList';
import DocumentStoreDetail from './views/admin/DocumentStores/DocumentStoreDetail';
import ChatbotList from './views/admin/Chatbots/ChatbotList';
import AdminChat from './views/admin/Chat/AdminChat';
import UserList from './views/admin/Users/UserList';
import AdminProfilePage from './views/admin/AdminProfilePage';
import AdminSettingsPage from './views/admin/AdminSettingsPage';
import UserChat from './views/user/UserChat';
import UserProfilePage from './views/user/UserProfilePage';

function App() {
  const mode = useSelector((state) => state.theme.mode);
  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route
          path="/admin"
          element={
            <AdminRoutes>
              <AdminLayout />
            </AdminRoutes>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="document-stores" element={<DocumentStoreList />} />
          <Route path="document-stores/:id" element={<DocumentStoreDetail />} />
          <Route path="chatbots" element={<ChatbotList />} />
          <Route path="chatbots/:id" element={<Navigate to="/admin/chatbots" replace />} />
          <Route path="chat" element={<AdminChat />} />
          <Route path="users" element={<UserList />} />
          <Route path="profile" element={<AdminProfilePage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>

        <Route
          path="/chat"
          element={
            <UserRoutes>
              <UserLayout />
            </UserRoutes>
          }
        >
          <Route index element={<UserChat />} />
          <Route path="profile" element={<UserProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
