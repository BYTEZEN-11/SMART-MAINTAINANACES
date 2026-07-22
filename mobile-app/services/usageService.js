import api from './api';

const usageService = {
  logUsage: async (data) => {
    try {
      const response = await api.post('/usage/log', data);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

  getPatternAnalysis: async (applianceId) => {
    try {
      const response = await api.get(`/usage/pattern-analysis/${applianceId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default usageService;
