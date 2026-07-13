import api from './api';

const iotService = {
  
  connectDevice: async (deviceData) => {
    try {
      const response = await api.post('/iot/connect', deviceData);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

disconnectDevice: async (deviceId) => {
    try {
      const response = await api.post(`/iot/disconnect/${deviceId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getDevices: async () => {
    try {
      const response = await api.get('/iot/devices');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getDeviceById: async (deviceId) => {
    try {
      const response = await api.get(`/iot/devices/${deviceId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getDeviceHealth: async (deviceId) => {
    try {
      const response = await api.get(`/iot/devices/${deviceId}/health`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

sendSensorData: async (deviceId, data) => {
    try {
      const response = await api.post(`/iot/data/${deviceId}`, data);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getSensorDataHistory: async (deviceId, params = {}) => {
    try {
      const response = await api.get(`/iot/data/${deviceId}/history`, { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getAllAlerts: async (params = {}) => {
    try {
      const response = await api.get('/iot/alerts', { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getDeviceAlerts: async (deviceId, params = {}) => {
    try {
      const response = await api.get(`/iot/alerts/${deviceId}`, { params });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

updateAlertStatus: async (alertId, status) => {
    try {
      const response = await api.patch(`/iot/alerts/${alertId}`, { status });
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default iotService;
