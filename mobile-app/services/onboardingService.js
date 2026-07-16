

import { Platform } from "react-native";

const KEY = "@onboarding_seen";

const setFlag = async (value) => {
  try {
    if (Platform.OS === "web") {
      if (typeof window !== "undefined" && window.localStorage) {
        if (value === null) window.localStorage.removeItem(KEY);
        else window.localStorage.setItem(KEY, value);
      }
      return;
    }
    const AS = require("@react-native-async-storage/async-storage").default;
    if (value === null) await AS.removeItem(KEY);
    else await AS.setItem(KEY, value);
  } catch (err) {
    console.warn("[onboardingService] storage write failed:", err?.message || err);
  }
};

const getFlag = async () => {
  try {
    if (Platform.OS === "web") {
      if (typeof window === "undefined" || !window.localStorage) return null;
      return window.localStorage.getItem(KEY);
    }
    const AS = require("@react-native-async-storage/async-storage").default;
    return await AS.getItem(KEY);
  } catch (err) {
    console.warn("[onboardingService] storage read failed:", err?.message || err);
    return null;
  }
};

export const hasSeenOnboarding = async () => {
  const v = await getFlag();
  return v === "true";
};

export const markOnboardingSeen = async () => {
  await setFlag("true");
};

export const resetOnboarding = async () => {
  await setFlag(null);
};

export default { hasSeenOnboarding, markOnboardingSeen, resetOnboarding };