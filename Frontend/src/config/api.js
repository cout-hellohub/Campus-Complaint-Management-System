// API Configuration
// Reads from Frontend/.env file - VITE_API_BASE_URL variable
const API_BASE_URL = import.meta?.env?.VITE_API_BASE_URL || 'https://backend-production-bd66.up.railway.app/api';

export default API_BASE_URL;
