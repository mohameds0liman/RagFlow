import api from './axiosInstance';

export const listUsers = (skip = 0, limit = 50) =>
  api.get('/admin/users', { params: { skip, limit } });

export const getUser = (userId) =>
  api.get(`/admin/users/${userId}`);

export const deleteUser = (userId) =>
  api.delete(`/admin/users/${userId}`);

export const updateUserAccess = (userId, granted) =>
  api.patch(`/admin/users/${userId}/access`, { granted });

export const updateUserFeatures = (userId, features) =>
  api.patch(`/admin/users/${userId}/features`, features);

export const updateUserRole = (userId, role) =>
  api.patch(`/admin/users/${userId}/role`, { role });

export const listChatbotAccess = (userId) =>
  api.get(`/admin/users/${userId}/chatbot-access`);

export const grantChatbotAccess = (userId, chatbotId) =>
  api.post(`/admin/users/${userId}/chatbot-access`, { chatbot_id: chatbotId });

export const revokeChatbotAccess = (userId, chatbotId) =>
  api.delete(`/admin/users/${userId}/chatbot-access/${chatbotId}`);
