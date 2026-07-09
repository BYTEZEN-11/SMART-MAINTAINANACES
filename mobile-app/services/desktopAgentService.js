import api from "./api";

const unwrap = (r) => r?.data?.data ?? r?.data;

export const getPairCode = async () => {
  const res = await api.get("/desktop-agent/pair-code");
  return unwrap(res);
};

export const ingestBatch = async ({ deviceId, source = "manual", payload, agentVersion }) => {
  const res = await api.post("/desktop-agent/ingest", { deviceId, source, payload, agentVersion });
  return unwrap(res);
};

export const getHealth = async (deviceId) => {
  const res = await api.get("/desktop-agent/health", { params: { deviceId } });
  return unwrap(res);
};

export const getLogs = async (deviceId) => {
  const res = await api.get("/desktop-agent/logs", { params: { deviceId } });
  return unwrap(res);
};

export const buildDemoPayload = (deviceId) => ({
  deviceId,
  source: "manual",
  agentVersion: "demo-1.0",
  payload: {
    cpu: { temp: 92, usage: 88, model: "Demo CPU" },
    gpu: { temp: 89, usage: 75, model: "Demo GPU" },
    ram: { used: 7.6, total: 8 },
    battery: { health: 62, cycleCount: 820, temp: 38 },
    storage: [
      { name: "C:", health: "OK", freeGB: 120, totalGB: 512 },
      { name: "D:", health: "DEGRADED", freeGB: 40, totalGB: 256 },
    ],
    crashes: [
      { ts: new Date().toISOString(), signature: "demo_sig", exit: -1 },
      { ts: new Date().toISOString(), signature: "demo_sig_2", exit: 1 },
    ],
    fans: [{ name: "CPU", rpm: 4200 }],
    os: "demo",
  },
});

export default {
  getPairCode,
  ingestBatch,
  getHealth,
  getLogs,
  buildDemoPayload,
};