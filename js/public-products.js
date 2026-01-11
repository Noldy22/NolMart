// js/public-products.js

import { addItemToCart } from './cart.js';
import { showNotification } from './notifications.js';
import { WHATSAPP_NUMBER } from './config.js'; // Import the centralized WhatsApp number

let allProducts = []; // This will act as a local cache for all products to enable fast searching.
let activeCategory = 'all';
let activeSubcategory = 'all';

/**
 * Creates and returns a product card HTML element.
 * @param {Object} product - The product data.
 * @returns {HTMLElement} The created product card element.
 */
export function createProductCard(product) { // <-- "export" keyword added here
    const productId = product.id;
    const productName = product.name;
    const productPrice = parseFloat(product.price);
    const formattedPrice = productPrice.toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const rawProductPrice = productPrice;
    const productDescription = product.description;
    const imageUrl = (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0)
        ? product.imageUrls[0]
        : 'img/placeholder-image.png';

    const cardHtml = `
        <div class="product-card" data-product-id="${productId}">
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

    const cardElement = document.createElement('div');
    cardElement.innerHTML = cardHtml.trim();

    // Attach event listeners
    const addToCartButton = cardElement.querySelector('.add-to-cart-btn');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            const productToAdd = {
                id: addToCartButton.dataset.productId,
                name: addToCartButton.dataset.productName,
                price: parseFloat(addToCartButton.dataset.productPrice),
                imageUrls: [addToCartButton.dataset.productImage]
            };
            addItemToCart(productToAdd);
            showNotification(`${productToAdd.name} added to cart!`, 'success');
        });
    }

    const buyNowButton = cardElement.querySelector('.buy-now-btn');
    if (buyNowButton) {
        buyNowButton.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            const message = `Hello, I'd like to buy one unit of the following product from NolMart:\n\n` +
                `Product: ${buyNowButton.dataset.productName}\n` +
                `Price: Tzs ${parseFloat(buyNowButton.dataset.productPrice).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
                `Product ID: ${buyNowButton.dataset.productId}\n\n` +
                `Please confirm availability and guide me on payment and delivery. Thank you!`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
            window.location.href = whatsappUrl;
        });
    }

    return cardElement.firstChild;
}

/**
 * Renders a list of products into a specified container element.
 * @param {HTMLElement} container - The element to display products in.
 * @param {Array<Object>} productsToDisplay - An array of product objects.
 * @param {boolean} isCarousel - Whether to wrap cards in swiper-slide divs.
 */
function displayProducts(container, productsToDisplay, isCarousel = false) {
    container.innerHTML = ''; // Clear previous content or loading messages
    if (productsToDisplay.length === 0) {
        container.innerHTML = '<p class="search-message" style="text-align: center; width: 100%;">No products found.</p>';
        return;
    }

    productsToDisplay.forEach(product => {
        const productCard = createProductCard(product);
        if (isCarousel) {
            const slide = document.createElement('div');
            slide.classList.add('swiper-slide');
            slide.appendChild(productCard);
            container.appendChild(slide);
        } else {
            container.appendChild(productCard);
        }
    });
}

/**
 * Fetches products from the static JSON file, optionally filtered by category or limit.
 * @param {number|null} productLimit - Maximum number of products to fetch.
 * @param {string|null} category - Optional category to filter products by.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of products.
 */
async function fetchProductsFromDB(productLimit = null, category = null) {
    try {
        // Fetch products from the static JSON file
        const response = await fetch('/public/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let products = await response.json();

        // Filter by category if specified
        if (category && category !== 'all') {
            products = products.filter(p => p.category === category);
        }

        // Apply limit if specified
        if (productLimit) {
            products = products.slice(0, productLimit);
        }

        return products;
    } catch (error) {
        console.error("Error fetching products from JSON:", error);
        showNotification(`Failed to load products: ${error.message}`, 'error');
        return []; // Return an empty array on error
    }
}

/**
 * Attaches event listeners for the improved search functionality.
 */
export function attachSearchEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const noSearchResultsMessage = document.getElementById('noSearchResultsMessage');
    const searchInitialMessage = document.querySelector('.search-initial-message');

    if (!searchInput || !searchResultsContainer) return;

    let searchTimeout;
    searchInput.addEventListener('input', (event) => {
        clearTimeout(searchTimeout);
        const searchTerm = event.target.value.trim().toLowerCase();

        if (searchInitialMessage) searchInitialMessage.style.display = 'none';
        if (noSearchResultsMessage) noSearchResultsMessage.style.display = 'none';

        if (searchTerm.length === 0) {
            searchResultsContainer.innerHTML = '';
            if (searchInitialMessage) searchInitialMessage.style.display = 'block';
            return;
        }

        searchResultsContainer.innerHTML = '<p class="search-message" style="text-align: center; width: 100%;">Searching...</p>';

        searchTimeout = setTimeout(() => {
            const filteredProducts = allProducts.filter(product => {
                const nameMatch = product.name.toLowerCase().includes(searchTerm);
                const descriptionMatch = product.description && product.description.toLowerCase().includes(searchTerm);
                return nameMatch || descriptionMatch;
            });

            if (filteredProducts.length > 0) {
                displayProducts(searchResultsContainer, filteredProducts, false);
            } else {
                searchResultsContainer.innerHTML = '';
                if (noSearchResultsMessage) noSearchResultsMessage.style.display = 'block';
            }
        }, 300);
    });
}

/**
 * Initializes the content for the homepage.
 */
async function initHomePage() {
    const latestProductsCarouselTrack = document.getElementById('latestProductsCarouselTrack');
    const electronicsProductsContainer = document.getElementById('electronicsProductsContainer');

    if (latestProductsCarouselTrack) {
        const latestProducts = await fetchProductsFromDB(10);
        displayProducts(latestProductsCarouselTrack, latestProducts, true);
        document.dispatchEvent(new CustomEvent('carouselContentLoaded'));
    }
    if (electronicsProductsContainer) {
        const electronicsProducts = await fetchProductsFromDB(4, 'Electronics');
        displayProducts(electronicsProductsContainer, electronicsProducts, false);
    }
}

/**
 * Initializes the content for the main products page.
 */
async function initProductsPage() {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;

    const loadingMsg = document.getElementById('loadingMessage');
    if (loadingMsg) loadingMsg.style.display = 'block';

    // allProducts is now assumed to be pre-loaded by the DOMContentLoaded event listener
    if (loadingMsg) loadingMsg.style.display = 'none';

    // Handle URL params for pre-filtering
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('category');
    const subcategoryFromUrl = urlParams.get('subcategory');

    if (categoryFromUrl) {
        activeCategory = categoryFromUrl;
        if (subcategoryFromUrl) {
            activeSubcategory = subcategoryFromUrl;
        }
    }

    setupCategoryFilters();
    updateSubcategoryFilters();
    updateProductDisplay();
}

/**
 * Updates the displayed products based on the current active filters.
 */
function updateProductDisplay() {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    let filteredProducts = allProducts;

    if (activeCategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.category === activeCategory);
    }

    if (activeSubcategory !== 'all') {
        filteredProducts = filteredProducts.filter(p => p.subcategory === activeSubcategory);
    }

    displayProducts(container, filteredProducts, false);
}


/**
 * Sets up the main category filter buttons.
 */
function setupCategoryFilters() {
    const filterContainer = document.getElementById('productsCategoryFilterContainer');
    if (!filterContainer) return;

    // Get unique categories and ensure 'all' is first.
    const categories = [...new Set(allProducts.map(p => p.category).filter(Boolean))].sort();
    categories.unshift('all');

    filterContainer.innerHTML = ''; // Clear existing buttons

    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('button', 'category-filter-btn');
        button.dataset.category = category;
        button.textContent = category === 'all' ? 'All Products' : category;
        if (category === activeCategory) {
            button.classList.add('active-category-filter');
        }
        filterContainer.appendChild(button);
    });

    filterContainer.addEventListener('click', (event) => {
        if (!event.target.classList.contains('category-filter-btn')) return;

        activeCategory = event.target.dataset.category;
        activeSubcategory = 'all'; // Reset subcategory when main category changes

        // Update active class for main categories
        filterContainer.querySelectorAll('.category-filter-btn').forEach(btn => btn.classList.remove('active-category-filter'));
        event.target.classList.add('active-category-filter');

        updateSubcategoryFilters();
        updateProductDisplay();
    });
}

/**
 * Sets up or updates the subcategory filter buttons based on the active main category.
 */
function updateSubcategoryFilters() {
    const subFilterContainer = document.getElementById('productsSubcategoryFilterContainer');
    if (!subFilterContainer) return;

    subFilterContainer.innerHTML = '';

    if (activeCategory === 'all') {
        return; // No subcategories if 'All Products' is selected
    }

    const productsInActiveCategory = allProducts.filter(p => p.category === activeCategory);
    const subcategories = [...new Set(productsInActiveCategory.map(p => p.subcategory).filter(Boolean))].sort();

    if (subcategories.length === 0) {
        return; // Don't show the subcategory bar if there are no subcategories
    }

    subcategories.unshift('all'); // Add 'All' option for the current category

    subcategories.forEach(subcategory => {
        const button = document.createElement('button');
        button.classList.add('button', 'subcategory-filter-btn'); // New class for styling
        button.dataset.subcategory = subcategory;
        button.textContent = subcategory === 'all' ? `All ${activeCategory}` : subcategory;
        if (subcategory === activeSubcategory) {
            button.classList.add('active-subcategory-filter'); // New active class
        }
        subFilterContainer.appendChild(button);
    });

    subFilterContainer.addEventListener('click', (event) => {
        if (!event.target.classList.contains('subcategory-filter-btn')) return;

        activeSubcategory = event.target.dataset.subcategory;

        // Update active class for subcategories
        subFilterContainer.querySelectorAll('.subcategory-filter-btn').forEach(btn => btn.classList.remove('active-subcategory-filter'));
        event.target.classList.add('active-subcategory-filter');

        updateProductDisplay();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch all products once on initial load and cache them.
    // This is crucial for filtering and search to work correctly across the site.
    allProducts = await fetchProductsFromDB();
    
    // Initialize page-specific content
    if (document.getElementById('latestProductsCarouselTrack')) {
        initHomePage();
    }
    if (document.getElementById('productsContainer')) {
        initProductsPage();
    }
});
