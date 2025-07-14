// js/public-products.js

import { db } from './firebase-config.js'; // Import the Firestore instance
import { collection, getDocs, query, orderBy, limit } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"; // Import necessary Firestore functions

document.addEventListener('DOMContentLoaded', () => {
    const productsContainer = document.getElementById('productsContainer'); // For products.html (full grid)
    const latestProductsCarouselTrack = document.getElementById('latestProductsCarouselTrack'); // For index.html (carousel)

    // Common messages for products.html
    const loadingMessage = productsContainer ? document.getElementById('loadingMessage') : null;
    const noProductsMessage = productsContainer ? document.getElementById('noProductsMessage') : null;
    const errorMessage = productsContainer ? document.getElementById('errorMessage') : null;

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
                const product = doc.data();
                const productId = doc.id;

                const imageUrl = (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : 'img/placeholder-image.png'; // Use a placeholder image if no URL

                const productCardHtml = `
                    <a href="product-detail.html?id=${productId}" class="product-link">
                        <img src="${imageUrl}" alt="${product.name}" class="product-image">
                        <h3 class="product-name">${product.name}</h3>
                        <p class="product-price">Tzs ${parseFloat(product.price).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                        <p class="product-category">${product.category}</p>
                    </a>
                    <button class="add-to-cart-btn" data-product-id="${productId}">Add to Cart</button>
                `;

                if (isCarousel) {
                    const carouselSlide = document.createElement('div');
                    carouselSlide.classList.add('carousel-slide');
                    // Add your existing product-card class inside the slide for styling
                    const productCardDiv = document.createElement('div');
                    productCardDiv.classList.add('product-card');
                    productCardDiv.innerHTML = productCardHtml;
                    carouselSlide.appendChild(productCardDiv);
                    targetElement.appendChild(carouselSlide);
                } else {
                    const productCard = document.createElement('div');
                    productCard.classList.add('product-card');
                    productCard.innerHTML = productCardHtml;
                    targetElement.appendChild(productCard);
                }
            });

            // *** NEW: Dispatch custom event after carousel content is loaded ***
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