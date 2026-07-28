import { auth } from "../services/firebase";
import api from "../services/api";

export const ensureBackendToken = async (saveToken) => {
  try {
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      throw new Error("No user logged in");
    }

console.log("Checking backend token...");

try {
      await api.get("/api/appliances");
      console.log("Token is valid");
      return true;
    } catch (error) {
      if (error.message.includes("Not authorized")) {
        console.log("Token is invalid or missing");
        return false;
      }
      throw error;
    }
  } catch (error) {
    console.error("Token check failed:", error);
    return false;
  }
};

export const needsReauth = (error) => {
  return error?.message?.includes("Not authorized") || 
         error?.message?.includes("Invalid token") ||
         error?.message?.includes("No token");
};
