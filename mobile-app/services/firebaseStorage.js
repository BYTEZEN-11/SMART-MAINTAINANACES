import { ref, uploadBytes, getDownloadURL, deleteObject, getMetadata } from 'firebase/storage';
import { storage } from './firebase';

export const uploadToFirebase = async (uri, folder = 'appliance-images', fileName = null) => {
  try {
    if (!storage) {
      throw new Error('Firebase Storage not initialized. Check your configuration.');
    }

    if (!uri) {
      throw new Error('No file URI provided');
    }

    console.log(' Uploading to Firebase Storage...');

const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const finalFileName = fileName || `upload-${timestamp}-${randomId}.jpg`;
    const filePath = `${folder}/${finalFileName}`;

    console.log(' File path:', filePath);

const storageRef = ref(storage, filePath);

let blob;
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      blob = await response.blob();
      console.log(' Blob created:', blob.type, blob.size, 'bytes');
    } catch (fetchError) {
      console.error(' Fetch error:', fetchError.message);
      throw new Error(`Failed to read file: ${fetchError.message}`);
    }

console.log(' Uploading to Firebase...');
    const snapshot = await uploadBytes(storageRef, blob, {
      contentType: blob.type || 'image/jpeg',
      customMetadata: {
        uploadedAt: new Date().toISOString(),
      },
    });

    console.log(' Upload successful, getting download URL...');

const downloadURL = await getDownloadURL(snapshot.ref);

    console.log(' Download URL:', downloadURL);
    return downloadURL;

  } catch (error) {
    console.error(' Firebase upload failed:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);

if (error.code === 'storage/unauthorized') {
      throw new Error('Firebase Storage: Unauthorized. Check Firebase Storage Rules.');
    } else if (error.code === 'storage/canceled') {
      throw new Error('Firebase Storage: Upload canceled.');
    } else if (error.code === 'storage/unknown') {
      throw new Error('Firebase Storage: Unknown error. Check Firebase configuration and storage rules.');
    } else if (error.message?.includes('Network')) {
      throw new Error('Network error connecting to Firebase. Check internet connection.');
    }
    
    throw error;
  }
};

export const deleteFromFirebase = async (fileUrl) => {
  try {
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

const urlParts = fileUrl.split('/o/');
    if (urlParts.length < 2) {
      throw new Error('Invalid Firebase Storage URL format');
    }
    
    const pathWithToken = urlParts[1].split('?')[0];
    const filePath = decodeURIComponent(pathWithToken);

const fileRef = ref(storage, filePath);
    await deleteObject(fileRef);

    console.log(' File deleted from Firebase successfully');
    return true;

  } catch (error) {
    console.error(' Delete from Firebase failed:', error.message);
    return false;
  }
};

export const getFirebaseFileMetadata = async (filePath) => {
  try {
    if (!storage) {
      throw new Error('Firebase Storage not initialized');
    }

    const fileRef = ref(storage, filePath);
    const metadata = await getMetadata(fileRef);

    return {
      name: metadata.name,
      size: metadata.size,
      contentType: metadata.contentType,
      timeCreated: metadata.timeCreated,
      updated: metadata.updated,
    };

  } catch (error) {
    console.error(' Get metadata failed:', error.message);
    return null;
  }
};

export default { uploadToFirebase, deleteFromFirebase, getFirebaseFileMetadata };
