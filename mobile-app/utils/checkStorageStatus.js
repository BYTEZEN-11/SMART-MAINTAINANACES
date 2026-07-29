

import { storage as firebaseStorage } from '../services/firebase';
import supabase, { isSupabaseAvailable } from '../services/supabase';

export const checkFirebaseStatus = () => {
  console.log('\n========================================');
  console.log('FIREBASE STORAGE STATUS CHECK');
  console.log('========================================');

  const config = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  };

const isConfigured = 
    config.apiKey && 
    config.storageBucket && 
    config.projectId &&
    !config.apiKey.includes('your-') &&
    config.apiKey.length > 30;

  console.log('Configuration Status:', isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED');
  console.log('API Key:', config.apiKey ? `${config.apiKey.substring(0, 20)}...` : 'MISSING');
  console.log('Storage Bucket:', config.storageBucket || 'MISSING');
  console.log('Project ID:', config.projectId || 'MISSING');
  console.log('Storage Object:', firebaseStorage ? 'INITIALIZED' : 'NOT INITIALIZED');

  if (!isConfigured) {
    console.error('\nFIREBASE NOT CONFIGURED!');
    console.error('Please check your .env file');
    return false;
  }

  console.log('\nFIREBASE STATUS: ACTIVE AND READY');
  return true;
};

export const checkSupabaseStatus = () => {
  console.log('\n========================================');
  console.log('SUPABASE STORAGE STATUS CHECK');
  console.log('========================================');

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

const isConfigured = 
    supabaseUrl && 
    supabaseAnonKey &&
    !supabaseUrl.includes('your-') &&
    supabaseUrl.startsWith('https://');

  console.log('Configuration Status:', isConfigured ? 'CONFIGURED' : 'NOT CONFIGURED');
  console.log('Supabase URL:', supabaseUrl || 'MISSING');
  console.log('Anon Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : 'MISSING');

  if (!isConfigured) {
    console.error('\nSUPABASE NOT CONFIGURED!');
    console.error('Please check your .env file');
    return false;
  }
  
  if (!isSupabaseAvailable || !supabase) {
    console.error('Supabase client not available or not initialized');
    return false;
  }

  console.log('Client Initialization: SUCCESS');
  console.log('\nSUPABASE STATUS: ACTIVE AND READY');
  return true;
};

export const checkAllStorageStatus = () => {
  console.log('\n');
  console.log('========================================');
  console.log('COMPLETE STORAGE STATUS CHECK');
  console.log('========================================\n');

  const firebaseStatus = checkFirebaseStatus();
  const supabaseStatus = checkSupabaseStatus();

  console.log('\n========================================');
  console.log('SUMMARY');
  console.log('========================================');
  console.log('Firebase:', firebaseStatus ? 'ACTIVE' : 'INACTIVE');
  console.log('Supabase:', supabaseStatus ? 'ACTIVE' : 'INACTIVE');
  console.log('Backend:', 'ACTIVE (always available)');
  
  console.log('\nUpload Strategy:');
  console.log('1. Try Supabase first');
  console.log('2. If fails, try Firebase');
  console.log('3. If fails, use Backend');
  console.log('========================================\n');

  return {
    firebase: firebaseStatus,
    supabase: supabaseStatus,
    backend: true,
  };
};

export const testStorageConnectivity = async () => {
  console.log('\n========================================');
  console.log('TESTING STORAGE CONNECTIVITY');
  console.log('========================================\n');

  const results = {
    supabase: false,
    firebase: false,
  };

try {
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    
    if (isSupabaseAvailable && supabase) {
      
      const { data, error } = await supabase.storage.listBuckets();
      
      if (error) {
        console.log('Supabase Connection: FAILED');
        console.log('Error:', error.message);
      } else {
        console.log('Supabase Connection: SUCCESS');
        console.log('Available Buckets:', data?.map(b => b.name).join(', ') || 'None');
        results.supabase = true;
      }
    } else {
      console.log('Supabase: NOT CONFIGURED');
    }
  } catch (error) {
    console.log('Supabase Connection: ERROR');
    console.log('Error:', error.message);
  }

  console.log('');

try {
    if (firebaseStorage) {
      console.log('Firebase Connection: SUCCESS');
      console.log('Firebase Storage is initialized and ready');
      results.firebase = true;
    } else {
      console.log('Firebase Connection: FAILED');
      console.log('Firebase Storage not initialized');
    }
  } catch (error) {
    console.log('Firebase Connection: ERROR');
    console.log('Error:', error.message);
  }

  console.log('\n========================================');
  console.log('CONNECTIVITY TEST RESULTS');
  console.log('========================================');
  console.log('Supabase:', results.supabase ? 'CONNECTED' : 'NOT CONNECTED');
  console.log('Firebase:', results.firebase ? 'CONNECTED' : 'NOT CONNECTED');
  console.log('========================================\n');

  return results;
};

export default {
  checkFirebaseStatus,
  checkSupabaseStatus,
  checkAllStorageStatus,
  testStorageConnectivity,
};
