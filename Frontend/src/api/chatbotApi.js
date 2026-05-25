import api from './axiosInstance';

export const listChatbots = () =>
  api.get('/admin/chatbots');

export const getChatbot = (id) =>
  api.get(`/admin/chatbots/${id}`);

export const createChatbot = (payload) =>
  api.post('/admin/chatbots', payload);

export const updateChatbot = (id, payload) =>
  api.put(`/admin/chatbots/${id}`, payload);

export const deleteChatbot = (id) =>
  api.delete(`/admin/chatbots/${id}`);
