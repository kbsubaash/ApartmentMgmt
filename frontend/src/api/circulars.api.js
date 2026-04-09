import api from './axios';

export const getCirculars = (params) => api.get('/circulars', { params });
export const getCircular = (id) => api.get(`/circulars/${id}`);

export const createCircular = (data) => {
  // data may be FormData (with file) or plain object
  const isFormData = data instanceof FormData;
  return api.post('/circulars', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
};

export const updateCircular = (id, data) => api.put(`/circulars/${id}`, data);
export const publishCircular = (id) => api.post(`/circulars/${id}/publish`);
export const deleteCircular = (id) => api.delete(`/circulars/${id}`);
