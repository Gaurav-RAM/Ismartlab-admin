// firebase.js
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore"; // <-- change this import
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

const app = initializeApp(firebaseConfig);
if (typeof window !== "undefined") getAnalytics(app);

// Choose ONE of these:
export const db = initializeFirestore(app, { experimentalForceLongPolling: true });
// export const db = initializeFirestore(app, { useFetchStreams: false });

export const auth = getAuth(app);
export const realtimeDB = getDatabase(app);
