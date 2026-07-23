import axios from "axios";
import { Platform } from "react-native";

class Emitter {
  constructor() { this._handlers = new Set(); }
  on(fn) { this._handlers.add(fn); return () => this._handlers.delete(fn); }
  emit(payload) { for (const fn of this._handlers) fn(payload); }
}

const _unauthorisedEmitter = new Emitter();
export const onUnauthorised = (fn) => _unauthorisedEmitter.on(fn);

const isUsableUrl = (url) => {
  if (!url || typeof url !== 'string') return false;
  if (url.includes('api.invalid.local')) return false;
  return /^https?:\/\//.test(url);
};

export const getBaseURL = () => {
  const envURL = process.env.EXPO_PUBLIC_API_URL;
  if (isUsableUrl(envURL)) {
    if (__DEV__) console.log('[api] using EXPO_PUBLIC_API_URL:', envURL);
    return envURL;
  }
  if (!__DEV__) {
    console.error(
      '[api] EXPO_PUBLIC_API_URL is not set or invalid in production. ' +
      'Configure the backend URL before shipping.'
    );
    return 'https://api.invalid.local';
  }
  
  const localIP = process.env.EXPO_PUBLIC_LOCAL_IP || '10.110.157.73';
  const port = process.env.EXPO_PUBLIC_LOCAL_PORT || '5000';
  return `http://${localIP}:${port}`;
};

const BASE_URL = getBaseURL();

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

let _cachedToken = null;
let _tokenLoadPromise = null;

export const setApiToken = (token) => {
  _cachedToken = token;
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const loadTokenFromStorage = async () => {
  if (_tokenLoadPromise) return _tokenLoadPromise;
  _tokenLoadPromise = (async () => {
    try {
      let token = null;
      if (Platform.OS === 'web') {
        token = typeof window !== 'undefined'
          ? window.localStorage.getItem('token')
          : null;
      } else {
        
        const AS = require('@react-native-async-storage/async-storage').default;
        token = await AS.getItem('token');
      }
      if (token) setApiToken(token);
      return token;
    } catch (err) {
      console.error('[api] failed to load token from storage:', err);
      return null;
    } finally {
      _tokenLoadPromise = null;
    }
  })();
  return _tokenLoadPromise;
};

export const persistApiToken = async (token) => {
  setApiToken(token);
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        if (token) window.localStorage.setItem('token', token);
        else window.localStorage.removeItem('token');
      }
    } else {
      const AS = require('@react-native-async-storage/async-storage').default;
      if (token) await AS.setItem('token', token);
      else await AS.removeItem('token');
    }
  } catch (err) {
    console.error('[api] failed to persist token:', err);
  }
};

api.interceptors.request.use(
  (config) => {
    if (
      config.url &&
      !config.url.startsWith('/api') &&
      !config.url.startsWith('http') &&
      config.url !== '/health' &&
      config.url !== 'health'
    ) {
      config.url = `/api${config.url.startsWith('/') ? '' : '/'}${config.url}`;
    }
    if (_cachedToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${_cachedToken}`;
    }
    if (__DEV__) {
      console.log(
        `[api] ${config.method?.toUpperCase()} ${config.baseURL || api.defaults.baseURL}${config.url}`
      );
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { config, response } = error;

    if (response?.status === 401) {

const isLogin = typeof config?.url === 'string'
        && (config.url.includes('/auth/login') || config.url.includes('/auth/sync'));
      if (!isLogin) {
        setApiToken(null);
        _unauthorisedEmitter.emit({ url: config?.url, status: 401 });
      }
    }

    const retryableCodes = ['ECONNABORTED', 'ERR_NETWORK'];
    const isNetworkError = retryableCodes.includes(error.code) || error.message === 'Network Error';
    const retries = config?.__retryCount || 0;
    const maxRetries = __DEV__ ? 0 : 2;

    if (isNetworkError && retries < maxRetries) {
      config.__retryCount = retries + 1;
      const delay = 500 * Math.pow(3, retries);
      await new Promise((r) => setTimeout(r, delay));
      if (__DEV__) {
        console.log(
          `[api] retry ${retries + 1}/${maxRetries} ${config.method?.toUpperCase()} ${config.url}`
        );
      }
      return api(config);
    }

    let message;
    if (error.code === 'ECONNABORTED') {
      message = 'Request timeout — backend may be slow or unavailable';
    } else if (isNetworkError) {
      message = 'Cannot connect to backend — check if the server is reachable';
    } else if (response?.status === 409) {

message = response.data?.message || 'Conflict';
    } else {
      message = response?.data?.message || response?.data?.error || error.message || 'Something went wrong';
    }

    const err = new Error(message);
    err.status = response?.status;
    err.data = response?.data;
    return Promise.reject(err);
  },
);

export default api;