
import { initializeApp } from "firebase/app";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAuth, connectAuthEmulator } from "firebase/auth";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "demo-key-for-development",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "000000000000",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:000000000000:web:0000000000000000000000",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-0000000000"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Functions
const functions = getFunctions(app);

// Initialize Firebase Auth
const auth = getAuth(app);

// Connect to Firebase emulators in development mode
if (import.meta.env.DEV) {
  // Uncomment these lines when you're running Firebase emulators locally
  // connectFunctionsEmulator(functions, "localhost", 5001);
  // connectAuthEmulator(auth, "http://localhost:9099");
  console.log("Firebase initialized in development mode");
} else {
  console.log("Firebase initialized in production mode");
}

export { app, functions, auth };
