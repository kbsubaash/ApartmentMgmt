import api from './axios';

export const getContacts = () => api.get('/community-contacts');
export const createContact = (data) => api.post('/community-contacts', data);
export const updateContact = (id, data) => api.put(`/community-contacts/${id}`, data);
export const deleteContact = (id) => api.delete(`/community-contacts/${id}`);
