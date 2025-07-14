// js/product-detail.js

import { db } from './firebase-config.js'; // Import the Firestore instance
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"; // Import necessary Firestore functions

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');

    const productDetailContainer = document.getElementById('productDetailContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    const productMainImage = document.getElementById('productMainImage');
    const productName = document.getElementById('productName');
    const productPrice = document.getElementById('productPrice');
    const productCategory = document.getElementById('productCategory');
    const productDescription = document.getElementById('productDescription');
    const addToCartBtn = document.getElementById('addToCartBtn');

    if (!productId) {
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) {
            errorMessage.textContent = "Product ID is missing in the URL.";
            errorMessage.style.display = 'block';
        }
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
            const product = productSnap.data();
            
            // Populate the elements with product data
            productName.textContent = product.name || 'N/A';
            productPrice.textContent = `Tzs ${parseFloat(product.price).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            productCategory.textContent = `Category: ${product.category || 'N/A'}`;
            productDescription.textContent = product.description || 'No description available.';

            // Set product image
            if (product.imageUrls && product.imageUrls.length > 0) {
                productMainImage.src = product.imageUrls[0];
            } else {
                productMainImage.src = 'img/placeholder-image.png'; // Fallback image
            }
            productMainImage.alt = product.name || 'Product Image';

            // Set data-product-id for the add to cart button
            addToCartBtn.setAttribute('data-product-id', productId);

            if (productDetailContainer) productDetailContainer.style.display = 'grid'; // Show the content
        } else {
            if (errorMessage) {
                errorMessage.textContent = "Product not found.";
                errorMessage.style.display = 'block';
            }
        }
    } catch (error) {
        console.error("Error fetching product details:", error);
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) {
            errorMessage.textContent = `Error loading product details: ${error.message}. Please try again later.`;
            errorMessage.style.display = 'block';
        }
    }
});