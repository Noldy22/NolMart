// js/public-products.js

import { db } from './firebase-config.js'; // Import the Firestore instance
import { collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"; // Import necessary Firestore functions, including 'where'
import { addItemToCart } from './cart.js'; // Import addItemToCart
import { showNotification } from './notifications.js'; // Import showNotification

// --- CONFIGURATION ---
const WHATSAPP_NUMBER = '255695557358'; // Your WhatsApp number without '+' or spaces

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
                imageUrls: [productImage]
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

    return cardElement.firstChild;
}


/**
 * Fetches and displays products in the specified container.
 * @param {HTMLElement} targetElement - The DOM element to append product cards to.
 * @param {number|null} productLimit - Maximum number of products to fetch. Null for no limit.
 * @param {boolean} isCarousel - True if displaying in a carousel, false for a grid.
 * @param {string|null} category - Optional category to filter products by. Null or 'all' for all products.
 * @param {string} loadingText - Text to show while loading.
 * @param {string|null} searchTerm - Optional search term to filter products by name or description.
 */
async function fetchAndDisplayProducts(targetElement, productLimit = null, isCarousel = false, category = null, loadingText = 'Loading products...', searchTerm = null) {
    if (!targetElement) return;

    targetElement.innerHTML = ''; // Clear existing content

    // Show loading message specific to the target element
    const initialMessage = targetElement.querySelector('.search-initial-message');
    if (initialMessage) initialMessage.style.display = 'none';

    targetElement.innerHTML = `<p class="search-message" style="text-align: center; width: 100%;">${loadingText}</p>`;


    // Only show detailed messages for the main products page (productsContainer)
    // and hide search-specific messages
    if (targetElement.id === 'productsContainer') {
        const loadingMsg = document.getElementById('loadingMessage');
        const noProductsMsg = document.getElementById('noProductsMessage');
        const errorMsg = document.getElementById('errorMessage');
        if (loadingMsg) loadingMsg.style.display = 'block';
        if (noProductsMsg) noProductsMsg.style.display = 'none';
        if (errorMsg) errorMsg.style.display = 'none';
    } else if (targetElement.id === 'searchResultsContainer') {
        // Hide search specific messages when loading new results
        document.getElementById('noSearchResultsMessage').style.display = 'none';
        document.getElementById('searchErrorMessage').style.display = 'none';
    }


    try {
        const productsCollectionRef = collection(db, "products");
        let q = query(productsCollectionRef, orderBy("createdAt", "desc"));

        if (category && category !== 'all') {
            q = query(q, where("category", "==", category));
        }

        // NEW: Implement search term filtering
        if (searchTerm && searchTerm.trim() !== '') {
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            // Firestore doesn't support "contains" directly, but we can do a "starts with"
            // or a range query for more flexibility. For simple text search, "startsWith" is common.
            // For more advanced search (like substring matching), you'd need a dedicated search service
            // like Algolia or a server-side function.
            // For now, we'll implement a basic range query to simulate a "starts with" or near match
            // based on the first character.
            q = query(productsCollectionRef,
                where("name_lower", ">=", lowerCaseSearchTerm),
                where("name_lower", "<=", lowerCaseSearchTerm + '\uf8ff'), // \uf8ff is a high-code point Unicode character
                orderBy("name_lower") // Order by the field we're querying
            );
            // Optionally add another query for description if desired, and merge results
            // This is more complex and typically requires client-side filtering or a backend service.
        }

        if (productLimit) {
            q = query(q, limit(productLimit));
        }

        const querySnapshot = await getDocs(q);

        if (targetElement.id === 'productsContainer' && document.getElementById('loadingMessage')) {
            document.getElementById('loadingMessage').style.display = 'none'; // Hide loading message
        }

        targetElement.innerHTML = ''; // Clear loading message now that products are found (or not found)

        if (querySnapshot.empty) {
            if (targetElement.id === 'productsContainer' && document.getElementById('noProductsMessage')) {
                document.getElementById('noProductsMessage').style.display = 'block';
            } else if (targetElement.id === 'searchResultsContainer' && document.getElementById('noSearchResultsMessage')) {
                document.getElementById('noSearchResultsMessage').style.display = 'block';
            } else {
                targetElement.innerHTML = '<p class="search-message" style="text-align: center; width: 100%;">No products available in this category.</p>';
            }
            return;
        }


        querySnapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            // For search, we should check if the product name or description contains the search term
            // Firebase query is for 'starts with'. Client-side filter for 'contains' if needed.
            const matchesSearch = searchTerm ?
                (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())))
                : true;

            if (matchesSearch) {
                const productCard = createProductCard(product, isCarousel ? 'carousel' : 'grid');

                if (isCarousel) {
                    const carouselSlide = document.createElement('div');
                    carouselSlide.classList.add('carousel-slide');
                    carouselSlide.appendChild(productCard);
                    targetElement.appendChild(carouselSlide);
                } else {
                    targetElement.appendChild(productCard);
                }
            }
        });

        // After filtering, check if any products were actually displayed in search results
        if (targetElement.id === 'searchResultsContainer' && targetElement.children.length === 0) {
             document.getElementById('noSearchResultsMessage').style.display = 'block';
        }


        // Dispatch custom event after carousel content is loaded
        if (isCarousel) {
            const event = new CustomEvent('carouselContentLoaded');
            document.dispatchEvent(event);
        }

    } catch (error) {
        console.error("Error fetching products:", error);
        if (targetElement.id === 'productsContainer' && document.getElementById('errorMessage')) {
            document.getElementById('loadingMessage').style.display = 'none';
            document.getElementById('errorMessage').style.display = 'block';
            document.getElementById('errorMessage').textContent = `Error loading products: ${error.message}. Please try again later.`;
        } else if (targetElement.id === 'searchResultsContainer' && document.getElementById('searchErrorMessage')) {
            document.getElementById('searchErrorMessage').style.display = 'block';
            document.getElementById('searchErrorMessage').textContent = `Error searching: ${error.message}.`;
        } else {
            targetElement.innerHTML = `<p class="search-message" style="text-align: center; color: red; width: 100%;">Error loading products: ${error.message}</p>`;
        }
        showNotification(`Failed to load products: ${error.message}`, 'error');
    }
}


