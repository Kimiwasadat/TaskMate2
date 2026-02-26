import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// The firebaseConfig object contains the API keys and endpoints needed for TaskMate.
// In a true production app, we would put these in a .env file, but since Expo Web
// exposes them to the client anyway, and Firebase security rules are what actually
// protect the data, this is safe for our development and testing.
const firebaseConfig = {
  apiKey: "AIzaSyBXBgfxej1J5VicupXAibU83suHbWGg358",
  authDomain: "taskmate-76496.firebaseapp.com",
  projectId: "taskmate-76496",
  storageBucket: "taskmate-76496.firebasestorage.app",
  messagingSenderId: "518064740064",
  appId: "1:518064740064:web:965afeb9c71077ba4f6285",
  measurementId: "G-2NECEDKP0R",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (Database)
export const db = getFirestore(app);

// Initialize Firebase Storage (For media like photos/videos)
export const storage = getStorage(app);

export default app;
