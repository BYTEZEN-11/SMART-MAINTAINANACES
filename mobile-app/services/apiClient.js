

const axios = require("axios");
const AsyncStorage = require("@react-native-async-storage/async-storage").default || require("@react-native-async-storage/async-storage");
const { APP_CONFIG } = require("../constants/config");

const TOKEN_KEY = "auth:backend:token";

const getStoredToken = async () => {
  try { return await AsyncStorage.getItem(TOKEN_KEY); }
  catch { return null; }
};

const setStoredToken = async (token) => {
  if (!token) return;
  try { await AsyncStorage.setItem(TOKEN_KEY, token); } catch {  }
};

const clearStoredToken = async () => {
  try { await AsyncStorage.removeItem(TOKEN_KEY); } catch {  }
};

const unauthorisedListeners = new Set();
const onUnauthorised = (cb) => {
  unauthorisedListeners.add(cb);
  return () => unauthorisedListeners.delete(cb);
};
const emitUnauthorised = () => {
  for (const cb of unauthorisedListeners) {
    try { cb(); } catch {  }
  }
};

const instance = axios.create({
  baseURL: APP_CONFIG.api.baseURL,
  timeout: APP_CONFIG.api.timeoutMs,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use(async (config) => {
  if (!config.headers) config.headers = {};
  if (config.headers.Authorization) return config;
  const token = await getStoredToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    const status = error && error.response && error.response.status;
    if (status === 401) {

await clearStoredToken();
      emitUnauthorised();
    }
    return Promise.reject(error);
  }
);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const retry = async (fn, attempts = APP_CONFIG.api.retryAttempts, base = APP_CONFIG.api.retryBackoffMs) => {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const status = e && e.response && e.response.status;
      const retryable =
        !e || !e.response ||
        (status >= 500 && status < 600) ||
        e.code === "ECONNABORTED" || e.code === "ECONNRESET" || e.message === "Network Error";
      if (!retryable || i === attempts - 1) break;
      await sleep(base * Math.pow(2, i));
    }
  }
  throw lastErr;
};

const get    = (url, config)        => retry(() => instance.get(url, config));
const post   = (url, data, config)  => retry(() => instance.post(url, data, config));
const put    = (url, data, config)  => retry(() => instance.put(url, data, config));
const del    = (url, config)        => retry(() => instance.delete(url, config));
const patch  = (url, data, config)  => retry(() => instance.patch(url, data, config));

module.exports = instance;
module.exports.default = instance;
module.exports.getStoredToken = getStoredToken;
module.exports.setStoredToken = setStoredToken;
module.exports.clearStoredToken = clearStoredToken;
module.exports.onUnauthorised = onUnauthorised;
module.exports.retry = retry;
module.exports.get = get;
module.exports.post = post;
module.exports.put = put;
module.exports.del = del;
module.exports.patch = patch;