import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
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

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me')
};

// Trolley API
export const trolleyAPI = {
  getAll: (params) => api.get('/trolleys', { params }),
  getById: (id) => api.get(`/trolleys/${id}`),
  create: (data) => api.post('/trolleys', data),
  update: (id, data) => api.put(`/trolleys/${id}`, data),
  delete: (id) => api.delete(`/trolleys/${id}`),
  scan: (data) => api.post('/trolleys/scan', data),
  getHistory: (id) => api.get(`/trolleys/${id}/history`)
};

// Store API
export const storeAPI = {
  getAll: () => api.get('/stores'),
  getById: (id) => api.get(`/stores/${id}`),
  create: (data) => api.post('/stores', data),
  update: (id, data) => api.put(`/stores/${id}`, data),
  delete: (id) => api.delete(`/stores/${id}`),
  getTrolleys: (id, params) => api.get(`/stores/${id}/trolleys`, { params })
};

// Maintenance API
export const maintenanceAPI = {
  getAll: (params) => api.get('/maintenance', { params }),
  getById: (id) => api.get(`/maintenance/${id}`),
  create: (data) => api.post('/maintenance', data),
  update: (id, data) => api.put(`/maintenance/${id}`, data),
  delete: (id) => api.delete(`/maintenance/${id}`),
  getTrolleyMaintenance: (trolleyId) => api.get(`/maintenance/trolley/${trolleyId}`)
};

// Alert API
export const alertAPI = {
  getAll: (params) => api.get('/alerts', { params }),
  getById: (id) => api.get(`/alerts/${id}`),
  resolve: (id) => api.put(`/alerts/${id}/resolve`),
  delete: (id) => api.delete(`/alerts/${id}`),
  getCount: () => api.get('/alerts/count')
};

// Dashboard API
export const dashboardAPI = {
  getStats: (params) => api.get('/dashboard/stats', { params }),
  getMapData: () => api.get('/dashboard/map'),
  getAnalytics: (params) => api.get('/dashboard/analytics', { params })
};

// GPS Tracking API
export const gpsAPI = {
  updateLocation: (data) => api.post('/gps/update', data),
  batchUpdateLocations: (updates) => api.post('/gps/batch-update', { updates }),
  getAllLocations: (params) => api.get('/gps/locations', { params }),
  getLocation: (trolleyId) => api.get(`/gps/location/${trolleyId}`),
  getLocationHistory: (trolleyId, params) => api.get(`/gps/history/${trolleyId}`, { params }),
  getTrolleysOutsideGeofence: (params) => api.get('/gps/outside-geofence', { params }),
  getLocationStats: (trolleyId, days = 7) => api.get(`/gps/stats/${trolleyId}`, { params: { days } })
};

export default api;
