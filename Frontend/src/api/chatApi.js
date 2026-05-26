import api from './axiosInstance';

export const adminCreateSession = (chatbotId, title) =>
  api.post(`/admin/chatbots/${chatbotId}/sessions`, { title });

export const adminListSessions = (chatbotId) =>
  api.get(`/admin/chatbots/${chatbotId}/sessions`);

export const adminDeleteSession = (chatbotId, sessionId) =>
  api.delete(`/admin/chatbots/${chatbotId}/sessions/${sessionId}`);

export const adminListMessages = (chatbotId, sessionId) =>
  api.get(`/admin/chatbots/${chatbotId}/sessions/${sessionId}/messages`);

export const adminSendMessage = (chatbotId, sessionId, message) =>
  api.post(`/admin/chatbots/${chatbotId}/sessions/${sessionId}/chat`, { message });

export const userListChatbots = () =>
  api.get('/user/chatbots');

export const userCreateSession = (chatbotId, title) =>
  api.post('/user/sessions', { chatbot_id: chatbotId, title });

export const userListSessions = () =>
  api.get('/user/sessions');

export const userDeleteSession = (sessionId) =>
  api.delete(`/user/sessions/${sessionId}`);

export const userListMessages = (sessionId) =>
  api.get(`/user/sessions/${sessionId}/messages`);

export const userSendMessage = (chatbotId, sessionId, message) =>
  api.post(`/user/chatbots/${chatbotId}/sessions/${sessionId}/chat`, { message });
