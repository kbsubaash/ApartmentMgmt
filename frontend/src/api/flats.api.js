import api from './axios';

export const getFlats = (params) => api.get('/flats', { params });
export const getFlat = (id) => api.get(`/flats/${id}`);
export const createFlat = (data) => api.post('/flats', data);
export const updateFlat = (id, data) => api.put(`/flats/${id}`, data);
export const assignMember = (flatId, memberId) =>
  api.post(`/flats/${flatId}/assign`, { memberId });
export const unassignMember = (flatId, memberId) =>
  api.post(`/flats/${flatId}/unassign`, { memberId });
