// Thin wrappers around each backend endpoint described in the project report.
import { apiClient } from './client';

export const getTargetTemperature = () => apiClient.get('/target');

export const setTargetTemperature = (targetC) =>
  apiClient.put('/target', { targetC });

export const getLatestReading = () => apiClient.get('/readings/latest');

export const getReadingHistory = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return apiClient.get(`/readings/history${query ? `?${query}` : ''}`);
};

export const getAlerts = () => apiClient.get('/alerts');

export const setCoolingMode = (mode, coolingOn) =>
  apiClient.put('/cooling', { mode, coolingOn });

export const getProduceInfo = () => apiClient.get('/produce');

export const setProduceInfo = (produce) =>
  apiClient.put('/produce', produce);
