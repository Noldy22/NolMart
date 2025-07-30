// js/main.js

import { setupAuthListeners, protectAdminPages } from './auth.js';
import { highlightActiveNav, initCarousel, setupMobileNavigation } from './ui.js';
import { getCartTotalQuantity } from './cart.js';
import { attachSearchEventListeners } from './public-products.js'; // NEW: Import search functionality

console.log("main.js loaded!");

/**
 * Updates the number displayed in the cart icon in the navigation bar.
 */
function updateCartIconCount() {
    const cartCountSpan = document.querySelector('.main-nav .cart-count');
    if (cartCountSpan) {
        const totalItems = getCartTotalQuantity();
        cartCountSpan.textContent = totalItems.toString();
        // Optional: Add a class for visual feedback when items are added (e.g., a bounce animation)
        // cartCountSpan.classList.add('added');
        // setTimeout(() => {
        //   cartCountSpan.classList.remove('added');
        // }, 500);
    }
}

// Execute all setup functions when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup Authentication related listeners (login form, logout button)
    setupAuthListeners();

    // Protect admin pages by checking auth state
    protectAdminPages();

    // Setup UI related elements (navigation highlighting, mobile nav)
    highlightActiveNav();
    setupMobileNavigation();

    // Initial update of cart icon count when the page loads
    updateCartIconCount();

    // IMPORTANT: initCarousel is now primarily called when dynamic content is loaded.
    // The previous direct call here might cause issues if carousel content isn't ready.
    // If you have a static carousel on other pages, you might keep a call specific to those.
    // initCarousel(); // Commented out to rely on custom event for dynamic carousel content

    // NEW: Attach search overlay event listeners
    const openSearchBtn = document.getElementById('openSearchBtn');
    const closeSearchBtn = document.getElementById('closeSearchBtn');
    const searchOverlay = document.getElementById('searchOverlay');
    const searchInput = document.getElementById('searchInput');

    if (openSearchBtn && searchOverlay && closeSearchBtn && searchInput) {
        openSearchBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            searchOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling background
            searchInput.focus(); // Focus on the input when opened
            // Clear previous search results and messages on open
            document.getElementById('searchResultsContainer').innerHTML = '<p class="search-initial-message">Start typing to see results...</p>';
            document.getElementById('noSearchResultsMessage').style.display = 'none';
            document.getElementById('searchErrorMessage').style.display = 'none';
            searchInput.value = ''; // Clear search input
        });

        closeSearchBtn.addEventListener('click', () => {
            searchOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        });

        // Close overlay if clicking outside content (on the overlay itself)
        searchOverlay.addEventListener('click', (e) => {
            if (e.target === searchOverlay) {
                searchOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // NEW: Attach product search event listener from public-products.js
    attachSearchEventListeners();
});

// Listen for the custom event dispatched by public-products.js
// This ensures initCarousel runs AFTER products are loaded into the carousel
document.addEventListener('carouselContentLoaded', () => {
    console.log("Carousel content loaded event received. Initializing/Re-initializing carousel.");
    initCarousel(); // Call your carousel initialization function from ui.js
});

// Listen for the custom 'cartUpdated' event to update the cart icon count
window.addEventListener('cartUpdated', () => {
    console.log("Cart updated event received in main.js. Updating cart icon count.");
    updateCartIconCount();
});


// Global resize listener to re-initialize carousel based on screen size
let resizeTimeoutCarousel;
window.addEventListener('resize', () => {
    if (typeof resizeTimeoutCarousel !== 'undefined') {
        clearTimeout(resizeTimeoutCarousel);
        resizeTimeoutCarousel = setTimeout(() => {
            console.log("Window resized. Re-initializing carousel.");
            initCarousel();
        }, 250);
    } else {
        console.log("Window resized. Re-initializing carousel (no debounce timer).");
        initCarousel();
    }
});