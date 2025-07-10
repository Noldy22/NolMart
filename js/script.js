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
            // You should have already used this to create your first admin user.
            // For security, keep this commented out or removed in your deployed code.
            // If you uncomment, make sure to comment out the signInWithEmailAndPassword below it.

            /*
            console.log('Attempting to register new admin user...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Admin user registered/signed in:', userCredential.user);
            loginErrorDisplay.textContent = 'Admin user created successfully! Redirecting...';
            window.location.href = 'admin-dashboard.html'; // Redirect to dashboard
            */

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
                case 'auth/email-already-in-use': // Relevant if createUserWithEmailAndPassword was uncommented
                    errorMessage = 'Email already in use. Please login instead.';
                    break;
                case 'auth/weak-password': // Relevant if createUserWithEmailAndPassword was uncommented
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
    // Using endsWith to handle cases where the base path might vary (e.g., /nolmart/admin-dashboard.html on GitHub Pages)
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
                // A small delay can help if there's a race condition or just to make console output visible
                setTimeout(() => {
                    window.location.href = 'admin-login.html';
                }, 50); // Small delay of 50ms
            }
        });
    }
}

// Call this protection function when the DOM is loaded
// This should ideally run early to prevent rendering protected content to unauthenticated users.
document.addEventListener('DOMContentLoaded', protectAdminPage);


// --- GENERAL SITE FUNCTIONALITY (e.g., Navigation highlighting) ---

// Function to highlight the active navigation link
function highlightActiveNav() {
    // Select all nav links that are part of the main/admin navigation
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    // Get the current path from the URL, normalizing for potential GitHub Pages subdirectories
    // Example: /NolMart/index.html instead of just /index.html
    const currentPathname = window.location.pathname;
    const pathSegments = currentPathname.split('/').filter(segment => segment !== ''); // Split and remove empty segments
    const currentPageFile = pathSegments[pathSegments.length - 1]; // Get the last segment (e.g., index.html)

    navLinks.forEach(link => {
        // Remove 'active' class from all links first to ensure only one is active
        link.classList.remove('active');

        // Exclude the logout button from being "active" as it's an action, not a page
        if (link.id === 'adminLogoutButton') {
            return; // Skip this link for active highlighting
        }

        // Get the link's target file name
        const linkPathname = new URL(link.href).pathname;
        const linkFile = linkPathname.split('/').filter(segment => segment !== '').pop(); // Get last segment

        // Compare the current page file with the link's file
        if (currentPageFile === linkFile) {
            link.classList.add('active');
        }
        // Special handling for the root path (e.g., if index.html is loaded when path is just '/')
        else if (currentPathname === '/' && linkFile === 'index.html') {
            link.classList.add('active');
        }
        // Special handling for 'Products' link, if the current page is a product detail page
        // (Assuming product-detail.html might highlight products.html)
        else if (linkFile === 'products.html' && currentPageFile === 'product-detail.html') {
            link.classList.add('active');
        }
        // Additional handling for admin pages if they don't exactly match the root file name
        // (e.g., if /NolMart/admin-dashboard.html needs to match admin-dashboard.html link)
        // This check is a bit redundant with the exact match above, but provides robustness.
        else if (linkFile && currentPathname.includes(linkFile)) {
             // This can sometimes highlight too broadly, stick to exact match or specific conditions if issues arise.
             // For now, the direct `currentPageFile === linkFile` should be sufficient for explicit page links.
        }
    });
}

// Call the function when the DOM is fully loaded, after protection logic.
document.addEventListener('DOMContentLoaded', highlightActiveNav);