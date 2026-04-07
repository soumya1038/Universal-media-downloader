import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
