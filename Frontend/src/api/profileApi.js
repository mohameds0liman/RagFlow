import api from './axiosInstance';

export const getUserProfile = () =>
  api.get('/user/profile');

export const updateUserProfile = (payload) =>
  api.put('/user/profile', payload);

export const changeUserPassword = (currentPassword, newPassword) =>
  api.patch('/user/profile/password', { current_password: currentPassword, new_password: newPassword });

export const getAdminProfile = () =>
  api.get('/admin/profile');

export const updateAdminProfile = (payload) =>
  api.put('/admin/profile', payload);

export const changeAdminPassword = (currentPassword, newPassword) =>
  api.patch('/admin/profile/password', { current_password: currentPassword, new_password: newPassword });
