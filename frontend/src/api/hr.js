import api from './axios';

export const getEmployees = (params) => api.get('/hr/employees/', { params });
export const getEmployee = (id) => api.get(`/hr/employees/${id}/`);
export const createEmployee = (data) => api.post('/hr/employees/', data);
export const updateEmployee = (id, data) => api.put(`/hr/employees/${id}/`, data);
export const getMyEmployeeProfile = () => api.get('/hr/employees/me/');

export const getAttendance = (params) => api.get('/hr/attendance/', { params });
export const markAttendance = (data) => api.post('/hr/attendance/', data);
export const updateAttendance = (id, data) => api.put(`/hr/attendance/${id}/`, data);
export const getMyAttendance = () => api.get('/hr/attendance/me/');

export const getLeaves = (params) => api.get('/hr/leaves/', { params });
export const applyLeave = (data) => api.post('/hr/leaves/', data);
export const reviewLeave = (id, data) => api.patch(`/hr/leaves/${id}/review/`, data);
