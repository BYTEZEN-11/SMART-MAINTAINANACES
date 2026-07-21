import { Platform } from 'react-native';

let supabase = null;
let isSupabaseAvailable = false;

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = 
  supabaseUrl && 
  supabaseAnonKey &&
  !supabaseUrl.includes('your-') && 
  !supabaseAnonKey.includes('your-') &&
  supabaseUrl.startsWith('https://');

try {
  if (Platform && Platform.OS && Platform.OS !== 'web') {
    console.warn('Running on native platform - skipping Supabase initialization. Use backend/Firebase fallback instead.');
    isSupabaseAvailable = false;
  } else if (!isConfigured) {
    console.warn('Supabase not properly configured - using fallback storage');
  } else {
    
    let createClient = null;
    try {

const supabaseModule = require('@supabase/supabase-js');
      createClient = supabaseModule?.createClient || supabaseModule?.default?.createClient;
    } catch (e) {
      console.error('Failed to require @supabase/supabase-js:', e?.message || e);
    }

    if (!createClient) {
      console.error('Supabase createClient not available');
      isSupabaseAvailable = false;
    } else {
      supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: false, 
        },
      });
      isSupabaseAvailable = true;
      console.log('Supabase initialized successfully');
    }
  }
} catch (error) {
  console.warn('Supabase initialization failed:', error?.message || error);
  console.warn('App will use fallback storage (Firebase/Backend)');
  supabase = null;
  isSupabaseAvailable = false;
}

export const uploadToSupabase = async (uri, bucket = 'appliance-images', fileName = null) => {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized. Check your configuration.');
    }

    if (!uri) {
      throw new Error('No file URI provided');
    }

    console.log('Uploading to Supabase Storage...');

const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const finalFileName = fileName || `upload-${timestamp}-${randomId}.jpg`;
    const filePath = `uploads/${finalFileName}`;

    console.log('File path:', filePath);
    console.log('Bucket:', bucket);

let blob;
    try {
      const response = await fetch(uri);
      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status}`);
      }
      blob = await response.blob();
      console.log('Blob created:', blob.type, blob.size, 'bytes');
    } catch (fetchError) {
      console.error('Fetch error:', fetchError.message);
      throw new Error(`Failed to read file: ${fetchError.message}`);
    }

console.log('Uploading to Supabase...');
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, blob, {
        contentType: blob.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false, 
      });

    if (error) {
      console.error('Supabase upload error:', error);

if (error.message?.includes('Bucket not found')) {
        throw new Error('Supabase bucket "appliance-images" does not exist. Please create it in Supabase dashboard.');
      } else if (error.message?.includes('not allowed')) {
        throw new Error('Supabase storage access denied. Check bucket permissions.');
      } else if (error.message?.includes('Network')) {
        throw new Error('Network error connecting to Supabase. Check internet connection.');
      }
      
      throw new Error(`Supabase upload failed: ${error.message}`);
    }

    console.log('Upload successful, getting public URL...');

const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error('Failed to get public URL from Supabase');
    }

    console.log('Public URL:', publicUrlData.publicUrl);
    return publicUrlData.publicUrl;

  } catch (error) {
    console.error('Upload to Supabase failed:', error.message);
    throw error;
  }
};

export const deleteFromSupabase = async (fileUrl, bucket = 'appliance-images') => {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

const urlParts = fileUrl.split(`${bucket}/`);
    if (urlParts.length < 2) {
      throw new Error('Invalid file URL format');
    }
    const filePath = urlParts[1];

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Delete error:', error);
      return false;
    }

    console.log('File deleted successfully');
    return true;

  } catch (error) {
    console.error('Delete from Supabase failed:', error.message);
    return false;
  }
};

export const listSupabaseFiles = async (bucket = 'appliance-images', folder = 'uploads') => {
  try {
    if (!supabase) {
      throw new Error('Supabase not initialized');
    }

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'created_at', order: 'desc' },
      });

    if (error) {
      console.error('List files error:', error);
      return [];
    }

    return data || [];

  } catch (error) {
    console.error('List files failed:', error.message);
    return [];
  }
};

export { supabase, isSupabaseAvailable };
export default supabase;