/**
 * Fetches unique categories from products and renders them as filter buttons.
 * This function is specifically for products.html.
 */
async function fetchAndRenderCategoryFilters() {
    const productsCategoryFilterContainer = document.getElementById('productsCategoryFilterContainer');
    if (!productsCategoryFilterContainer) return;

    productsCategoryFilterContainer.innerHTML = '<button class="button category-filter-btn active-category-filter" data-category="all">All Products</button>';

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

        const sortedCategories = Array.from(categories).sort();

        sortedCategories.forEach(category => {
            const button = document.createElement('button');
            button.classList.add('button', 'category-filter-btn');
            button.dataset.category = category;
            button.textContent = category;
            productsCategoryFilterContainer.appendChild(button);
        });

        productsCategoryFilterContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('category-filter-btn')) {
                const selectedCategory = event.target.dataset.category;

                productsCategoryFilterContainer.querySelectorAll('.category-filter-btn').forEach(btn => {
                    btn.classList.remove('active-category-filter');
                });
                event.target.classList.add('active-category-filter');

                fetchAndDisplayProducts(document.getElementById('productsContainer'), null, false, selectedCategory);
            }
        });

        const urlParams = new URLSearchParams(window.location.search);
        const initialCategory = urlParams.get('category');
        if (initialCategory) {
            const targetButton = productsCategoryFilterContainer.querySelector(`[data-category="${initialCategory}"]`);
            if (targetButton) {
                productsCategoryFilterContainer.querySelector('.active-category-filter')?.classList.remove('active-category-filter');
                targetButton.classList.add('active-category-filter');
                fetchAndDisplayProducts(document.getElementById('productsContainer'), null, false, initialCategory);
            } else {
                fetchAndDisplayProducts(document.getElementById('productsContainer'), null, false, 'all');
            }
        } else {
            fetchAndDisplayProducts(document.getElementById('productsContainer'), null, false, 'all');
        }

    } catch (error) {
        console.error("Error fetching categories:", error);
        showNotification(`Failed to load categories: ${error.message}`, 'error');
        fetchAndDisplayProducts(document.getElementById('productsContainer'), null, false, 'all');
    }
}

/**
 * Attaches event listeners for the search functionality.
 * This function is called from main.js after DOMContentLoaded.
 */
export function attachSearchEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const noSearchResultsMessage = document.getElementById('noSearchResultsMessage');
    const searchInitialMessage = searchResultsContainer ? searchResultsContainer.querySelector('.search-initial-message') : null;

    let searchTimeout;
    const SEARCH_DEBOUNCE_DELAY = 300; // milliseconds

    if (searchInput && searchResultsContainer) {
        searchInput.addEventListener('input', (event) => {
            clearTimeout(searchTimeout);
            const searchTerm = event.target.value.trim();

            if (searchTerm.length > 0) {
                 if (searchInitialMessage) searchInitialMessage.style.display = 'none';
                 noSearchResultsMessage.style.display = 'none'; // Hide "no results" when typing
                 searchResultsContainer.innerHTML = '<p class="search-message" style="text-align: center; width: 100%;">Searching...</p>';
                searchTimeout = setTimeout(() => {
                    fetchAndDisplayProducts(searchResultsContainer, null, false, null, 'Searching...', searchTerm);
                }, SEARCH_DEBOUNCE_DELAY);
            } else {
                searchResultsContainer.innerHTML = '';
                if (searchInitialMessage) searchInitialMessage.style.display = 'block';
                noSearchResultsMessage.style.display = 'none';
                document.getElementById('searchErrorMessage').style.display = 'none';
            }
        });
    }
}


// This ensures the script runs once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', async () => {
    const productsContainer = document.getElementById('productsContainer'); // For products.html (full grid)
    const latestProductsCarouselTrack = document.getElementById('latestProductsCarouselTrack'); // For index.html (carousel)
    // productsCategoryFilterContainer is now handled inside fetchAndRenderCategoryFilters

    // Initial page load logic:

    // On index.html (homepage):
    if (latestProductsCarouselTrack) {
        fetchAndDisplayProducts(latestProductsCarouselTrack, 5, true, null, 'Loading latest products...');
        fetchAndDisplayProducts(document.getElementById('electronicsProductsContainer'), 4, false, 'Electronics', 'Loading Electronics...');
        fetchAndDisplayProducts(document.getElementById('fashionProductsContainer'), 4, false, 'Fashion', 'Loading Fashion...');
    }

    // On products.html:
    if (productsContainer) {
        fetchAndRenderCategoryFilters();
    }
});