import api from "./api";

const unwrap = (r) => r?.data?.data ?? r?.data;

export const analyzeMultimodal = async (payload) => {
  const res = await api.post("/analyze/multimodal", payload);
  return unwrap(res);
};

export const analyzeImage = async (payload) => {
  const res = await api.post("/analyze/image", payload);
  return unwrap(res);
};

export const analyzeVideo = async (payload) => {
  const res = await api.post("/analyze/video", payload);
  return unwrap(res);
};

export const analyzeAudio = async (payload) => {
  const res = await api.post("/analyze/audio", payload);
  return unwrap(res);
};

export const analyzeText = async (payload) => {
  const res = await api.post("/analyze/text", payload);
  return unwrap(res);
};

export const startTroubleshoot = async ({ deviceType, deviceName, initialIssue }) => {
  const res = await api.post("/troubleshoot/start", { deviceType, deviceName, initialIssue });
  return unwrap(res);
};

export const answerTroubleshoot = async (sessionId, { questionId, answer }) => {
  const res = await api.post(`/troubleshoot/${sessionId}/answer`, { questionId, answer });
  return unwrap(res);
};

export default {
  analyzeMultimodal,
  analyzeImage,
  analyzeVideo,
  analyzeAudio,
  analyzeText,
  startTroubleshoot,
  answerTroubleshoot,
};