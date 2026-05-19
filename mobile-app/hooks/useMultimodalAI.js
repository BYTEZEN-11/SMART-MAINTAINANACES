

import { useCallback, useState } from "react";
import { analyzeMultimodal } from "../services/multimodalService";

export function useMultimodalAI() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const analyze = useCallback(async (payload) => {
    setLoading(true);
    setError(null);
    try {
      const r = await analyzeMultimodal(payload);
      setResult(r);
      return r;
    } catch (e) {
      setError(e?.response?.data?.message || e.message || "Analysis failed");
      throw e;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { analyze, reset, loading, result, error };
}

export default useMultimodalAI;
