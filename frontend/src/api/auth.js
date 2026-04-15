import api from './axios';

export const login = (username, password) =>
  api.post('/auth/login/', { username, password });

export const logout = (refresh) =>
  api.post('/auth/logout/', { refresh });

export const getProfile = () => api.get('/auth/profile/');
export const updateProfile = (data) => api.put('/auth/profile/', data);
export const changePassword = (data) => api.post('/auth/change-password/', data);

export const getStaff = (params) => api.get('/auth/staff/', { params });
export const createStaff = (data) => api.post('/auth/staff/', data);
export const updateStaff = (id, data) => api.put(`/auth/staff/${id}/`, data);
export const deleteStaff = (id) => api.delete(`/auth/staff/${id}/`);
