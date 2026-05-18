

import { useCallback, useEffect, useState } from "react";
import api from "../services/api";

export function useMaintenanceAlerts({ pollMs = 60_000 } = {}) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get("/iot/alerts", { params: { status: "active" } });
      const list = res.data?.data ?? res.data ?? [];
      setAlerts(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Failed to load alerts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    if (pollMs <= 0) return undefined;
    const id = setInterval(fetchAlerts, pollMs);
    return () => clearInterval(id);
  }, [fetchAlerts, pollMs]);

  return { alerts, loading, error, refresh: fetchAlerts };
}

export default useMaintenanceAlerts;
