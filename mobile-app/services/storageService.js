

import api from "./api";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage as firebaseStorage } from "./firebase";

const STORAGE_CONFIG = {
  ENABLE_SUPABASE: true,
  ENABLE_FIREBASE: true,
  ENABLE_BACKEND: true,
  SUPABASE_BUCKET: "images",
  FIREBASE_FOLDER: "appliance-images",
  MAX_RETRIES: 2,
  RETRY_DELAY: 1000,
  TIMEOUT: 30000,
};

const uriToUint8Array = async (uri) => {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return uint8Array;
  } catch (error) {
    console.error("URI conversion failed:", error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
};

const uriToBlob = async (uri) => {
  try {
    const response = await fetch(uri);
    if (!response.ok) {
      throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
    }
    return await response.blob();
  } catch (error) {
    console.error("URI to Blob failed:", error);
    throw new Error(`Failed to read file: ${error.message}`);
  }
};

const getFileExtension = (uri) => {
  const cleanUri = uri.split("?")[0];
  const match = cleanUri.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1].toLowerCase() : "jpg";
};

const getMimeType = (extension) => {
  const mimeTypes = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    heic: "image/heic",
    mp4: "video/mp4",
    mov: "video/quicktime",
    pdf: "application/pdf",
  };
  return mimeTypes[extension] || "application/octet-stream";
};

const generateFileName = (uri, customName = null) => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 15);
  const extension = getFileExtension(uri);

  if (customName) {
    const nameWithoutExt = customName.replace(/\.[^/.]+$/, "");
    return `${nameWithoutExt}-${timestamp}-${randomId}.${extension}`;
  }
  return `upload-${timestamp}-${randomId}.${extension}`;
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const uploadToSupabase = async (uri, fileName = null) => {
  
  let supabaseModule = null;
  try {
    
    supabaseModule = require("./supabase");
  } catch (err) {
    console.warn("Supabase module require failed:", err?.message || err);
  }
  const supabaseClient = supabaseModule?.supabase;
  const isSupabaseAvailableLocal = supabaseModule?.isSupabaseAvailable;

  const bucket = STORAGE_CONFIG.SUPABASE_BUCKET;

  for (let attempt = 1; attempt <= STORAGE_CONFIG.MAX_RETRIES; attempt++) {
    try {
      if (!isSupabaseAvailableLocal || !supabaseClient) {
        throw new Error("Supabase not initialized or not available on this platform");
      }

      const finalFileName = fileName ? generateFileName(uri, fileName) : generateFileName(uri);
      const filePath = `uploads/${finalFileName}`;
      const extension = getFileExtension(uri);
      const contentType = getMimeType(extension);

      const uint8Array = await uriToUint8Array(uri);

      const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(filePath, uint8Array, {
          contentType,
          cacheControl: "3600",
          upsert: true,
        });

      if (error) {
        const isRetryable =
          error.message?.includes("Network") ||
          error.message?.includes("timeout") ||
          error.message?.includes("ECONNRESET");

        if (isRetryable && attempt < STORAGE_CONFIG.MAX_RETRIES) {
          await sleep(STORAGE_CONFIG.RETRY_DELAY * attempt);
          continue;
        }
        throw new Error(error.message);
      }

      const { data: urlData } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(filePath);

      if (!urlData?.publicUrl) {
        throw new Error("Failed to get public URL from Supabase");
      }
      return urlData.publicUrl;
    } catch (error) {
      if (attempt === STORAGE_CONFIG.MAX_RETRIES) throw error;
      await sleep(STORAGE_CONFIG.RETRY_DELAY * attempt);
    }
  }

  throw new Error("Supabase upload failed after all retries");
};

const uploadToFirebase = async (uri, fileName = null) => {
  const folder = STORAGE_CONFIG.FIREBASE_FOLDER;

  for (let attempt = 1; attempt <= STORAGE_CONFIG.MAX_RETRIES; attempt++) {
    try {
      if (!firebaseStorage) {
        throw new Error("Firebase Storage not initialized");
      }

      const finalFileName = fileName ? generateFileName(uri, fileName) : generateFileName(uri);
      const filePath = `${folder}/${finalFileName}`;
      const extension = getFileExtension(uri);
      const contentType = getMimeType(extension);

      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status}`);
      }
      const blob = await response.blob();

      const storageRef = ref(firebaseStorage, filePath);
      const snapshot = await uploadBytes(storageRef, blob, { contentType });
      const downloadURL = await getDownloadURL(snapshot.ref);
      return downloadURL;
    } catch (error) {
      if (attempt === STORAGE_CONFIG.MAX_RETRIES) throw error;
      await sleep(STORAGE_CONFIG.RETRY_DELAY * attempt);
    }
  }

  throw new Error("Firebase upload failed after all retries");
};

const uploadToBackend = async (uri, fileName = "file.jpg") => {
  const formData = new FormData();
  formData.append("media", {
    uri,
    type: "image/jpeg",
    name: fileName,
  });

  const response = await api.post("/api/media", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    timeout: STORAGE_CONFIG.TIMEOUT,
  });

  if (response.data?.data?.fileUrl) {
    return response.data.data.fileUrl;
  }
  throw new Error("Invalid backend response");
};

export const uploadFile = async (uri, fileName = null, options = {}) => {
  const { forceBackend = false, bucket, folder } = options;

  if (!uri) {
    throw new Error("No file URI provided");
  }

  if (forceBackend) {
    return await uploadToBackend(uri, fileName);
  }

  const errors = [];

  if (STORAGE_CONFIG.ENABLE_SUPABASE) {
    try {
      return await uploadToSupabase(uri, fileName);
    } catch (error) {
      errors.push({ service: "Supabase", error: error.message });
    }
  }

  if (STORAGE_CONFIG.ENABLE_FIREBASE) {
    try {
      return await uploadToFirebase(uri, fileName);
    } catch (error) {
      errors.push({ service: "Firebase", error: error.message });
    }
  }

  if (STORAGE_CONFIG.ENABLE_BACKEND) {
    try {
      return await uploadToBackend(uri, fileName);
    } catch (error) {
      errors.push({ service: "Backend", error: error.message });
    }
  }

  throw new Error(
    `Upload failed on all services: ${errors
      .map((e) => `${e.service} (${e.error})`)
      .join("; ")}`
  );
};

export { uploadToSupabase, uploadToFirebase, uploadToBackend };
export default { uploadFile };
