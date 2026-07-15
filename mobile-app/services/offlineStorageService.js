

import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "./api";

const QUEUE_KEY      = "offline:queue";
const APPLIANCES_KEY = "cache:appliances";
const ALERTS_KEY     = "cache:alerts";
const DEVICE_KEY     = "cache:device";

const safeGet = async (key) => {
  try { return await AsyncStorage.getItem(key); } catch { return null; }
};
const safeSet = async (key, value) => {
  try { await AsyncStorage.setItem(key, value); } catch {  }
};
const safeRemove = async (key) => {
  try { await AsyncStorage.removeItem(key); } catch {  }
};

const safeParse = (s, fallback) => {
  if (!s) return fallback;
  try { return JSON.parse(s); } catch { return fallback; }
};

export const cacheAppliances = async (appliances) => {
  await safeSet(APPLIANCES_KEY, JSON.stringify(appliances || []));
};
export const getCachedAppliances = async () =>
  safeParse(await safeGet(APPLIANCES_KEY), []);

export const cacheAlerts = async (alerts) => {
  await safeSet(ALERTS_KEY, JSON.stringify(alerts || []));
};
export const getCachedAlerts = async () =>
  safeParse(await safeGet(ALERTS_KEY), []);

export const cacheDevices = async (devices) => {
  await safeSet(DEVICE_KEY, JSON.stringify(devices || []));
};
export const getCachedDevices = async () =>
  safeParse(await safeGet(DEVICE_KEY), []);

export const enqueueOperation = async (op) => {
  const list = safeParse(await safeGet(QUEUE_KEY), []);
  list.push({ ...op, _queuedAt: Date.now() });
  await safeSet(QUEUE_KEY, JSON.stringify(list));
};

export const getQueueLength = async () => {
  return safeParse(await safeGet(QUEUE_KEY), []).length;
};

export const flushQueue = async () => {
  const list = safeParse(await safeGet(QUEUE_KEY), []);
  if (list.length === 0) return { flushed: 0, failed: 0 };
  const remaining = [];
  let flushed = 0;
  let failed = 0;
  for (const op of list) {
    try {
      switch (op.method) {
        case "post": await api.post(op.url, op.data); break;
        case "put":  await api.put(op.url, op.data); break;
        case "del":  await api.delete(op.url); break;
        default: throw new Error(`Unknown method: ${op.method}`);
      }
      flushed += 1;
    } catch (e) {
      failed += 1;
      
      if (Date.now() - (op._queuedAt || 0) < 7 * 24 * 60 * 60 * 1000) {
        remaining.push(op);
      }
    }
  }
  await safeSet(QUEUE_KEY, JSON.stringify(remaining));
  return { flushed, failed };
};

export const clearCache = async () => {
  await Promise.all([
    safeRemove(APPLIANCES_KEY),
    safeRemove(ALERTS_KEY),
    safeRemove(DEVICE_KEY),
    safeRemove(QUEUE_KEY),
  ]);
};

export default {
  cacheAppliances, getCachedAppliances,
  cacheAlerts, getCachedAlerts,
  cacheDevices, getCachedDevices,
  enqueueOperation, getQueueLength, flushQueue, clearCache,
};
