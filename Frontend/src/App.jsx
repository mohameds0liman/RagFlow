import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminRoutes from './routes/AdminRoutes';
import UserRoutes from './routes/UserRoutes';
import AdminLayout from './layouts/AdminLayout';
import UserLayout from './layouts/UserLayout';

import Login from './views/auth/Login';
import ForgotPassword from './views/auth/ForgotPassword';

import Dashboard from './views/admin/Dashboard';
import DocumentStoreList from './views/admin/DocumentStores/DocumentStoreList';
import DocumentStoreDetail from './views/admin/DocumentStores/DocumentStoreDetail';
import ChatbotList from './views/admin/Chatbots/ChatbotList';
import ChatbotEditor from './views/admin/Chatbots/ChatbotEditor';
import AdminChat from './views/admin/Chat/AdminChat';
import UserList from './views/admin/Users/UserList';
import UserChat from './views/user/UserChat';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
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
        <Route path="chatbots/:id" element={<ChatbotEditor />} />
        <Route path="chat" element={<AdminChat />} />
        <Route path="users" element={<UserList />} />
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
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
