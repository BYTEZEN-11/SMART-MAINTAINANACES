

const admin = require("firebase-admin");
const User = require("../models/User");

let firebaseInitialized = false;

const initializeFirebase = () => {
  if (admin.apps.length > 0) {
    firebaseInitialized = true;
    return;
  }
  try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      firebaseInitialized = true;
      console.log("Firebase Admin initialized for push notifications");
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT not set — push notifications disabled");
    }
  } catch (e) {
    if (e && /already exists/i.test(e.message)) {
      firebaseInitialized = true;
      return;
    }
    console.error("Firebase init error:", e.message);
  }
};

initializeFirebase();

const sendToToken = async (token, payload) => {
  if (!firebaseInitialized || !token) return null;
  try {
    const messageId = await admin.messaging().send({
      token,
      notification: {
        title: payload.title || "AI Home Maintenance",
        body: payload.body || "",
      },
      data: payload.data
        ? Object.fromEntries(Object.entries(payload.data).map(([k, v]) => [k, String(v)]))
        : undefined,
      android: { priority: "high" },
    });
    return messageId;
  } catch (e) {
    console.error("sendToToken failed:", e.message);
    return null;
  }
};

const sendToUser = async (userId, payload) => {
  if (!firebaseInitialized) return null;
  try {
    const user = await User.findById(userId).select("fcmTokens").lean();
    if (!user || !Array.isArray(user.fcmTokens) || user.fcmTokens.length === 0) {
      return null;
    }
    const ids = [];
    for (const t of user.fcmTokens) {
      
      const id = await sendToToken(t, payload);
      if (id) ids.push(id);
    }
    return ids;
  } catch (e) {
    console.error("sendToUser failed:", e.message);
    return null;
  }
};

const registerToken = async (userId, token) => {
  if (!token) return;
  await User.updateOne(
    { _id: userId },
    { $addToSet: { fcmTokens: token } }
  );
};

const unregisterToken = async (userId, token) => {
  if (!token) return;
  await User.updateOne(
    { _id: userId },
    { $pull: { fcmTokens: token } }
  );
};

module.exports = {
  initializeFirebase,
  sendToToken,
  sendToUser,
  registerToken,
  unregisterToken,
};
