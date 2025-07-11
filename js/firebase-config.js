// js/firebase-config.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
// Add other Firebase SDKs here as you need them (e.g., Firestore, Storage)
// import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
// import { getStorage } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

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
const analytics = getAnalytics(app);
const auth = getAuth(app);
// const firestore = getFirestore(app); // If you add Firestore
// const storage = getStorage(app); // If you add Storage

console.log("Firebase config loaded.");

export { app, auth, analytics }; // Export auth and other services as needed