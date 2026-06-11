import axios from 'axios';

// Base API Client
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to inject JWT token
apiClient.interceptors.request.use(
  (config) => {
    // We will dynamically set the token from the AuthProvider
    const token = localStorage.getItem('safecred_token');
    
    // In VITE_AUTH_MODE=development, we might inject X-Dev-User headers instead
    if (import.meta.env.VITE_AUTH_MODE === 'development') {
        const devUser = localStorage.getItem('dev_user') || 'officer_local';
        const devRoles = localStorage.getItem('dev_roles') || 'OFFICER';
        config.headers['X-Dev-User'] = devUser;
        config.headers['X-Dev-Roles'] = devRoles;
    } else if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor for global error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // We can dispatch to a global toast here or let React Query handle it
    if (error.response?.status === 401) {
      console.error("Unauthorized: Token expired or invalid.");
      // Optional: trigger logout
    }
    return Promise.reject(error);
  }
);
