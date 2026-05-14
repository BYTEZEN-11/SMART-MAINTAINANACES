import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/firebase";
import {
  setApiToken,
  loadTokenFromStorage,
  persistApiToken,
  onUnauthorised,
} from "../services/api";

const apiProbe = require("../services/api").default;

import {
  hasSeenOnboarding,
  markOnboardingSeen,
} from "../services/onboardingService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [onboardingSeen, setOnboardingSeen] = useState(false);
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

(async () => {
      try {
        const seen = await hasSeenOnboarding();
        if (isMounted) setOnboardingSeen(seen);
      } catch (err) {
        console.warn("[AuthContext] onboarding flag read failed:", err?.message || err);
      } finally {
        if (isMounted) setOnboardingChecked(true);
      }
    })();

let tokenLoaded = false;
    let firebaseResolved = false;
    const maybeFinishLoading = () => {
      if (isMounted && tokenLoaded && firebaseResolved) setLoading(false);
    };

    (async () => {
      try {
        const t = await loadTokenFromStorage();
        if (isMounted && t) {
          setApiToken(t);

try {
            await apiProbe.get("/api/users/me");
            if (isMounted) setToken(t);
          } catch (probeErr) {
            console.warn("[AuthContext] persisted token rejected by backend, clearing");
            await persistApiToken(null);
            if (isMounted) setToken(null);
          }
        }
      } catch (err) {
        console.error("Failed to load token:", err);
      } finally {
        tokenLoaded = true;
        maybeFinishLoading();
      }
    })();

if (!auth) {
      console.warn("Firebase auth not initialized, skipping auth listener");
      firebaseResolved = true;
      maybeFinishLoading();
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (isMounted) {
        setUser(firebaseUser);
        firebaseResolved = true;
        maybeFinishLoading();
      }
    });

const offUnauthorised = onUnauthorised(() => {
      if (isMounted) {
        console.log("[AuthContext] received unauthorised event — clearing token");
        setToken(null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
      offUnauthorised();
    };
  }, []);

  const saveToken = async (t) => {
    setToken(t);
    await persistApiToken(t); 
  };

  const clearToken = async () => {
    setToken(null);
    await persistApiToken(null); 
  };

const completeOnboarding = useCallback(async () => {
    await markOnboardingSeen();
    setOnboardingSeen(true);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user, token, loading,
        onboardingSeen, onboardingChecked,
        saveToken, clearToken, completeOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);