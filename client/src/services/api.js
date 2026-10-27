import axios from 'axios';

const defaultProductionApiUrl = 'https://e-commerce-fullstack-vdhw.onrender.com';
const configuredApiUrl = (import.meta.env.VITE_API_URL || defaultProductionApiUrl)
  .trim()
  .replace(/\/+$/, '');
const apiBaseUrl = import.meta.env.DEV
  ? '/api'
  : configuredApiUrl.endsWith('/api')
    ? configuredApiUrl
    : `${configuredApiUrl}/api`;

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
