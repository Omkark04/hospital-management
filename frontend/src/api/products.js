import api from './axios';

export const getPublicProducts = (params) => api.get('/products/public/', { params });
export const getPublicProduct = (id) => api.get(`/products/public/${id}/`);
export const submitEnquiry = (data) => api.post('/products/enquiry/', data);

export const getProducts = (params) => api.get('/products/', { params });
export const createProduct = (data) => api.post('/products/', data);
export const updateProduct = (id, data) => api.put(`/products/${id}/`, data);
export const deleteProduct = (id) => api.delete(`/products/${id}/`);

export const getEnquiries = (params) => api.get('/products/enquiries/', { params });
export const updateEnquiryStatus = (id, status) => api.patch(`/products/enquiries/${id}/status/`, { status });
