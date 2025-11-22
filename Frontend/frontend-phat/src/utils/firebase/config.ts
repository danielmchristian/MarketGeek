// Firebase configuration
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCm3GPjMwdCdIqe17pFJJD8wOR4v_srWhM",
  authDomain: "marketgeek-f69ba.firebaseapp.com",
  projectId: "marketgeek-f69ba",
  storageBucket: "marketgeek-f69ba.firebasestorage.app",
  messagingSenderId: "1052565875000",
  appId: "1:1052565875000:web:fffd25236fa54721a8b9cd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Set auth persistence to local storage
setPersistence(auth, browserLocalPersistence).catch((error) => {
  console.warn('Failed to set Firebase auth persistence:', error);
});

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;
