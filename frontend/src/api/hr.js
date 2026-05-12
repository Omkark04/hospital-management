import api from './axios';

export const getEmployees = (params) => api.get('/hr/employees/', { params });
export const getEmployee = (id) => api.get(`/hr/employees/${id}/`);
export const createEmployee = (data) => api.post('/hr/employees/', data);
export const updateEmployee = (id, data) => api.put(`/hr/employees/${id}/`, data);
export const getMyEmployeeProfile = () => api.get('/hr/employees/me/');

// Attendance is READ-ONLY — all marking happens via QR scan
export const getAttendance = (params) => api.get('/hr/attendance/', { params });
export const getMyAttendance = () => api.get('/hr/attendance/me/');

export const getLeaves = (params) => api.get('/hr/leaves/', { params });
export const applyLeave = (data) => api.post('/hr/leaves/', data);
export const reviewLeave = (id, data) => api.patch(`/hr/leaves/${id}/review/`, data);

export const closeDay = (date) => api.post('/hr/attendance/close-day/', { date });

export const getPayroll = (params) => api.get('/hr/payroll/', { params });
export const calculatePayroll = (employeeId, month) => api.post('/hr/payroll/', { employee: employeeId, month });
export const markPayrollPaid = (id, notes) => api.patch(`/hr/payroll/${id}/`, { status: 'paid', payment_date: new Date().toISOString().split('T')[0], notes });
