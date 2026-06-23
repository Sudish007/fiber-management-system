import axios from 'axios';

const API_BASE = import.meta.env.PROD
  ? 'https://fiber-management-system-2.onrender.com/api'
  : '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Auth
export const authApi = {
  login: (username: string, password: string) =>
    api.post('/login', { username, password }),
  register: (username: string, password: string, role: string = 'user') =>
    api.post('/register', { username, password, role }),
  getMe: () => api.get('/me'),
};

// Dashboard
export const dashboardApi = {
  get: () => api.get('/dashboard'),
};

// Ports
export const portsApi = {
  getAll: (params?: { status?: string; search?: string }) =>
    api.get('/ports', { params }),
  getById: (id: number) => api.get(`/ports/${id}`),
  create: (data: Record<string, unknown>) => api.post('/ports', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/ports/${id}`, data),
  delete: (id: number) => api.delete(`/ports/${id}`),
  export: () => api.get('/ports/export', { responseType: 'blob' }),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/ports/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// DDF
export const ddfApi = {
  getAll: (params?: { status?: string; search?: string }) =>
    api.get('/ddf', { params }),
  getById: (id: number) => api.get(`/ddf/${id}`),
  create: (data: Record<string, unknown>) => api.post('/ddf', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/ddf/${id}`, data),
  delete: (id: number) => api.delete(`/ddf/${id}`),
  export: () => api.get('/ddf/export', { responseType: 'blob' }),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/ddf/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};

// OFC Routes
export const ofcApi = {
  getAll: (params?: { status?: string; search?: string }) =>
    api.get('/ofc', { params }),
  getById: (id: number) => api.get(`/ofc/${id}`),
  create: (data: Record<string, unknown>) => api.post('/ofc', data),
  update: (id: number, data: Record<string, unknown>) => api.put(`/ofc/${id}`, data),
  delete: (id: number) => api.delete(`/ofc/${id}`),
  export: () => api.get('/ofc/export', { responseType: 'blob' }),
  import: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/ofc/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
  // Fiber cores
  getFibers: (routeId: number) => api.get(`/ofc/${routeId}/fibers`),
  createFiber: (routeId: number, data: Record<string, unknown>) => api.post(`/ofc/${routeId}/fibers`, data),
  updateFiber: (routeId: number, fiberId: number, data: Record<string, unknown>) => api.put(`/ofc/${routeId}/fibers/${fiberId}`, data),
  deleteFiber: (routeId: number, fiberId: number) => api.delete(`/ofc/${routeId}/fibers/${fiberId}`),
};

// Search
export const searchApi = {
  search: (q: string) => api.get('/search', { params: { q } }),
};

export default api;
