import api from './axios';

export const getQuickNotes = () => api.get('/telecalling/quick-notes/');
export const getCallLogs = (params) => api.get('/telecalling/logs/', { params });
export const createCallLog = (data) => api.post('/telecalling/logs/', data);
export const exportCallLogs = (params) => api.get('/telecalling/logs/export/', { params, responseType: 'blob' });
export const getTelecallingSmartList = (params) => api.get('/telecalling/smart-lists/', { params });
