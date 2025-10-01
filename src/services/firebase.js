import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Votre configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCE0mYJ50HH2q111I3c1rFGQeS_Ejei0wA",
  authDomain: "smart-signal-navigator.firebaseapp.com",
  projectId: "smart-signal-navigator",
  storageBucket: "smart-signal-navigator.firebasestorage.app",
  messagingSenderId: "540958508799",
  appId: "1:540958508799:web:34337dab09c120ebddaeca",
  measurementId: "G-51SLD6BWKN"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;