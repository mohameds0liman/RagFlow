import api from './axiosInstance';

export const loginApi = (email, password) =>
  api.post('/auth/login', { email, password });

export const registerApi = (username, email, password) =>
  api.post('/auth/register', { username, email, password });

export const logoutApi = () =>
  api.post('/auth/logout');

export const forgotPasswordApi = (email) =>
  api.post('/auth/forgot-password', { email });

export const resetPasswordApi = (token, password) =>
  api.post('/auth/reset-password', { token, password });
