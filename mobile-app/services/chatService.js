import api from './api';
import { sanitizeChatMessage } from '../utils/sanitize';

const sanitizeMessages = (data) => {
  if (!data) return data;
  const sanitizeMsg = (m) => {
    if (!m || typeof m !== 'object') return m;
    return {
      ...m,
      content:
        typeof m.content === 'string'
          ? sanitizeChatMessage(m.content)
          : m.content,
    };
  };
  if (Array.isArray(data.messages)) {
    return { ...data, messages: data.messages.map(sanitizeMsg) };
  }
  if (data.message) {
    return { ...data, message: sanitizeMsg(data.message) };
  }
  return data;
};

const chatService = {
  
  startChat: async (deviceType, deviceName) => {
    try {
      const response = await api.post('/chat/start', { deviceType, deviceName });
      return sanitizeMessages(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

sendMessage: async (sessionId, message) => {
    try {
      const cleanMessage = sanitizeChatMessage(message);
      const response = await api.post(`/chat/${sessionId}/message`, {
        message: cleanMessage,
      });
      return sanitizeMessages(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getChatHistory: async () => {
    try {
      const response = await api.get('/chat/history');
      return response.data.data;
    } catch (error) {
      throw error.response?.data || error;
    }
  },

getChatSession: async (sessionId) => {
    try {
      const response = await api.get(`/chat/${sessionId}`);
      return sanitizeMessages(response.data.data);
    } catch (error) {
      throw error.response?.data || error;
    }
  }
};

export default chatService;
