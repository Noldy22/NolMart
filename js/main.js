// js/main.js

import { highlightActiveNav, initSwiperCarousel, setupMobileNavigation } from './ui.js';
import { getCartTotalQuantity } from './cart.js';
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

/**
 * Sets up the marquee animation for the top bar if content overflows on mobile.
 */
function setupTopBarMarquee() {
    const topBarContent = document.querySelector('.top-bar-content');
    const scrollWrapper = document.querySelector('.top-bar-scroll-wrapper');

    if (topBarContent && scrollWrapper) {
        if (window.innerWidth <= 768) { // Matches the CSS mobile media query breakpoint
            // Reset animation before checking to get accurate scrollWidth
            scrollWrapper.style.animation = 'none';
            scrollWrapper.offsetWidth; // Trigger reflow
            scrollWrapper.style.animation = ''; // Reapply animation

            if (scrollWrapper.scrollWidth > topBarContent.offsetWidth) {
                // Calculate animation duration based on content width for smoother, consistent speed
                const duration = (scrollWrapper.scrollWidth / 50) + 5; // Adjust 50 for speed, 5 for base time
                scrollWrapper.style.animationDuration = `${duration}s`;
                scrollWrapper.style.animationPlayState = 'running';
            } else {
                scrollWrapper.style.animationPlayState = 'paused';
                scrollWrapper.style.transform = 'translateX(0)'; // Reset position if not animating
            }
        } else {
            // On desktop, always pause and reset position
            scrollWrapper.style.animationPlayState = 'paused';
            scrollWrapper.style.transform = 'translateX(0)';
            scrollWrapper.style.animationDuration = ''; // Reset duration for desktop
        }
    }
}


// Execute all setup functions when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Setup UI related elements (navigation highlighting, mobile nav)
    highlightActiveNav();
    setupMobileNavigation();

    // Initial update of cart icon count when the page loads
    updateCartIconCount();

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

    // Setup top bar marquee animation
    setupTopBarMarquee();
});

// Listen for window resize to adjust marquee animation
window.addEventListener('resize', setupTopBarMarquee);

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