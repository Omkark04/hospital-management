import api from './axios';

export const getPatients = (params) => api.get('/patients/', { params });
export const getPatient = (id) => api.get(`/patients/${id}/`);
export const createPatient = (data) => api.post('/patients/', data);
export const updatePatient = (id, data) => api.put(`/patients/${id}/`, data);
export const deletePatient = (id) => api.delete(`/patients/${id}/`);
export const getMyProfile = () => api.get('/patients/me/');

export const exportPatients = (params) => api.get('/patients/export/', { params, responseType: 'blob' });
export const importPatients = (formData) => api.post('/patients/import/', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});

export const getDepartments = () => api.get('/patients/departments/');
export const getTreatments = (departmentId) => api.get('/patients/treatments/', { params: departmentId ? { department: departmentId } : {} });

export const getAppointments = (params) => api.get('/patients/appointments/', { params });
export const createAppointment = (data) => api.post('/patients/appointments/', data);
export const updateAppointment = (id, data) => api.patch(`/patients/appointments/${id}/`, data);

export const getVisitNotes = (patientId) => api.get(`/patients/${patientId}/visit-notes/`);
export const createVisitNote = (patientId, data) => api.post(`/patients/${patientId}/visit-notes/`, data);

export const getLabReports = (patientId) => api.get(`/patients/${patientId}/lab-reports/`);
export const createLabReport = (patientId, data) => api.post(`/patients/${patientId}/lab-reports/`, data);
