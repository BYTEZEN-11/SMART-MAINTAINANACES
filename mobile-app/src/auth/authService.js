

import { auth } from '../../services/firebase';
import api from '../api/httpClient';
import { persistApiToken } from '../api/httpClient';

export const getFirebaseIdToken = async (user, forceRefresh = false) => {
  if (!user) throw new Error('getFirebaseIdToken: no user');
  if (typeof user.getIdToken !== 'function') {
    throw new Error('getFirebaseIdToken: user is not a Firebase user');
  }
  return user.getIdToken(forceRefresh);
};

export const syncAccount = async (user, name) => {
  if (!user) throw new Error('syncAccount: no user');
  const firebaseToken = await getFirebaseIdToken(user,  true);
  const res = await api.post('/auth/sync', {
    firebaseToken,
    name: name || user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
  });
  const token = res?.data?.data?.token;
  if (!token) {
    throw new Error('syncAccount: server did not return a token');
  }
  await persistApiToken(token);
  return { token };
};

export const registerFcmToken = async (token) => {
  if (!token || typeof token !== 'string') return;
  try {
    await api.put('/users/me/fcm-token', { token });
  } catch (err) {
    
    console.warn('[auth] registerFcmToken failed:', err.message);
  }
};

export const clearFcmToken = async () => {
  try {
    await api.delete('/users/me/fcm-token');
  } catch (_) {  }
};