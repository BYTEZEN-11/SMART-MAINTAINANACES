import api from './api';

const riskService = {
  
  calculateRiskScore: async (applianceId) => {
    try {
      const response = await api.get(`/risk/calculate/${applianceId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getRiskHistory: async (applianceId) => {
    try {
      const response = await api.get(`/risk/history/${applianceId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default riskService;
