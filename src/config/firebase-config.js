import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBND3iMQ8pM0PspqqIf0Zuoyv30hDYs2ZQ",
    authDomain: "taskmate-51b75.firebaseapp.com",
    projectId: "taskmate-51b75",
    storageBucket: "taskmate-51b75.firebasestorage.app",
    messagingSenderId: "780738205025",
    appId: "1:780738205025:web:c794be5a5394707d466120",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
