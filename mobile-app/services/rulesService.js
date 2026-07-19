import api from "./api";

const unwrap = (r) => r?.data?.data ?? r?.data;

export const getActiveRules = async (deviceType) => {
  const res = await api.get("/rules/active", { params: { deviceType } });
  return unwrap(res) || [];
};

export const evaluateRules = async ({ deviceType, evidence, analysis }) => {
  const res = await api.post("/rules/evaluate", { deviceType, evidence, analysis });
  return unwrap(res);
};

export const fireCounts = async (deviceType) => {
  const res = await api.get("/rules/fire-counts", { params: { deviceType } });
  return unwrap(res) || {};
};

export default { getActiveRules, evaluateRules, fireCounts };