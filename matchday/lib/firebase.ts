import { initializeApp, getApps, getApp } from "firebase/app"
import { getAuth } from "firebase/auth"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

// Check if we're in a browser environment
const isBrowser = typeof window !== "undefined"

// Default configuration for development/demo purposes
// In production, these should be replaced with your actual Firebase config
const defaultConfig = {
  apiKey: "demo-api-key",
  authDomain: "demo-project.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456",
}

// Use environment variables if available, otherwise use default config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || defaultConfig.apiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultConfig.authDomain,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || defaultConfig.projectId,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultConfig.storageBucket,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultConfig.messagingSenderId,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || defaultConfig.appId,
}

// Check if Firebase is already initialized
let app
let auth
let db
let storage

if (isBrowser) {
  try {
    // Initialize Firebase only in browser environment
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp()
    auth = getAuth(app)
    db = getFirestore(app)
    storage = getStorage(app)
  } catch (error) {
    console.error("Firebase initialization error:", error)

    // Create mock services for demo purposes if Firebase initialization fails
    auth = {
      onAuthStateChanged: (callback) => {
        // Simulate a logged-in user for demo purposes
        callback({ uid: "demo-user-id", email: "demo@example.com" })
        return () => {} // Return unsubscribe function
      },
      signInWithEmailAndPassword: async () => {
        return { user: { uid: "demo-user-id", email: "demo@example.com" } }
      },
      signOut: async () => {},
    }

    // Mock Firestore for demo
    db = {
      collection: () => ({
        addDoc: async () => ({ id: "demo-doc-id" }),
        getDocs: async () => ({ forEach: () => {} }),
      }),
    }
  }
} else {
  // Server-side placeholder
  auth = {} as any
  db = {} as any
  storage = {} as any
}

export { app, auth, db, storage }

