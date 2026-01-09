import axios from 'axios';

const API_BASE_URL =
    import.meta.env.VITE_API_URL || 'http://localhost:5000/dashboard';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
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
        if (error.response?.status === 401) {
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
