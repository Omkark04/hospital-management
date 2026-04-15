import api from './axios';

export const submitReferral = (data) => api.post('/referrals/', data);
export const getReferrals = (params) => api.get('/referrals/list/', { params });
export const updateReferralStatus = (id, data) => api.patch(`/referrals/${id}/status/`, data);
