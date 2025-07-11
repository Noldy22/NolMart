// js/auth.js

import { auth } from './firebase-config.js';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

function setupAuthListeners() {
    const adminLoginForm = document.getElementById('adminLoginForm');
    const adminLogoutButton = document.getElementById('adminLogoutButton');

    if (adminLoginForm) {
        const adminEmailInput = document.getElementById('adminEmail');
        const adminPasswordInput = document.getElementById('adminPassword');
        const loginErrorDisplay = document.getElementById('loginError');

        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = adminEmailInput.value;
            const password = adminPasswordInput.value;
            loginErrorDisplay.textContent = '';

            try {
                // --- ADMIN REGISTRATION (ONE-TIME SETUP) ---
                // Uncomment this ONLY ONCE to create your admin user, then comment it out again.
                // console.log('Attempting to register new admin user...');
                // const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                // console.log('Admin user registered/signed in:', userCredential.user);
                // loginErrorDisplay.textContent = 'Admin user created successfully! Redirecting...';
                // window.location.href = 'admin-dashboard.html';

                // --- ADMIN LOGIN (For regular use) ---
                console.log('Attempting to sign in admin user...');
                const userCredential = await signInWithEmailAndPassword(auth, email, password);
                console.log('Admin user signed in:', userCredential.user);
                loginErrorDisplay.textContent = 'Login successful! Redirecting...';
                window.location.href = 'admin-dashboard.html';

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
                    case 'auth/email-already-in-use':
                        errorMessage = 'Email already in use. Please login instead.';
                        break;
                    case 'auth/weak-password':
                        errorMessage = 'Password should be at least 6 characters.';
                        break;
                    default:
                        errorMessage = `Error: ${error.message}`;
                }
                loginErrorDisplay.textContent = errorMessage;
            }
        });
    }

    if (adminLogoutButton) {
        adminLogoutButton.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
                await signOut(auth);
                console.log('User signed out successfully.');
                window.location.href = 'admin-login.html';
            } catch (error) {
                console.error("Logout Error:", error);
                alert("Error logging out. Please try again.");
            }
        });
    }
}

// Function to protect admin pages
function protectAdminPages() {
    const currentPath = window.location.pathname;

    const adminPages = [
        '/admin-dashboard.html',
        '/admin-add-product.html',
        '/admin-products.html'
    ];

    if (adminPages.some(page => currentPath.endsWith(page))) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                console.log("User is authenticated:", user.email);
            } else {
                console.log("No user authenticated. Redirecting to login.");
                setTimeout(() => {
                    window.location.href = 'admin-login.html';
                }, 50);
            }
        });
    }
}

// Export initialization functions
export { setupAuthListeners, protectAdminPages };