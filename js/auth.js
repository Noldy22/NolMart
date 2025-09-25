// js/auth.js

import { auth } from './firebase-config.js';
import { signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

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
                    case 'auth/invalid-credential':
                        errorMessage = 'Incorrect email or password.';
                        break;
                    case 'auth/wrong-password':
                        errorMessage = 'Incorrect email or password.';
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
            const adminContent = document.querySelector('.admin-main');
            if (user) {
                // If user is logged in, show the main content
                console.log("User is authenticated:", user.email);
                if (adminContent) {
                    adminContent.style.display = 'block';
                }
            } else {
                // If no user, redirect to login page. No timeout needed.
                console.log("No user authenticated. Redirecting to login.");
                window.location.href = 'admin-login.html';
            }
        });
    }
}

// Export initialization functions
export { setupAuthListeners, protectAdminPages };