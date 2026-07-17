import { Linking } from "react-native";
import api from "./api";

const unwrap = (r) => r?.data?.data ?? r?.data;

export const generate = async (analysisId, template = "executive") => {
  const res = await api.post("/reports/generate", { analysisId, template });
  return unwrap(res);
};

export const getById = async (reportId) => {
  const res = await api.get(`/reports/${reportId}`);
  return unwrap(res);
};

export const listByAnalysis = async (analysisId) => {
  const res = await api.get(`/reports/by-analysis/${analysisId}`);
  return unwrap(res) || [];
};

export const openReport = async (report) => {
  if (!report) return false;
  const url = report.filePath
    ? `${api.defaults.baseURL}${report.filePath.startsWith("/") ? "" : "/"}${report.filePath}`
    : `${api.defaults.baseURL}/api/reports/${report._id || report.id}/download`;
  const ok = await Linking.canOpenURL(url);
  if (ok) return Linking.openURL(url);
  return false;
};

export default { generate, getById, listByAnalysis, openReport };