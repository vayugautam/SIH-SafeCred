import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject JWT tokens into every request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only force logout/reload if they were already authenticated (have a token)
    // This prevents the login page from reloading when typing a wrong password
    const hasToken = !!useAuthStore.getState().token;
    if (error.response?.status === 401 && hasToken) {
      useAuthStore.getState().logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
