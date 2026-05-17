

import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

const DEFAULT_POLL_MS = 30_000;

export function useIoTStatus(deviceId, { pollMs = DEFAULT_POLL_MS } = {}) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(Boolean(deviceId));
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchStatus = useCallback(async () => {
    if (!deviceId) {
      setStatus(null);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const res = await api.get(`/iot/devices/${encodeURIComponent(deviceId)}/health`);
      setStatus(res.data?.data ?? res.data ?? null);
      setLastUpdated(Date.now());
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load device status");
    } finally {
      setLoading(false);
    }
  }, [deviceId]);

  useEffect(() => {
    setLoading(Boolean(deviceId));
    fetchStatus();
    if (!deviceId || pollMs <= 0) return undefined;
    const id = setInterval(fetchStatus, pollMs);
    return () => clearInterval(id);
  }, [deviceId, pollMs, fetchStatus]);

  return { status, loading, error, lastUpdated, refresh: fetchStatus };
}

export default useIoTStatus;
