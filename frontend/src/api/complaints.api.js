import api from './axios';

export const getComplaints = (params) => api.get('/complaints', { params });
export const getComplaint = (id) => api.get(`/complaints/${id}`);

export const createComplaint = (data) => {
  const isFormData = data instanceof FormData;
  return api.post('/complaints', data, {
    headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
  });
};

export const updateComplaint = (id, data) => api.put(`/complaints/${id}`, data);
export const addComment = (id, text) => api.post(`/complaints/${id}/comments`, { text });
