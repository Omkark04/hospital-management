import api from './axios';

export const getBranches = (params) => api.get('/branches/', { params });
export const getBranch = (id) => api.get(`/branches/${id}/`);
export const createBranch = (data) => api.post('/branches/', data);
export const updateBranch = (id, data) => api.put(`/branches/${id}/`, data);
export const getPublicBranches = () => api.get('/branches/public/');

export const getHospitals = () => api.get('/branches/hospitals/');
export const createHospital = (data) => api.post('/branches/hospitals/', data);
export const updateHospital = (id, data) => api.put(`/branches/hospitals/${id}/`, data);

export const getBranchServices = (branchId) => api.get(`/branches/${branchId}/services/`);
export const createBranchService = (branchId, data) => api.post(`/branches/${branchId}/services/`, data);
export const updateBranchService = (id, data) => api.put(`/branches/services/${id}/`, data);
