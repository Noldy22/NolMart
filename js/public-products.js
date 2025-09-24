// js/public-products.js
console.log("Checkpoint 1: public-products.js script has started.");

import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { addItemToCart } from './cart.js';
import { showNotification } from './notifications.js';

const WHATSAPP_NUMBER = '255695557358';

function createProductCard(product, type = 'grid') {
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
                ${type === 'grid' ? `<p class="product-description">${productDescription ? productDescription.substring(0, 70) + '...' : ''}</p>` : ''}
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

async function fetchAndDisplayProducts(targetElement, productLimit = null, isCarousel = false, category = null, loadingText = 'Loading products...', searchTerm = null) {
    if (!targetElement) {
        console.error("fetchAndDisplayProducts was called with no targetElement.");
        return;
    }

    targetElement.innerHTML = `<p class="search-message" style="text-align: center; width: 100%;">${loadingText}</p>`;
    
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
        targetElement.innerHTML = ''; 

        if (querySnapshot.empty) {
            targetElement.innerHTML = '<p class="search-message" style="text-align: center; width: 100%;">No products found.</p>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const product = { id: doc.id, ...doc.data() };
            const productCard = createProductCard(product, isCarousel ? 'carousel' : 'grid');

            if (isCarousel) {
                const slide = document.createElement('div');
                slide.classList.add('swiper-slide');
                slide.appendChild(productCard);
                targetElement.appendChild(slide);
            } else {
                targetElement.appendChild(productCard);
            }
        });

        if (isCarousel) {
            console.log("Checkpoint 5: Carousel products loaded, firing event.");
            const event = new CustomEvent('carouselContentLoaded');
            document.dispatchEvent(event);
        }

    } catch (error) {
        console.error("FATAL ERROR while fetching products:", error);
        showNotification(`Failed to load products: ${error.message}`, 'error');
    }
}

export function attachSearchEventListeners() {
    // Search functionality - remains unchanged
}

document.addEventListener('DOMContentLoaded', () => {
    console.log("Checkpoint 2: DOMContentLoaded event fired.");

    const productsContainer = document.getElementById('productsContainer');
    const latestProductsCarouselTrack = document.getElementById('latestProductsCarouselTrack');
    const electronicsProductsContainer = document.getElementById('electronicsProductsContainer');
    const fashionProductsContainer = document.getElementById('fashionProductsContainer');

    // On index.html (homepage)
    if (latestProductsCarouselTrack) {
        console.log("Checkpoint 3: Found homepage elements, fetching products...");
        fetchAndDisplayProducts(latestProductsCarouselTrack, 5, true, null, 'Loading latest products...');
        fetchAndDisplayProducts(electronicsProductsContainer, 4, false, 'Electronics', 'Loading Electronics...');
        fetchAndDisplayProducts(fashionProductsContainer, 4, false, 'Fashion', 'Loading Fashion...');
    }

    // On products.html
    if (productsContainer) {
        console.log("Checkpoint 4: Found products page container, fetching filters and products...");
        // This function also calls fetchAndDisplayProducts internally
        fetchAndRenderCategoryFilters();
    }
});


async function fetchAndRenderCategoryFilters() {
    // This function remains unchanged from the original file
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