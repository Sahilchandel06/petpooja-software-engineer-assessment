import axios from 'axios';

// Keep the API base URL in one place so local and deployed clients share request code.
export const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // Render's free API can take over 50 seconds to wake from sleep, so allow a cold start.
  timeout: 90000,
});

let simulateFailures = false;

export function setSimulateFailures(enabled) {
  simulateFailures = enabled;
}

http.interceptors.request.use((config) => {
  const isWrite = ['post', 'patch', 'put', 'delete'].includes(config.method?.toLowerCase());
  if (isWrite && simulateFailures) {
    config.headers.set('x-simulate-fail', 'true');
  } else {
    config.headers.delete('x-simulate-fail');
  }
  return config;
});
