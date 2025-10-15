import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth APIs
export const authAPI = {
  register: (data: any) => apiClient.post('/auth/register', data),
  login: (data: any) => apiClient.post('/auth/login', data),
  verifyToken: () => apiClient.get('/auth/verify'),
};

// Application APIs
export const applicationAPI = {
  create: (data: any) => apiClient.post('/applications', data),
  getAll: () => apiClient.get('/applications'),
  getById: (id: string) => apiClient.get(`/applications/${id}`),
  submit: (id: string) => apiClient.post(`/applications/${id}/submit`),
};

// User APIs
export const userAPI = {
  getCurrentUser: () => apiClient.get('/users/me'),
  updateProfile: (data: any) => apiClient.put('/users/me', data),
};

export default apiClient;
