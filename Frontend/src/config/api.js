// API Configuration
const raw = import.meta.env.VITE_API_BASE_URL;
if (!raw) {
  throw new Error('VITE_API_BASE_URL is not defined. Please set it in Frontend/.env file');
}

let API_BASE_URL = raw.replace(/\/+$/, '');
if (!API_BASE_URL.endsWith('/api')) API_BASE_URL = API_BASE_URL + '/api';


console.log("Using API_BASE_URL:", API_BASE_URL);

export default API_BASE_URL;

