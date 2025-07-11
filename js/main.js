// js/main.js

import { setupAuthListeners, protectAdminPages } from './auth.js';
import { highlightActiveNav, initCarousel } from './ui.js';

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
});

// Re-initialize carousel on window resize (handled in ui.js, but the event listener is global)
// window.addEventListener('resize', initCarousel); // This is already debounced inside initCarousel logic via initCarousel in ui.js.
// No, the resize event listener is in ui.js itself, which calls initCarousel.
// The resize listener here is NOT needed as it's part of ui.js logic.