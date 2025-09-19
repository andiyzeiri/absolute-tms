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
  LOAD_UPLOAD_URL: (loadId) => `${API_BASE_URL}/api/loads/${loadId}/upload-url`,
  LOAD_UPLOAD_COMPLETE: (loadId) => `${API_BASE_URL}/api/loads/${loadId}/upload-complete`,
  LOAD_DELETE_FILE: (loadId, fileId, type) => `${API_BASE_URL}/api/loads/${loadId}/files/${fileId}?type=${type}`,
  
  // File endpoints
  UPLOADS: `${API_BASE_URL}/uploads`,
  
  // Dashboard endpoints
  DASHBOARD_STATS: `${API_BASE_URL}/api/dashboard/stats`,

  // User/Team management endpoints
  TEAM_MEMBERS: `${API_BASE_URL}/api/users`,
  CREATE_TEAM_MEMBER: `${API_BASE_URL}/api/users/create`,
  UPDATE_TEAM_MEMBER: (userId) => `${API_BASE_URL}/api/users/${userId}`,
  DELETE_TEAM_MEMBER: (userId) => `${API_BASE_URL}/api/users/${userId}`,

  // Customer management endpoints
  CUSTOMERS: `${API_BASE_URL}/api/customers`,
  CREATE_CUSTOMER: `${API_BASE_URL}/api/customers`,
  UPDATE_CUSTOMER: (customerId) => `${API_BASE_URL}/api/customers/${customerId}`,
  DELETE_CUSTOMER: (customerId) => `${API_BASE_URL}/api/customers/${customerId}`,

  // Broker management endpoints
  BROKERS: `${API_BASE_URL}/api/brokers`,
  CREATE_BROKER: `${API_BASE_URL}/api/brokers`,
  UPDATE_BROKER: (brokerId) => `${API_BASE_URL}/api/brokers/${brokerId}`,
  DELETE_BROKER: (brokerId) => `${API_BASE_URL}/api/brokers/${brokerId}`,
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