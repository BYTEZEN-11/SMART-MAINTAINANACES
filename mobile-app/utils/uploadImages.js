import { uploadFile } from "../services/storageService";

export const uploadImage = async (uri) => {
  try {
    const url = await uploadFile(uri, "image.jpg");
    return url;
  } catch (err) {
    console.log("Upload Error:", err.message);
    return null;
  }
};
