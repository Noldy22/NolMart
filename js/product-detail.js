// js/product-detail.js

import { db } from './firebase-config.js'; // Import the Firestore instance
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"; // Import necessary Firestore functions
import { addItemToCart } from './cart.js'; // NEW: Import addItemToCart
import { showNotification } from './notifications.js'; // NEW: Import showNotification

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

    let currentProduct = null; // Store the fetched product data

    if (!productId) {
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) {
            errorMessage.textContent = "Product ID is missing in the URL.";
            errorMessage.style.display = 'block';
        }
        showNotification("Product ID is missing in the URL.", 'error'); // NEW: Show error notification
        return;
    }

    // Show loading message, hide others
    if (loadingMessage) loadingMessage.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';
    if (productDetailContainer) productDetailContainer.style.display = 'none';

    try {
        const productRef = doc(db, "products", productId);
        const productSnap = await getDoc(productRef);

        if (loadingMessage) loadingMessage.style.display = 'none'; // Hide loading once data is fetched

        if (productSnap.exists()) {
            currentProduct = productSnap.data(); // Store the product data
            currentProduct.id = productSnap.id; // Add ID to the product object

            // Populate the elements with product data
            productName.textContent = currentProduct.name || 'N/A';
            productPrice.textContent = `Tzs ${parseFloat(currentProduct.price).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            productCategory.textContent = `Category: ${currentProduct.category || 'N/A'}`;
            productDescription.textContent = currentProduct.description || 'No description available.';

            // Clear previous images and thumbnails
            productMainImage.src = 'img/placeholder-image.png'; // Set a default before loading
            thumbnailGallery.innerHTML = '';

            // Set product image and thumbnails
            if (currentProduct.imageUrls && Array.isArray(currentProduct.imageUrls) && currentProduct.imageUrls.length > 0) {
                productMainImage.src = currentProduct.imageUrls[0]; // Set main image to the first one

                // Create thumbnails for all images
                currentProduct.imageUrls.forEach((imageUrl, index) => {
                    const thumb = document.createElement('img');
                    thumb.src = imageUrl;
                    thumb.alt = `${currentProduct.name} thumbnail ${index + 1}`;
                    thumb.classList.add('thumbnail');
                    if (index === 0) {
                        thumb.classList.add('active'); // Highlight the first thumbnail
                    }
                    // Add click event to change the main image
                    thumb.addEventListener('click', () => {
                        productMainImage.src = imageUrl;
                        // Update active state on thumbnails
                        document.querySelectorAll('.thumbnail-gallery .thumbnail').forEach(t => t.classList.remove('active'));
                        thumb.classList.add('active');
                    });
                    thumbnailGallery.appendChild(thumb);
                });
            } else {
                productMainImage.src = 'img/placeholder-image.png'; // Fallback image if none are provided
            }

            productMainImage.alt = currentProduct.name || 'Product Image';

            // Set data-product-id for the add to cart button (if needed, though we have currentProduct now)
            addToCartBtn.setAttribute('data-product-id', productId);

            // Dynamically set page title and meta description for SEO
            document.title = `NolMart - ${currentProduct.name}`;

            const metaDescriptionContent = `Discover ${currentProduct.name} at NolMart. ${currentProduct.description.substring(0, 100)}... Order now for easy delivery in Tanzania.`;
            
            // Find existing meta description tag or create a new one
            let metaTag = document.querySelector('meta[name="description"]');
            if (!metaTag) {
                metaTag = document.createElement('meta');
                metaTag.name = "description";
                document.head.appendChild(metaTag);
            }
            metaTag.setAttribute('content', metaDescriptionContent);

            // Add event listener for "Add to Cart" button
            addToCartBtn.addEventListener('click', () => {
                if (currentProduct) {
                    addItemToCart(currentProduct);
                    showNotification(`${currentProduct.name} added to cart!`, 'success');
                }
            });

            if (productDetailContainer) productDetailContainer.style.display = 'grid'; // Show the content
        } else {
            if (errorMessage) {
                errorMessage.textContent = "Product not found.";
                errorMessage.style.display = 'block';
            }
            showNotification("Product not found.", 'error'); // NEW: Show error notification
        }
    } catch (error) {
        console.error("Error fetching product details:", error);
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) {
            errorMessage.textContent = `Error loading product details: ${error.message}. Please try again later.`;
            errorMessage.style.display = 'block';
        }
        showNotification(`Error loading product details: ${error.message}`, 'error'); // NEW: Show error notification
    }
});