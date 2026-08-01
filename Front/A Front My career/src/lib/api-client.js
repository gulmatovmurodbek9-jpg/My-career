import axios from 'axios';
import { API } from './config';

// Create axios instance with defaults
const apiClient = axios.create({
  baseURL: API,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth-storage')
      ? JSON.parse(localStorage.getItem('auth-storage'))?.state?.token
      : null;

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors globally
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, request, message } = error;

    // Log error for debugging
    console.error('API Error:', {
      status: response?.status,
      data: response?.data,
      url: error.config?.url,
      method: error.config?.method,
    });

    // Handle different error types
    if (response) {
      // Server responded with error status
      const { status, data } = response;

      switch (status) {
        case 401:
          // Unauthorized - token expired or invalid
          // Clear auth state and redirect to login
          localStorage.removeItem('auth-storage');
          window.location.href = '/login';
          break;

        case 403:
          // Forbidden - user doesn't have permission
          showToast('Шумо ба ин resource дастрасӣ надоред', 'error');
          break;

        case 404:
          // Not found
          console.warn(`Resource not found: ${error.config?.url}`);
          break;

        case 429:
          // Rate limited
          const retryAfter = response.headers['retry-after'] || 60;
          showToast(`Лимит гузашт. Лутфан ${retryAfter} сония кӯшиш кунед`, 'error');
          break;

        case 500:
        case 502:
        case 503:
          // Server errors
          showToast('Хатогии сервер. Лутфан дертар кӯшиш кунед', 'error');
          break;

        default:
          // Other errors
          const errorMessage = data?.message || data?.error || 'Хатогии номаълум рух дод';
          showToast(errorMessage, 'error');
      }
    } else if (request) {
      // Request made but no response (network error)
      showToast('Пайвастшавӣ бо сервер қатӣ шуд. Онлайн шудагирии худро sanctions кунед!', 'error');
    } else {
      // Something else happened (request config error)
      showToast(message || 'Хатогии номаълум', 'error');
    }

    return Promise.reject(error);
  }
);

// Helper function to show toast (will be replaced with context)
let toastHandler = null;

export const setToastHandler = (handler) => {
  toastHandler = handler;
};

const showToast = (message, type = 'error') => {
  if (toastHandler) {
    toastHandler(message, type);
  } else {
    // Fallback to alert if toast not ready yet
    console.warn(`Toast not ready: ${message}`);
  }
};

export default apiClient;