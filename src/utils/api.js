import axios from 'axios';

const configuredBase = (
    import.meta.env.VITE_API_URL || 'http://localhost:5001'
).replace(/\/+$/, '');
const API_BASE_URL = configuredBase.endsWith('/dashboard')
    ? configuredBase
    : `${configuredBase}/dashboard`;

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('admin_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Handle responses and errors
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Only the dashboard API can say the admin session is over. A 401 from
        // any other service (an absolute URL) must not sign the reviewer out.
        const url = error.config?.url || '';
        const toDashboard = !/^https?:\/\//i.test(url) || url.startsWith(API_BASE_URL);
        if (error.response?.status === 401 && toDashboard) {
            // Token expired or invalid
            localStorage.removeItem('admin_token');
            localStorage.removeItem('admin_user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    },
);

// Auth API calls
export const authAPI = {
    signup: (data) => api.post('/auth/signup', data),
    signin: (data) => api.post('/auth/signin', data),
};

// Dashboard API calls
export const dashboardAPI = {
    getStats: () => api.get('/stats'),
    // Add more dashboard endpoints as needed
};

export default api;

/** The API sends a useful `message` on failure; prefer it over a generic string. */
export const apiErrorMessage = (error, fallback = 'Something went wrong') =>
    error?.response?.data?.message || error?.message || fallback;
