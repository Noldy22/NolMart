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

    // Setup UI related elements (navigation highlighting, mobile nav)
    highlightActiveNav();
    setupMobileNavigation();

    // IMPORTANT: initCarousel is now primarily called when dynamic content is loaded.
    // The previous direct call here might cause issues if carousel content isn't ready.
    // If you have a static carousel on other pages, you might keep a call specific to those.
    // initCarousel(); // Commented out to rely on custom event for dynamic carousel content
});

// Listen for the custom event dispatched by public-products.js
// This ensures initCarousel runs AFTER products are loaded into the carousel
document.addEventListener('carouselContentLoaded', () => {
    console.log("Carousel content loaded event received. Initializing/Re-initializing carousel.");
    initCarousel(); // Call your carousel initialization function from ui.js
});


// Global resize listener to re-initialize carousel based on screen size
// This should still work as initCarousel should re-evaluate the DOM elements.
window.addEventListener('resize', () => {
    // Assuming resizeTimeoutCarousel is accessible (e.g., defined in ui.js or main.js scope)
    // If it's not defined, you might get a ReferenceError.
    // You might need to declare `let resizeTimeoutCarousel;` at the top of this file.
    if (typeof resizeTimeoutCarousel !== 'undefined') {
        clearTimeout(resizeTimeoutCarousel);
        resizeTimeoutCarousel = setTimeout(() => {
            console.log("Window resized. Re-initializing carousel.");
            initCarousel();
        }, 250); // Debounce resize event
    } else {
        // If resizeTimeoutCarousel is not defined, just call initCarousel directly
        // or define resizeTimeoutCarousel at the top of main.js
        console.log("Window resized. Re-initializing carousel (no debounce timer).");
        initCarousel();
    }
});