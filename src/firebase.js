// src/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { initializeFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDGdXU-o1VOTWzxZhUSCcrNwLIqkxz_aJg",
  authDomain: "ismartlab-9da7e.firebaseapp.com",
  projectId: "ismartlab-9da7e",
  storageBucket: "ismartlab-9da7e.firebasestorage.app",
  messagingSenderId: "706217419963",
  appId: "1:706217419963:web:63821ee3fcbe6a8070b59e",
  measurementId: "G-Z4W2QEGGC9"
};

// Guard to avoid duplicate default app
const app = getApps().length ? getApp() : initializeApp(firebaseConfig); // <-- key line

// Only run analytics in browser
if (typeof window !== "undefined") {
  try { getAnalytics(app); } catch {}
}

// Firestore (keep your custom options if needed)
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
// Alternative (no special transport settings):
// export const db = getFirestore(app);

export const auth = getAuth(app);
export const realtimeDB = getDatabase(app);
export default app;
