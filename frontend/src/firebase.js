import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: "hireshield-app.firebaseapp.com",
  projectId: "hireshield-app",
  storageBucket: "hireshield-app.firebasestorage.app",
  messagingSenderId: "853797605554",
  appId: "1:853797605554:web:c8b43f05b7e13f6b2db9ab",
  measurementId: "G-W50JDH4962",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
