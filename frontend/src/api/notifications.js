import api from './axios';

export const getMyNotifications = (params) => api.get('/notifications/mine/', { params });
export const getAllNotifications = (params) => api.get('/notifications/all/', { params });
export const sendNotification = (data) => api.post('/notifications/send/', data);
