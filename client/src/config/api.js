// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
const WS_BASE_URL = process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:5000';

export const API_ENDPOINTS = {
  // Base URLs
  API_URL: API_BASE_URL,
  WS_URL: WS_BASE_URL,
  
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/api/auth/login`,
  REGISTER: `${API_BASE_URL}/api/auth/register`,
  
  // Driver endpoints
  DRIVERS: `${API_BASE_URL}/api/drivers`,
  DRIVER_STATS: `${API_BASE_URL}/api/drivers/dashboard-stats`,
  
  // Load endpoints
  LOADS: `${API_BASE_URL}/api/loads`,
  LOAD_UPLOAD: (loadId) => `${API_BASE_URL}/api/loads/${loadId}/upload`,
  LOAD_DELETE_FILE: (loadId, fileId, type) => `${API_BASE_URL}/api/loads/${loadId}/files/${fileId}?type=${type}`,
  
  // File endpoints
  UPLOADS: `${API_BASE_URL}/uploads`,
  
  // Dashboard endpoints
  DASHBOARD_STATS: `${API_BASE_URL}/api/dashboard/stats`,
};

// Axios default configuration
export const axiosConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
};

export default API_ENDPOINTS;