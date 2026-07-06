import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from "firebase/auth";

import { auth } from "./firebase";

export const login = async (email, password) => {
  try {
    const user = await signInWithEmailAndPassword(auth, email, password);
    return user;
  } catch (error) {
    console.log("Login Error:", error.message);
    throw error;
  }
};

export const register = async (name, email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

await updateProfile(userCredential.user, {
      displayName: name,
    });

    return userCredential;

  } catch (error) {
    console.log("Register Error:", error.message);
    throw error;
  }
};

export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.log("Reset Error:", error.message);
    throw error;
  }
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.log("Logout Error:", error.message);
    throw error;
  }
};