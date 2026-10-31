import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5050/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('special_tech_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const projectApi = {
  getAll: (params) => api.get('/projects', { params }),
  getBySlug: (slug) => api.get(`/projects/${slug}`),
  create: (data) => api.post('/projects', data),
  update: (id, data) => api.put(`/projects/${id}`, data),
  delete: (id) => api.delete(`/projects/${id}`),
};

export const serviceApi = {
  getAll: () => api.get('/services'),
  getBySlug: (slug) => api.get(`/services/${slug}`),
};

export const aiApi = {
  startConversation: (data) => api.post('/ai/conversations', data),
  sendMessage: (data) => api.post('/ai/messages', data),
  getConversation: (id) => api.get(`/ai/conversations/${id}`),
  generateSpecification: (data) => api.post('/ai/requirements/generate', data),
  updateSpecification: (id, data) => api.put(`/ai/requirements/${id}`, data),
};

export const prototypeApi = {
  getTemplates: () => api.get('/prototypes/templates'),
  generate: (data) => api.post('/prototypes/generate', data),
  modify: (data) => api.post('/prototypes/modify', data),
  getById: (id) => api.get(`/prototypes/${id}`),
};

export const inquiryApi = {
  submit: (data) => api.post('/inquiries/submit', data),
  getAll: (params) => api.get('/inquiries', { params }),
  getById: (id) => api.get(`/inquiries/${id}`),
  updateStatus: (id, data) => api.patch(`/inquiries/${id}/status`, data),
  getPdfUrl: (id) => `http://localhost:5050/api/inquiries/${id}/pdf`,
};

export const adminApi = {
  getStats: () => api.get('/admin/stats'),
  getCustomers: () => api.get('/admin/customers'),
  getTeam: () => api.get('/admin/team'),
  getSettings: () => api.get('/admin/settings'),
  updateSetting: (data) => api.post('/admin/settings', data),
  getActivityLogs: () => api.get('/admin/activity-logs'),
  getNotifications: () => api.get('/admin/notifications'),
  markNotificationRead: (id) => api.patch(`/admin/notifications/${id}/read`),
};

export default api;
