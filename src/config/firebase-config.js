// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyBXBgfxej1J5VicupXAibU83suHbWGg358",
    authDomain: "taskmate-76496.firebaseapp.com",
    projectId: "taskmate-76496",
    storageBucket: "taskmate-76496.firebasestorage.app",
    messagingSenderId: "518064740064",
    appId: "1:518064740064:web:965afeb9c71077ba4f6285",
    measurementId: "G-2NECEDKP0R"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
let analytics;

// getAnalytics is only supported in web environments, so we add a basic try/catch or conditional check for it
try {
    analytics = getAnalytics(app);
} catch (e) {
    console.log("Analytics could not be initialized (likely running in non-web environment)");
}

export { app, analytics };
