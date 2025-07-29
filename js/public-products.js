// js/public-products.js

import { db } from './firebase-config.js'; // Import the Firestore instance
import { collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"; // Import necessary Firestore functions, including 'where'
import { addItemToCart } from './cart.js'; // Import addItemToCart
import { showNotification } from './notifications.js'; // Import showNotification

// --- CONFIGURATION ---
const WHATSAPP_NUMBER = '255695557358'; // Your WhatsApp number without '+' or spaces

// This ensures the script runs once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => { // Made async to allow await calls inside
    const productsContainer = document.getElementById('productsContainer'); // For products.html (full grid)
    const latestProductsCarouselTrack = document.getElementById('latestProductsCarouselTrack'); // For index.html (carousel)
    const productsCategoryFilterContainer = document.getElementById('productsCategoryFilterContainer'); // NEW: For category filters on products.html

    // Common messages for products.html
    const loadingMessage = productsContainer ? document.getElementById('loadingMessage') : null;
    const noProductsMessage = productsContainer ? document.getElementById('noProductsMessage') : null;
    const errorMessage = productsContainer ? document.getElementById('errorMessage') : null;

    /**
     * Creates and returns a product card HTML element.
     * @param {Object} product - The product data.
     * @param {string} type - 'grid' or 'carousel' for styling.
     * @returns {HTMLElement} The created product card element.
     */
    function createProductCard(product, type = 'grid') {
        const productId = product.id;
        const productName = product.name;
        // Ensure price is a number before using toLocaleString
        const productPrice = parseFloat(product.price);
        const formattedPrice = productPrice.toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        const rawProductPrice = productPrice; // Keep raw price for WhatsApp message
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
                        <p class="product-price">Tzs ${formattedPrice}</p>
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
                        <p class="product-price">Tzs ${formattedPrice}</p>
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
                showNotification(`${productName} added to cart!`, 'success');
            });
        }

        // Add event listener to the "Buy Now" button within this card
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


    /**
     * Fetches and displays products in the specified container.
     * @param {HTMLElement} targetElement - The DOM element to append product cards to.
     * @param {number|null} productLimit - Maximum number of products to fetch. Null for no limit.
     * @param {boolean} isCarousel - True if displaying in a carousel, false for a grid.
     * @param {string|null} category - Optional category to filter products by. Null or 'all' for all products.
     * @param {string} loadingText - Text to show while loading.
     */
    async function fetchAndDisplayProducts(targetElement, productLimit = null, isCarousel = false, category = null, loadingText = 'Loading products...') {
        if (!targetElement) return;

        targetElement.innerHTML = ''; // Clear existing content

        // Show loading message specific to the target element
        targetElement.innerHTML = `<p style="text-align: center; width: 100%;">${loadingText}</p>`;

        // Only show detailed messages for the main products page (productsContainer)
        if (targetElement === productsContainer) {
            if (loadingMessage) loadingMessage.style.display = 'block';
            if (noProductsMessage) noProductsMessage.style.display = 'none';
            if (errorMessage) errorMessage.style.display = 'none';
        }

        try {
            const productsCollectionRef = collection(db, "products");
            let q = query(productsCollectionRef, orderBy("createdAt", "desc"));

            if (category && category !== 'all') {
                q = query(q, where("category", "==", category));
            }

            if (productLimit) {
                q = query(q, limit(productLimit));
            }

            const querySnapshot = await getDocs(q);

            if (targetElement === productsContainer && loadingMessage) {
                loadingMessage.style.display = 'none'; // Hide loading message
            }

            if (querySnapshot.empty) {
                if (targetElement === productsContainer && noProductsMessage) {
                    noProductsMessage.style.display = 'block';
                } else {
                    targetElement.innerHTML = '<p style="text-align: center; width: 100%;">No products available in this category.</p>';
                }
                return;
            }

            targetElement.innerHTML = ''; // Clear loading message now that products are found

            querySnapshot.forEach((doc) => {
                const product = { id: doc.id, ...doc.data() };
                const productCard = createProductCard(product, isCarousel ? 'carousel' : 'grid');

                if (isCarousel) {
                    const carouselSlide = document.createElement('div');
                    carouselSlide.classList.add('carousel-slide');
                    carouselSlide.appendChild(productCard);
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
            showNotification(`Failed to load products: ${error.message}`, 'error');
        }
    }


    /**
     * Fetches unique categories from products and renders them as filter buttons.
     * This function is specifically for products.html.
     */
    async function fetchAndRenderCategoryFilters() {
        if (!productsCategoryFilterContainer) return; // Only run on products.html

        productsCategoryFilterContainer.innerHTML = '<button class="button category-filter-btn active-category-filter" data-category="all">All Products</button>'; // Reset to default

        try {
            const productsCollectionRef = collection(db, "products");
            const querySnapshot = await getDocs(productsCollectionRef);

            const categories = new Set();
            querySnapshot.forEach((doc) => {
                const productData = doc.data();
                if (productData.category) {
                    categories.add(productData.category);
                }
            });

            // Sort categories alphabetically
            const sortedCategories = Array.from(categories).sort();

            sortedCategories.forEach(category => {
                const button = document.createElement('button');
                button.classList.add('button', 'category-filter-btn');
                button.dataset.category = category;
                button.textContent = category;
                productsCategoryFilterContainer.appendChild(button);
            });

            // Attach event listeners to all category filter buttons
            productsCategoryFilterContainer.addEventListener('click', (event) => {
                if (event.target.classList.contains('category-filter-btn')) {
                    const selectedCategory = event.target.dataset.category;

                    // Remove active class from all buttons
                    productsCategoryFilterContainer.querySelectorAll('.category-filter-btn').forEach(btn => {
                        btn.classList.remove('active-category-filter');
                    });
                    // Add active class to the clicked button
                    event.target.classList.add('active-category-filter');

                    // Fetch and display products for the selected category
                    fetchAndDisplayProducts(productsContainer, null, false, selectedCategory);
                }
            });

            // Check URL for pre-selected category
            const urlParams = new URLSearchParams(window.location.search);
            const initialCategory = urlParams.get('category');
            if (initialCategory) {
                // Find and activate the corresponding category button
                const targetButton = productsCategoryFilterContainer.querySelector(`[data-category="${initialCategory}"]`);
                if (targetButton) {
                    productsCategoryFilterContainer.querySelector('.active-category-filter')?.classList.remove('active-category-filter');
                    targetButton.classList.add('active-category-filter');
                    fetchAndDisplayProducts(productsContainer, null, false, initialCategory);
                } else {
                    // If URL category not found, default to 'all'
                    fetchAndDisplayProducts(productsContainer, null, false, 'all');
                }
            } else {
                // Default load all products if no category in URL
                fetchAndDisplayProducts(productsContainer, null, false, 'all');
            }


        } catch (error) {
            console.error("Error fetching categories:", error);
            showNotification(`Failed to load categories: ${error.message}`, 'error');
            // Even if categories fail, still attempt to load all products
            fetchAndDisplayProducts(productsContainer, null, false, 'all');
        }
    }


    // --- INITIAL PAGE LOAD LOGIC ---

    // On index.html (homepage):
    if (latestProductsCarouselTrack) {
        fetchAndDisplayProducts(latestProductsCarouselTrack, 5, true, null, 'Loading latest products...'); // Display 5 latest products in carousel
        // NEW: Load specific category sections on the homepage
        // Ensure the ID matches what you put in index.html and the category string matches Firebase
        fetchAndDisplayProducts(document.getElementById('electronicsProductsContainer'), 4, false, 'Electronics', 'Loading Electronics...');
        fetchAndDisplayProducts(document.getElementById('fashionProductsContainer'), 4, false, 'Fashion', 'Loading Fashion...');
        // Add more calls here for other categories you want on the homepage:
        // fetchAndDisplayProducts(document.getElementById('yourCategoryContainerId'), 4, false, 'Your Category Name', 'Loading Your Category...');
    }

    // On products.html:
    if (productsContainer) {
        fetchAndRenderCategoryFilters(); // This will also handle initial product display based on URL or 'all'
    }
});