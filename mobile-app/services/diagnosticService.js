import api from './api';
import { sanitizeDiagnosis, sanitizeChatMessage } from '../utils/sanitize';

const sanitizeResult = (data) => {
  if (!data) return data;
  
  if (data.diagnosis) {
    return { ...data, diagnosis: sanitizeDiagnosis(data.diagnosis) };
  }
  return data;
};

const diagnosticService = {
  
  runSoundAnalysis: async (data) => {
    try {
      const response = await api.post('/diagnostics/sound-analysis', data);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

runPerformanceTest: async (data) => {
    try {
      const response = await api.post('/diagnostics/performance-test', data);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

runBatteryHealth: async (data) => {
    try {
      const response = await api.post('/diagnostics/battery-health', data);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

runStorageHealth: async (data) => {
    try {
      const response = await api.post('/diagnostics/storage-health', data);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

runConnectivityTest: async (data) => {
    try {
      const response = await api.post('/diagnostics/connectivity-test', data);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

runPowerAnalysis: async (data) => {
    try {
      const response = await api.post('/diagnostics/power-analysis', data);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

runVibrationAnalysis: async (data) => {
    try {
      const response = await api.post('/diagnostics/vibration-analysis', data);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

runThermalAnalysis: async (data) => {
    try {
      const response = await api.post('/diagnostics/thermal-analysis', data);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

runVisualInspection: async (data) => {
    try {
      const response = await api.post('/diagnostics/visual-inspection', data);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

runSymptomChecker: async (data) => {
    try {
      const response = await api.post('/diagnostics/symptom-checker', data);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

runComprehensiveDiagnostic: async (data) => {
    try {
      const response = await api.post('/diagnostics/comprehensive', data);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getHistory: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const response = await api.get(`/diagnostics/history?${params}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getById: async (id) => {
    try {
      const response = await api.get(`/diagnostics/${id}`);
      return sanitizeResult(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getStats: async () => {
    try {
      const response = await api.get('/diagnostics/stats');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default diagnosticService;
