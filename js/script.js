// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
// Import Firebase Authentication SDKs
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
// TODO: We will also need Firestore and Storage later. Add them as we go:
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
const analytics = getAnalytics(app); // Initialize analytics if needed
const auth = getAuth(app); // Get the Auth instance


console.log("script.js is loaded!");

// --- ADMIN AUTHENTICATION LOGIC ---
const adminLoginForm = document.getElementById('adminLoginForm');
const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const loginErrorDisplay = document.getElementById('loginError');
const adminLogoutButton = document.getElementById('adminLogoutButton'); // Get logout button

if (adminLoginForm) { // This block only executes if the admin login form exists on the page
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        const email = adminEmailInput.value;
        const password = adminPasswordInput.value;
        loginErrorDisplay.textContent = ''; // Clear previous errors

        try {
            // --- ADMIN REGISTRATION (ONE-TIME SETUP) ---
            // IMPORTANT: This part is for initial admin creation.
            // You will remove or comment this out AFTER you've created your first admin user.
            // For security, you should NOT allow arbitrary user creation on a public admin login.
            // You can either create yourself via Firebase Console, or run this once.
            // If you already have an account for this email in Firebase Auth, it will just sign in.

            
            console.log('Attempting to register new admin user...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Admin user registered/signed in:', userCredential.user);
            loginErrorDisplay.textContent = 'Admin user created successfully! Redirecting...';
            window.location.href = 'admin-dashboard.html'; // Redirect to dashboard
            

            // --- ADMIN LOGIN ---
            // Use this for regular login attempts after initial user creation
            console.log('Attempting to sign in admin user...');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Admin user signed in:', userCredential.user);
            loginErrorDisplay.textContent = 'Login successful! Redirecting...';
            window.location.href = 'admin-dashboard.html'; // Redirect to dashboard

        } catch (error) {
            console.error("Login/Registration Error:", error.code, error.message);
            let errorMessage = 'An unknown error occurred.';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This user account has been disabled.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect email or password.';
                    break;
                case 'auth/email-already-in-use': // If you uncomment createUserWithEmailAndPassword
                    errorMessage = 'Email already in use. Please login instead.';
                    break;
                case 'auth/weak-password': // If you uncomment createUserWithEmailAndPassword
                    errorMessage = 'Password should be at least 6 characters.';
                    break;
                default:
                    errorMessage = `Error: ${error.message}`;
            }
            loginErrorDisplay.textContent = errorMessage;
        }
    });
}

// Handle Admin Logout
if (adminLogoutButton) {
    adminLogoutButton.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent default link behavior
        try {
            await signOut(auth);
            console.log('User signed out successfully.');
            window.location.href = 'admin-login.html'; // Redirect to login page after logout
        } catch (error) {
            console.error("Logout Error:", error);
            alert("Error logging out. Please try again.");
        }
    });
}

// --- ADMIN PAGE PROTECTION ---
// This function checks the auth state and redirects if necessary
function protectAdminPage() {
    const currentPath = window.location.pathname;

    // List of admin-only pages
    const adminPages = [
        '/admin-dashboard.html',
        '/admin-add-product.html', // Will be created later
        '/admin-products.html'    // Will be created later
    ];

    // Check if the current page is an admin page AND not the login page
    if (adminPages.some(page => currentPath.endsWith(page))) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in. Allow access.
                console.log("User is authenticated:", user.email);
                // No action needed, page can load
            } else {
                // User is signed out. Redirect to login page.
                console.log("No user authenticated. Redirecting to login.");
                // Use a short delay to ensure console.log runs before redirect
                setTimeout(() => {
                    window.location.href = 'admin-login.html';
                }, 100);
            }
        });
    }
}

// Call this protection function when the DOM is loaded
// Make sure this is called before highlightActiveNav if highlightActiveNav also relies on auth state later
document.addEventListener('DOMContentLoaded', protectAdminPage);


// --- GENERAL SITE FUNCTIONALITY (e.g., Navigation highlighting) ---

// Function to highlight the active navigation link
function highlightActiveNav() {
    // Select all nav links, for both main and admin navs
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const currentPath = window.location.pathname;

    navLinks.forEach(link => {
        // Remove 'active' class from all links first
        link.classList.remove('active');

        // Exclude the logout button from being "active"
        if (link.id === 'adminLogoutButton') {
            return; // Skip this link, it's not a page to be "active"
        }

        const linkPath = new URL(link.href).pathname;

        // Determine if the current page path matches the link's path
        if (currentPath === linkPath) {
            link.classList.add('active');
        }
        // Special handling for 'Products' link, if the current page is a product detail page
        else if (linkPath.includes('products.html') && currentPath.includes('product-detail.html')) {
            link.classList.add('active');
        }
        // If we're on the root path and the link is for index.html (common for home)
        else if (currentPath === '/' && linkPath.includes('index.html')) {
            link.classList.add('active');
        }
        // Specific checks for admin pages (ensure exact match for active state)
        // Checks if current path ends with the link's path to handle pages like admin-dashboard.html
        else if (currentPath.endsWith('admin-dashboard.html') && linkPath.endsWith('admin-dashboard.html')) {
            link.classList.add('active');
        }
        else if (currentPath.endsWith('admin-add-product.html') && linkPath.endsWith('admin-add-product.html')) {
            link.classList.add('active');
        }
        else if (currentPath.endsWith('admin-products.html') && linkPath.endsWith('admin-products.html')) {
            link.classList.add('active');
        }
    });
}

// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', highlightActiveNav);