import api from './api';

const maintenanceService = {
  getPrediction: async (applianceId) => {
    try {
      const response = await api.get(`/maintenance/prediction/${applianceId}`);
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default maintenanceService;
