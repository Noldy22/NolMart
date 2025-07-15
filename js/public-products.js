// js/public-products.js

import { db } from './firebase-config.js'; // Import the Firestore instance
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"; // Import necessary Firestore functions
import { addItemToCart } from './cart.js'; // Import addItemToCart
import { showNotification } from './notifications.js'; // NEW: Import showNotification

// --- CONFIGURATION ---
const WHATSAPP_NUMBER = '255695557358'; // Your WhatsApp number without '+' or spaces

// This ensures the script runs once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('productsContainer'); // For products.html (full grid)
    const latestProductsCarouselTrack = document.getElementById('latestProductsCarouselTrack'); // For index.html (carousel)

    // Common messages for products.html
    const loadingMessage = productsContainer ? document.getElementById('loadingMessage') : null;
    const noProductsMessage = productsContainer ? document.getElementById('noProductsMessage') : null;
    const errorMessage = productsContainer ? document.getElementById('errorMessage') : null;

    /**
     * Creates and returns a product card HTML element.
     * This function is now local to public-products.js as it was before, but updated.
     * @param {Object} product - The product data.
     * @param {string} type - 'grid' or 'carousel' for styling.
     * @returns {HTMLElement} The created product card element.
     */
    function createProductCard(product, type = 'grid') {
        const productId = product.id;
        const productName = product.name;
        const productPrice = parseFloat(product.price).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const rawProductPrice = parseFloat(product.price); // Keep raw price for WhatsApp message
        const productDescription = product.description;
        // Ensure imageUrls is an array and take the first one, or use placeholder
        const imageUrl = (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0)
            ? product.imageUrls[0]
            : 'img/placeholder-image.png';

        let cardHtml = '';
        if (type === 'carousel') {
            cardHtml = `
                <div class="product-card carousel-card" data-product-id="${productId}">
                    <a href="product-detail.html?id=${productId}" class="product-link">
                        <img src="${imageUrl}" alt="${productName}" class="product-image">
                        <h3 class="product-name">${productName}</h3>
                        <p class="product-price">Tzs ${productPrice}</p>
                    </a>
                    <div class="product-actions">
                        <button class="button add-to-cart-btn"
                                data-product-id="${productId}"
                                data-product-name="${productName}"
                                data-product-price="${rawProductPrice}"
                                data-product-image="${imageUrl}">
                            Add to Cart
                        </button>
                        <button class="button buy-now-btn"
                                data-product-id="${productId}"
                                data-product-name="${productName}"
                                data-product-price="${rawProductPrice}">
                            Buy Now
                        </button>
                    </div>
                </div>
            `;
        } else { // Default to grid type
            cardHtml = `
                <div class="product-card grid-card" data-product-id="${productId}">
                    <a href="product-detail.html?id=${productId}" class="product-link">
                        <img src="${imageUrl}" alt="${productName}" class="product-image">
                        <h3 class="product-name">${productName}</h3>
                        <p class="product-price">Tzs ${productPrice}</p>
                        <p class="product-description">${productDescription ? productDescription.substring(0, 70) + '...' : ''}</p>
                    </a>
                    <div class="product-actions">
                        <button class="button add-to-cart-btn"
                                data-product-id="${productId}"
                                data-product-name="${productName}"
                                data-product-price="${rawProductPrice}"
                                data-product-image="${imageUrl}">
                            Add to Cart
                        </button>
                        <button class="button buy-now-btn"
                                data-product-id="${productId}"
                                data-product-name="${productName}"
                                data-product-price="${rawProductPrice}">
                            Buy Now
                        </button>
                    </div>
                </div>
            `;
        }

        const cardElement = document.createElement('div');
        cardElement.innerHTML = cardHtml.trim();

        // Add event listener to the "Add to Cart" button within this card
        const addToCartButton = cardElement.querySelector('.add-to-cart-btn');
        if (addToCartButton) {
            addToCartButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent navigating to product detail page
                event.preventDefault(); // Prevent default button action if any

                const productId = addToCartButton.dataset.productId;
                const productName = addToCartButton.dataset.productName;
                const productPrice = parseFloat(addToCartButton.dataset.productPrice);
                const productImage = addToCartButton.dataset.productImage;

                const productToAdd = {
                    id: productId,
                    name: productName,
                    price: productPrice,
                    imageUrls: [productImage] // Pass as an array for consistency with cart.js
                };

                addItemToCart(productToAdd);
                // alert(`${productName} added to cart!`); // OLD: Simple confirmation
                showNotification(`${productName} added to cart!`, 'success'); // NEW: Custom notification
            });
        }

        // NEW: Add event listener to the "Buy Now" button within this card
        const buyNowButton = cardElement.querySelector('.buy-now-btn');
        if (buyNowButton) {
            buyNowButton.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent navigating to product detail page
                event.preventDefault(); // Prevent default button action if any

                const productId = buyNowButton.dataset.productId;
                const productName = buyNowButton.dataset.productName;
                const productPrice = parseFloat(buyNowButton.dataset.productPrice);

                const message = `Hello, I'd like to buy one unit of the following product from NolMart:\n\n` +
                                `Product: ${productName}\n` +
                                `Price: Tzs ${productPrice.toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
                                `Product ID: ${productId}\n\n` +
                                `Please confirm availability and guide me on payment and delivery. Thank you!`;

                const encodedMessage = encodeURIComponent(message);
                const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

                window.location.href = whatsappUrl;
            });
        }

        return cardElement.firstChild; // Return the actual card element
    }


    async function fetchAndDisplayProducts(targetElement, productLimit = null, isCarousel = false) {
        if (!targetElement) return; // Exit if the target container doesn't exist on this page

        targetElement.innerHTML = ''; // Clear existing content (e.g., loading message)

        // Only show detailed messages for the main products page
        if (targetElement === productsContainer && loadingMessage) {
            loadingMessage.style.display = 'block';
            if (noProductsMessage) noProductsMessage.style.display = 'none';
            if (errorMessage) errorMessage.style.display = 'none';
        } else if (targetElement === latestProductsCarouselTrack) {
            targetElement.innerHTML = '<p style="text-align: center; width: 100%;">Loading latest products...</p>';
        }

        try {
            const productsCollectionRef = collection(db, "products");
            let q = query(productsCollectionRef, orderBy("createdAt", "desc")); // Order by creation date, newest first

            if (productLimit) {
                q = query(q, limit(productLimit)); // Apply limit if specified
            }

            const querySnapshot = await getDocs(q);

            if (targetElement === productsContainer && loadingMessage) {
                loadingMessage.style.display = 'none'; // Hide loading message
            }

            if (querySnapshot.empty) {
                if (targetElement === productsContainer && noProductsMessage) {
                    noProductsMessage.style.display = 'block';
                } else {
                    targetElement.innerHTML = '<p style="text-align: center; width: 100%;">No products available.</p>';
                }
                return;
            }

            targetElement.innerHTML = ''; // Clear loading message now that products are found

            querySnapshot.forEach((doc) => {
                // Pass product ID to createProductCard and product object
                const product = { id: doc.id, ...doc.data() };
                const productCard = createProductCard(product, isCarousel ? 'carousel' : 'grid'); // Pass type
                
                if (isCarousel) {
                    const carouselSlide = document.createElement('div');
                    carouselSlide.classList.add('carousel-slide');
                    carouselSlide.appendChild(productCard); // Append the entire card element
                    targetElement.appendChild(carouselSlide);
                } else {
                    targetElement.appendChild(productCard);
                }
            });

            // Dispatch custom event after carousel content is loaded
            if (isCarousel) {
                const event = new CustomEvent('carouselContentLoaded');
                document.dispatchEvent(event);
            }

        } catch (error) {
            console.error("Error fetching products:", error);
            if (targetElement === productsContainer && errorMessage) {
                loadingMessage.style.display = 'none';
                errorMessage.style.display = 'block';
                errorMessage.textContent = `Error loading products: ${error.message}. Please try again later.`;
            } else {
                targetElement.innerHTML = `<p style="text-align: center; color: red; width: 100%;">Error loading products: ${error.message}</p>`;
            }
            showNotification(`Failed to load products: ${error.message}`, 'error'); // NEW: Show error notification
        }
    }

    // Call the function to display products based on which container exists
    if (productsContainer) { // This means we are on products.html
        fetchAndDisplayProducts(productsContainer, null, false);
    }
    if (latestProductsCarouselTrack) { // This means we are on index.html
        fetchAndDisplayProducts(latestProductsCarouselTrack, 5, true); // Display 5 latest products in the carousel
    }
});