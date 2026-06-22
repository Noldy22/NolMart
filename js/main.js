// js/main.js

import { highlightActiveNav, initSwiperCarousel, setupMobileNavigation } from './ui.js';
import { getCartTotalQuantity, getCart } from './cart.js';
import { renderFloatingCart } from './cart-page.js';
import { attachSearchEventListeners } from './public-products.js';

console.log("main.js loaded!");

/**
 * Updates the number displayed in the cart icon in the navigation bar.
 */
function updateCartIconCount() {
    const cartCountSpan = document.querySelector('.main-nav .cart-count');
    if (cartCountSpan) {
        const totalItems = getCartTotalQuantity();
        cartCountSpan.textContent = totalItems.toString();
    }
}

function adjustBodyPadding() {
    const header = document.querySelector('.main-header');
}

// Execute all setup functions when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Adjust body padding to account for fixed header
    adjustBodyPadding();

    // Setup UI related elements (navigation highlighting, mobile nav)
    highlightActiveNav();
    setupMobileNavigation();

    // Initial update of cart icon count when the page loads
    updateCartIconCount();

    // Attach cart overlay event listeners
    const openCartBtn = document.getElementById('openCartBtn');
    const closeCartBtn = document.getElementById('closeCartBtn');
    const cartOverlay = document.getElementById('cartOverlay');

    if (openCartBtn && closeCartBtn && cartOverlay) {
        openCartBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            cartOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling background

            renderFloatingCart();
        });

        closeCartBtn.addEventListener('click', () => {
            cartOverlay.classList.remove('active');
            document.body.style.overflow = ''; // Restore scrolling
        });

        // Close overlay if clicking outside content (on the overlay itself)
        cartOverlay.addEventListener('click', (e) => {
            if (e.target === cartOverlay) {
                cartOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }

    // Attach search overlay event listeners
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

    // Attach product search event listener (for typing in the search box)
    attachSearchEventListeners();
});

// Listen for the custom event dispatched by public-products.js
// This ensures initSwiperCarousel runs AFTER products are loaded into the carousel
document.addEventListener('carouselContentLoaded', () => {
    console.log("Carousel content loaded event received. Initializing Swiper carousel.");
    initSwiperCarousel();
});

// Listen for the custom 'cartUpdated' event to update the cart icon count
window.addEventListener('cartUpdated', () => {
    console.log("Cart updated event received in main.js. Updating cart icon count.");
    updateCartIconCount();
});