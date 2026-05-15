import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { Platform } from "react-native";

const NetworkContext = createContext({
  isOnline: true,
  lastChecked: null,
  refresh: () => {},
});

let _expoNetwork = null;
try {
  
  _expoNetwork = require("expo-network");
} catch (e) {
  _expoNetwork = null;
}

const checkOnlineNative = async () => {
  if (!_expoNetwork || !_expoNetwork.getNetworkStateAsync) return true;
  try {
    const state = await _expoNetwork.getNetworkStateAsync();

if (state.isInternetReachable === false) return false;
    if (state.isConnected === false) return false;
    return true;
  } catch (e) {
    return true; 
  }
};

const checkOnlineWeb = () => {
  if (typeof navigator === "undefined" || typeof navigator.onLine !== "boolean") {
    return true;
  }
  return navigator.onLine;
};

export function NetworkProvider({ children, pingIntervalMs = 30000 }) {
  const [isOnline, setIsOnline] = useState(true);
  const [lastChecked, setLastChecked] = useState(null);

  const refresh = useCallback(async () => {
    let online = true;
    if (Platform.OS === "web") {
      online = checkOnlineWeb();
    } else {
      online = await checkOnlineNative();
    }
    setIsOnline(online);
    setLastChecked(new Date().toISOString());
    return online;
  }, []);

  useEffect(() => {
    
    refresh();

if (Platform.OS === "web" && typeof window !== "undefined") {
      const handleOnline = () => setIsOnline(true);
      const handleOffline = () => setIsOnline(false);
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }

const interval = setInterval(refresh, pingIntervalMs);
    return () => clearInterval(interval);
  }, [refresh, pingIntervalMs]);

  return (
    <NetworkContext.Provider value={{ isOnline, lastChecked, refresh }}>
      {children}
    </NetworkContext.Provider>
  );
}

export const useNetwork = () => useContext(NetworkContext);

export const useOnlineEffect = (effect, deps = []) => {
  const { isOnline } = useNetwork();
  
  useEffect(() => {
    if (isOnline) effect();
  }, [isOnline, ...deps]);
};

export default NetworkContext;
