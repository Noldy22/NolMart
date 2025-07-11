// js/main.js

import { setupAuthListeners, protectAdminPages } from './auth.js';
import { highlightActiveNav, initCarousel, setupMobileNavigation } from './ui.js'; // Import the new function

console.log("main.js loaded!");

// Execute all setup functions when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup Authentication related listeners (login form, logout button)
    setupAuthListeners();

    // Protect admin pages by checking auth state
    protectAdminPages();

    // Setup UI related elements (navigation highlighting, carousel)
    highlightActiveNav();
    initCarousel(); // Initialize carousel based on screen size

    // Setup mobile navigation (hamburger menu)
    setupMobileNavigation();
});

// Global resize listener to re-initialize carousel based on screen size
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeoutCarousel); // Make sure resizeTimeoutCarousel is accessible if declared globally in ui.js
                                        // or pass it via the instance. For simplicity, we assume it's accessible.
    resizeTimeoutCarousel = setTimeout(() => {
        console.log("Window resized. Re-initializing carousel.");
        initCarousel();
    }, 250); // Debounce resize event
});