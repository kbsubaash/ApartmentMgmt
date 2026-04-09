import api from './axios';

export const getPolls = (params) => api.get('/polls', { params });
export const getPoll = (id) => api.get(`/polls/${id}`);
export const createPoll = (data) => api.post('/polls', data);
export const updatePoll = (id, data) => api.put(`/polls/${id}`, data);
export const publishPoll = (id) => api.post(`/polls/${id}/publish`);
export const closePoll = (id) => api.post(`/polls/${id}/close`);
export const castVote = (id, optionId) => api.post(`/polls/${id}/vote`, { optionId });
export const deletePoll = (id) => api.delete(`/polls/${id}`);
