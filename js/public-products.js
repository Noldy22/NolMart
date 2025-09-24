// js/public-products.js

import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { addItemToCart } from './cart.js';
import { showNotification } from './notifications.js';
import { WHATSAPP_NUMBER } from './config.js'; // Import the centralized WhatsApp number

let allProducts = []; // This will act as a local cache for all products to enable fast searching.

/**
 * Creates and returns a product card HTML element.
 * @param {Object} product - The product data.
 * @returns {HTMLElement} The created product card element.
 */
function createProductCard(product) {
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
 * Fetches products from Firestore, optionally filtered by category or limit.
 * @param {number|null} productLimit - Maximum number of products to fetch.
 * @param {string|null} category - Optional category to filter products by.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of products.
 */
async function fetchProductsFromDB(productLimit = null, category = null) {
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
        const products = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });
        return products;
    } catch (error) {
        console.error("Error fetching products from DB:", error);
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
    const fashionProductsContainer = document.getElementById('fashionProductsContainer');

    if (latestProductsCarouselTrack) {
        const latestProducts = await fetchProductsFromDB(10);
        displayProducts(latestProductsCarouselTrack, latestProducts, true);
        document.dispatchEvent(new CustomEvent('carouselContentLoaded'));
    }
    if (electronicsProductsContainer) {
        const electronicsProducts = await fetchProductsFromDB(4, 'Electronics');
        displayProducts(electronicsProductsContainer, electronicsProducts, false);
    }
    if (fashionProductsContainer) {
        const fashionProducts = await fetchProductsFromDB(4, 'Fashion');
        displayProducts(fashionProductsContainer, fashionProducts, false);
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

    allProducts = await fetchProductsFromDB();
    if (loadingMsg) loadingMsg.style.display = 'none';
    displayProducts(productsContainer, allProducts, false);

    setupCategoryFilters(productsContainer, allProducts);
}

/**
 * Sets up category filter buttons to filter the locally cached product list.
 * @param {HTMLElement} container - The element to display filtered products in.
 * @param {Array<Object>} products - The full list of products to filter from.
 */
function setupCategoryFilters(container, products) {
    const filterContainer = document.getElementById('productsCategoryFilterContainer');
    if (!filterContainer) return;

    const categories = [...new Set(products.map(p => p.category))].sort();
    
    filterContainer.innerHTML = '<button class="button category-filter-btn active-category-filter" data-category="all">All Products</button>';
    
    categories.forEach(category => {
        const button = document.createElement('button');
        button.classList.add('button', 'category-filter-btn');
        button.dataset.category = category;
        button.textContent = category;
        filterContainer.appendChild(button);
    });

    filterContainer.addEventListener('click', (event) => {
        if (!event.target.classList.contains('category-filter-btn')) return;

        filterContainer.querySelectorAll('.category-filter-btn').forEach(btn => btn.classList.remove('active-category-filter'));
        event.target.classList.add('active-category-filter');

        const selectedCategory = event.target.dataset.category;
        
        if (selectedCategory === 'all') {
            displayProducts(container, products, false);
        } else {
            const filteredProducts = products.filter(p => p.category === selectedCategory);
            displayProducts(container, filteredProducts, false);
        }
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    if (document.getElementById('latestProductsCarouselTrack')) {
        initHomePage();
    }
    if (document.getElementById('productsContainer')) {
        initProductsPage();
    }
    if (allProducts.length === 0) {
        allProducts = await fetchProductsFromDB();
    }
});