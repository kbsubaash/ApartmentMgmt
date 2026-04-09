import api from './axios';

export const signCircular = (id) => api.post(`/circulars/${id}/sign`);
export const getSignatures = (id) => api.get(`/circulars/${id}/signatures`);
