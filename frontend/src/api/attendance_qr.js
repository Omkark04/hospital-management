import api from './axios';

export const getQRToken = async (branchId) => {
  return api.get(`/hr/attendance/qr-token/`, {
    params: { branch_id: branchId }
  });
};

export const scanQRToken = async (qrToken, lat, lng) => {
  return api.post(`/hr/attendance/scan/`, {
    qr_token: qrToken,
    lat,
    lng
  });
};
