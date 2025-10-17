import axios from 'axios';

const api = axios.create({
  // import.meta.env typing can be missing in some TS setups; cast to any to be safe
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api',
});

api.interceptors.request.use(
  (config) => {
    // Support tokens stored either in localStorage (remember me) or sessionStorage (non-remembered)
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (token) {
      // Ensure headers object exists and set Authorization header
      if (!config.headers) config.headers = {} as any;
      (config.headers as any).Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    // On auth errors, clear stored tokens and redirect to login so user can re-authenticate
    if (status === 401 || status === 403) {
      try {
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
      } catch (e) {
        // ignore
      }
      // Only change location if we're not already on the login page
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
