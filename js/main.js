// js/main.js

import { setupAuthListeners, protectAdminPages } from './auth.js';
// IMPORTANT: We are now importing initSwiperCarousel instead of initCarousel
import { highlightActiveNav, initSwiperCarousel, setupMobileNavigation } from './ui.js';
import { getCartTotalQuantity } from './cart.js';
import { attachSearchEventListeners } from './public-products.js';

console.log("main.js loaded!");

function updateCartIconCount() {
    const cartCountSpan = document.querySelector('.main-nav .cart-count');
    if (cartCountSpan) {
        const totalItems = getCartTotalQuantity();
        cartCountSpan.textContent = totalItems.toString();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    setupAuthListeners();
    protectAdminPages();
    highlightActiveNav();
    setupMobileNavigation();
    updateCartIconCount();
    attachSearchEventListeners();
});

// Listen for the custom event to initialize the Swiper carousel
document.addEventListener('carouselContentLoaded', () => {
    console.log("Carousel content loaded event received. Initializing Swiper carousel.");
    initSwiperCarousel(); // Call the new function from ui.js
});

window.addEventListener('cartUpdated', () => {
    console.log("Cart updated event received in main.js. Updating cart icon count.");
    updateCartIconCount();
});

// No longer need the complex resize listener for the carousel
// Swiper handles responsiveness automatically