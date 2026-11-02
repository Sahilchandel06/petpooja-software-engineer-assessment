import axios from 'axios';

// Keep the API base URL in one place so local and deployed clients share request code.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});
