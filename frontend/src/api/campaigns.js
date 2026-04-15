import api from './axios';

export const getCampaigns = () => api.get('/campaigns/');
export const getCampaign = (id) => api.get(`/campaigns/${id}/`);
export const createCampaign = (data) => api.post('/campaigns/', data);
export const updateCampaign = (id, data) => api.put(`/campaigns/${id}/`, data);
export const getMyCampaigns = () => api.get('/campaigns/my-campaigns/');
export const assignCampaignManager = (data) => api.post('/campaigns/assign-manager/', data);

export const getCampaignPatients = (campaignId) => api.get(`/campaigns/${campaignId}/patients/`);
export const addCampaignPatient = (campaignId, data) => api.post(`/campaigns/${campaignId}/patients/`, data);
export const getCampaignAttendance = (campaignId) => api.get(`/campaigns/${campaignId}/attendance/`);
export const markCampaignAttendance = (campaignId, data) => api.post(`/campaigns/${campaignId}/attendance/`, data);
export const getCampaignSales = (campaignId) => api.get(`/campaigns/${campaignId}/sales/`);
export const addCampaignSale = (campaignId, data) => api.post(`/campaigns/${campaignId}/sales/`, data);
