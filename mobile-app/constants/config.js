

if (typeof globalThis.__DEV__ === "undefined") {
  globalThis.__DEV__ = process.env.NODE_ENV !== "production";
}

const env = (key, fallback) => {
  const v = process.env[key];
  if (v === undefined || v === null || v === "") return fallback;
  return v;
};

const API_URL = env("EXPO_PUBLIC_API_URL", "http://localhost:5000");

const APP_CONFIG = {
  api: {
    baseURL: API_URL,
    timeoutMs: 30_000,
    retryAttempts: 3,
    retryBackoffMs: 800,
  },

  firebase: {
    apiKey:            env("EXPO_PUBLIC_FIREBASE_API_KEY", ""),
    authDomain:        env("EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN", ""),
    projectId:         env("EXPO_PUBLIC_FIREBASE_PROJECT_ID", ""),
    storageBucket:     env("EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET", ""),
    messagingSenderId: env("EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", ""),
    appId:             env("EXPO_PUBLIC_FIREBASE_APP_ID", ""),
  },

  supabase: {
    url:    env("EXPO_PUBLIC_SUPABASE_URL", ""),
    anonKey:env("EXPO_PUBLIC_SUPABASE_ANON_KEY", ""),
  },

  upload: {
    primary: env("EXPO_PUBLIC_STORAGE_PRIMARY", "backend"),
    enableSupabase: true,
    enableFirebase: true,
    enableBackend:  true,
    maxFileBytes:   10 * 1024 * 1024,
  },

  features: {
    predictiveMaintenance: true,
    iot:                   true,
    pdfReports:            true,
    aiChat:                true,
    ruleEngine:            true,
    multimodal:            true,
    desktopAgent:          true,
  },

isDev:  __DEV__ === true || process.env.NODE_ENV !== "production",
  version: "1.0.0",
};

const isFirebaseConfigured = Boolean(
  APP_CONFIG.firebase.apiKey &&
  APP_CONFIG.firebase.projectId &&
  APP_CONFIG.firebase.appId
);

const isSupabaseConfigured = Boolean(
  APP_CONFIG.supabase.url && APP_CONFIG.supabase.anonKey
);

module.exports = APP_CONFIG;
module.exports.default = APP_CONFIG;
module.exports.APP_CONFIG = APP_CONFIG;
module.exports.API_URL = API_URL;
module.exports.isFirebaseConfigured = isFirebaseConfigured;
module.exports.isSupabaseConfigured = isSupabaseConfigured;
