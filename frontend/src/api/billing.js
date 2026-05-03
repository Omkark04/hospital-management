import api from './axios';

export const getBills = (params) => api.get('/billing/', { params });
export const getBill = (id) => api.get(`/billing/${id}/`);
export const createBill = (data) => api.post('/billing/', data);
export const updateBill = (id, data) => api.put(`/billing/${id}/`, data);
export const updatePayment = (id, data) => api.patch(`/billing/${id}/pay/`, data);
export const getMyBills = () => api.get('/billing/my-bills/');
export const getBillPDF = (id, refresh = false) => api.get(`/billing/${id}/pdf/`, { params: { refresh } });
