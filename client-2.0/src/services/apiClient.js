import axios from 'axios';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const apiClient = axios.create({
  baseURL: `${API_BASE}/api`,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const serverMsg = error.response.data?.error || error.response.data?.message;
      if (error.response.status === 429) {
        return Promise.reject(new Error(serverMsg || 'Too many requests. Please wait a moment and try again.'));
      }
      if (serverMsg) {
        return Promise.reject(new Error(serverMsg));
      }
    }
    return Promise.reject(error);
  }
);

export const analyzeUrl = async (url) => {
  const response = await apiClient.post('/analyze', { url });
  return response.data;
};

export const startDownload = async (data) => {
  const response = await apiClient.post('/download', data);
  return response.data;
};

export const getJobStatus = async (jobId) => {
  const response = await apiClient.get(`/job/${jobId}`);
  return response.data;
};

export const getHistory = async () => {
  const response = await apiClient.get('/history');
  return response.data;
};

export const deleteHistoryItem = async (jobId) => {
  const response = await apiClient.delete(`/history/${jobId}`);
  return response.data;
};

export const clearAllHistory = async () => {
  const response = await apiClient.delete('/history');
  return response.data;
};

export default apiClient;
