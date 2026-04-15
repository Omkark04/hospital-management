import api from './axios';

export const getMedicines = (params) => api.get('/medicines/', { params });
export const getMedicine = (id) => api.get(`/medicines/${id}/`);
export const createMedicine = (data) => api.post('/medicines/', data);
export const updateMedicine = (id, data) => api.put(`/medicines/${id}/`, data);
export const deleteMedicine = (id) => api.delete(`/medicines/${id}/`);

export const getPrescriptions = (params) => api.get('/medicines/prescriptions/', { params });
export const getPrescription = (id) => api.get(`/medicines/prescriptions/${id}/`);
export const createPrescription = (data) => api.post('/medicines/prescriptions/', data);
export const updatePrescription = (id, data) => api.put(`/medicines/prescriptions/${id}/`, data);
