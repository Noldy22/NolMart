// js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
// Add other Firebase SDKs here as you need them (e.g., Firestore, Storage)
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"; // <-- UNCOMMENTED THIS
import { getStorage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";   // <-- UNCOMMENTED THIS

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAQNnErlcKE8JRIHIra5eB_Axspy3pEoqA",
    authDomain: "nolmart-ed090.firebaseapp.com",
    projectId: "nolmart-ed090",
    storageBucket: "nolmart-ed090.firebasestorage.app",
    messagingSenderId: "511177507325",
    appId: "1:511177507325:web:7238c7599c9f760c8ed994",
    measurementId: "G-WTRHEVHYRW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Keep analytics if you need it
const auth = getAuth(app);
const db = getFirestore(app); // <-- INITIALIZED FIRESTORE (using 'db' for consistency)
const storage = getStorage(app); // <-- INITIALIZED STORAGE

console.log("Firebase config loaded.");

// Export auth, db, and storage so they can be imported and used in other modules
export { app, auth, analytics, db, storage }; // <-- EXPORTED db and storage