// js/product-detail.js

import { addItemToCart } from './cart.js';
import { showNotification } from './notifications.js';
import { createProductCard } from './public-products.js'; // Import the shared function

/**
 * Fetches all products from the static JSON file.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of products.
 */
async function fetchAllProducts() {
    try {
        const response = await fetch('/public/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

/**
 * Fetches and displays related products based on category.
 * @param {string} currentProductId - The ID of the product currently being viewed, to exclude it from the list.
 * @param {string} category - The category to fetch related products from.
 */
async function fetchAndDisplayRelatedProducts(currentProductId, category) {
    const container = document.getElementById('relatedProductsContainer');
    if (!container) return;

    container.innerHTML = `<p>Loading similar items...</p>`;

    try {
        const allProducts = await fetchAllProducts();

        // Filter products by category and exclude current product
        let relatedProducts = allProducts
            .filter(p => p.category === category && p.id !== currentProductId)
            .slice(0, 4);

        container.innerHTML = ''; // Clear loading message

        if (relatedProducts.length > 0) {
            relatedProducts.forEach(product => {
                const productCard = createProductCard(product);
                container.appendChild(productCard);
            });
        } else {
            container.innerHTML = `<p>No similar items found.</p>`;
        }
    } catch (error) {
        console.error("Error fetching related products:", error);
        container.innerHTML = `<p>Could not load related items.</p>`;
    }
}


function styleDescription(description) {
    const keywords = {
        'Storage': '💾',
        'Battery': '🔋',
        'Camera': '📷',
        'Display': '📱',
        'Processor': '⚙️',
        'RAM': '🧠'
    };

    let styledDescription = description;
    for (const keyword in keywords) {
        const regex = new RegExp(`(${keyword}:)`, 'gi');
        styledDescription = styledDescription.replace(regex, `<br><strong>${keywords[keyword]} $1</strong>`);
    }
    return styledDescription;
}

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const productDetailContainer = document.getElementById('productDetailContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    const productMainImage = document.getElementById('productMainImage');
    const thumbnailGallery = document.getElementById('thumbnailGallery');
    const productName = document.getElementById('productName');
    const productPrice = document.getElementById('productPrice');
    const productCategory = document.getElementById('productCategory');
    const productDescription = document.getElementById('productDescription');
    const addToCartBtn = document.getElementById('addToCartBtn');

    let currentProduct = null;

    if (!productId) {
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) {
            errorMessage.textContent = "Product ID is missing in the URL.";
            errorMessage.style.display = 'block';
        }
        showNotification("Product ID is missing in the URL.", 'error');
        return;
    }

    if (loadingMessage) loadingMessage.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';
    if (productDetailContainer) productDetailContainer.style.display = 'none';

    try {
        // Fetch all products and find the one matching the ID
        const allProducts = await fetchAllProducts();
        currentProduct = allProducts.find(p => p.id === productId);

        if (loadingMessage) loadingMessage.style.display = 'none';

        if (currentProduct) {
            const breadcrumbContainer = document.getElementById('breadcrumb-container');
            if (breadcrumbContainer) {
                const category = currentProduct.category || '';
                const subcategory = currentProduct.subcategory || '';
                const productNameText = currentProduct.name || 'Product';

                const breadcrumbParts = [];

                if (category) {
                    breadcrumbParts.push(`<a href="products.html?category=${encodeURIComponent(category)}">${category}</a>`);
                }
                if (subcategory) {
                    // Assuming the link for a subcategory also needs the parent category
                    breadcrumbParts.push(`<a href="products.html?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}">${subcategory}</a>`);
                }
                breadcrumbParts.push(`<span>${productNameText}</span>`);

                breadcrumbContainer.innerHTML = breadcrumbParts.join(' / ');
            }

            productName.textContent = currentProduct.name || 'N/A';
            
            // Dynamic font sizing for product name
            const nameLength = currentProduct.name ? currentProduct.name.length : 0;
            if (nameLength < 15) {
                productName.style.fontSize = '24px';
            } else if (nameLength >= 15 && nameLength <= 25) {
                productName.style.fontSize = '20px';
            } else {
                productName.style.fontSize = '16px';
            }
            productPrice.textContent = `Tzs ${parseFloat(currentProduct.price).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            // The old productCategory text is now replaced by the breadcrumb
            // productCategory.textContent = `Category: ${currentProduct.category || 'N/A'}`;
            productDescription.innerHTML = styleDescription(currentProduct.description || 'No description available.');

            productMainImage.src = 'img/placeholder-image.png';
            thumbnailGallery.innerHTML = '';

            if (currentProduct.imageUrls && Array.isArray(currentProduct.imageUrls) && currentProduct.imageUrls.length > 0) {
                productMainImage.src = currentProduct.imageUrls[0];

                currentProduct.imageUrls.forEach((imageUrl, index) => {
                    const thumb = document.createElement('img');
                    thumb.src = imageUrl;
                    thumb.alt = `${currentProduct.name} thumbnail ${index + 1}`;
                    thumb.classList.add('thumbnail');
                    if (index === 0) {
                        thumb.classList.add('active');
                    }
                    thumb.addEventListener('click', () => {
                        productMainImage.src = imageUrl;
                        document.querySelectorAll('.thumbnail-gallery .thumbnail').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                    });
                    thumbnailGallery.appendChild(thumb);
                });
            } else {
                productMainImage.src = 'img/placeholder-image.png';
            }

            productMainImage.alt = currentProduct.name || 'Product Image';
            addToCartBtn.setAttribute('data-product-id', productId);

            document.title = `NolMart - ${currentProduct.name}`;
            const metaDescriptionContent = `Discover ${currentProduct.name} at NolMart. ${currentProduct.description.substring(0, 100)}... Order now for easy delivery in Tanzania.`;

            let metaTag = document.querySelector('meta[name="description"]');
            if (!metaTag) {
                metaTag = document.createElement('meta');
                metaTag.name = "description";
                document.head.appendChild(metaTag);
            }
            metaTag.setAttribute('content', metaDescriptionContent);

            addToCartBtn.addEventListener('click', () => {
                if (currentProduct) {
                    addItemToCart(currentProduct);
                    showNotification(`${currentProduct.name} added to cart!`, 'success');
                }
            });

            if (productDetailContainer) productDetailContainer.style.display = 'grid';

            // Fetch and display related products
            if (currentProduct.category) {
                fetchAndDisplayRelatedProducts(productId, currentProduct.category);
            }

        } else {
            if (errorMessage) {
                errorMessage.textContent = "Product not found.";
                errorMessage.style.display = 'block';
            }
            showNotification("Product not found.", 'error');
        }
    } catch (error) {
        console.error("Error fetching product details:", error);
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) {
            errorMessage.textContent = `Error loading product details: ${error.message}. Please try again later.`;
            errorMessage.style.display = 'block';
        }
        showNotification(`Error loading product details: ${error.message}`, 'error');
    }
});
