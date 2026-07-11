import { Platform } from "react-native";
import { initializeApp, getApps } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  inMemoryPersistence,
  browserLocalPersistence,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const isConfigured =
  !!firebaseConfig.apiKey
  && !firebaseConfig.apiKey.includes("Demo")
  && !firebaseConfig.apiKey.includes("your-")
  && firebaseConfig.apiKey.length > 30;

if (!isConfigured) {
  console.warn("[firebase] not configured — auth will be disabled");
}

let app, auth;

if (isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

if (Platform.OS === "web") {
      auth = initializeAuth(app, { persistence: browserLocalPersistence });
    } else {
      try {
        
        const AsyncStorage = require("@react-native-async-storage/async-storage").default;

const { getReactNativePersistence } = require("firebase/auth/react-native");
        auth = initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });
      } catch (err) {

console.warn("[firebase] persistence shim unavailable, falling back to inMemoryPersistence:", err.message);
        auth = initializeAuth(app, { persistence: inMemoryPersistence });
      }
    }
    console.log("[firebase] initialized successfully");
  } catch (err) {
    console.error("[firebase] init failed:", err.message);
  }
}

export { auth };
export default app;