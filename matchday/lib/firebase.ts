import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase configuration
const clientConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it's not already initialized
const app = getApps().length === 0 ? initializeApp(clientConfig) : getApp();

// Create a mock Firestore instance for testing
const mockDb = {
  type: 'firestore',
  app: {},
  toJSON: () => ({}),
  collection: () => ({
    type: 'collection',
    id: '',
    path: '',
    parent: null,
    withConverter: () => ({}),
    doc: () => ({})
  })
} as any;

export const db = process.env.NODE_ENV === 'test' ? mockDb : getFirestore(app);
export const storage = process.env.NODE_ENV === 'test' ? {} : getStorage(app);
