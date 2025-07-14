// js/cart-page.js

import {
    getCart,
    addItemToCart, // Potentially useful if we add + buttons later
    removeItemFromCart,
    updateItemQuantity,
    getCartTotalPrice,
    getCartTotalQuantity,
    clearCart // For a potential "Clear Cart" button later
} from './cart.js'; // Import all necessary cart functions

// Get DOM elements for the cart page
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartTotalPriceSpan = document.getElementById('cartTotalPrice');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');

/**
 * Renders the current state of the shopping cart on the cart.html page.
 */
function renderCart() {
    const cart = getCart(); // Get current cart items
    cartItemsContainer.innerHTML = ''; // Clear previous items

    if (cart.length === 0) {
        // Show empty cart message
        emptyCartMessage.style.display = 'block';
        cartItemsContainer.style.display = 'none';
        proceedToCheckoutBtn.style.display = 'none'; // Hide checkout button if cart is empty
        cartTotalPriceSpan.textContent = 'Tzs 0.00'; // Ensure total is zero
        return;
    } else {
        // Hide empty cart message and show cart content
        emptyCartMessage.style.display = 'none';
        cartItemsContainer.style.display = 'block';
        proceedToCheckoutBtn.style.display = 'block';
    }

    // Loop through cart items and create HTML for each
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.setAttribute('data-product-id', item.id); // Set data-id for easy lookup

        itemElement.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>Tzs ${parseFloat(item.price).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
            <div class="cart-item-quantity">
                <label for="qty-${item.id}">Quantity:</label>
                <input type="number" id="qty-${item.id}" value="${item.quantity}" min="1"
                       data-product-id="${item.id}" class="quantity-input">
            </div>
            <div class="cart-item-remove">
                <button class="button remove-item-btn" data-product-id="${item.id}">Remove</button>
            </div>
        `;
        cartItemsContainer.appendChild(itemElement);
    });

    // Update total price display
    cartTotalPriceSpan.textContent = `Tzs ${getCartTotalPrice().toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Attach event listeners to the new quantity inputs and remove buttons
    attachCartItemListeners();
}

/**
 * Attaches event listeners to quantity inputs and remove buttons after cart is rendered.
 */
function attachCartItemListeners() {
    // Event listeners for quantity changes
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (event) => {
            const productId = event.target.dataset.productId;
            const newQuantity = parseInt(event.target.value, 10);
            if (!isNaN(newQuantity) && newQuantity >= 1) {
                updateItemQuantity(productId, newQuantity);
                // renderCart() will be called by the 'cartUpdated' event dispatched from cart.js
            } else {
                // If invalid quantity, revert to current valid quantity
                event.target.value = getCart().find(item => item.id === productId)?.quantity || 1;
            }
        });
    });

    // Event listeners for remove buttons
    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            const productId = event.target.dataset.productId;
            if (confirm("Are you sure you want to remove this item from your cart?")) {
                removeItemFromCart(productId);
                // renderCart() will be called by the 'cartUpdated' event dispatched from cart.js
            }
        });
    });
}

// --- Event Listeners for Page Load and Cart Updates ---

// Render the cart when the page loads
document.addEventListener('DOMContentLoaded', renderCart);

// Listen for custom 'cartUpdated' event to re-render the cart
// This ensures the cart page updates if items are added/removed from other pages
window.addEventListener('cartUpdated', () => {
    console.log("Cart updated event received. Re-rendering cart page.");
    renderCart();
    // Potentially update the header cart count as well, if main.js isn't handling it
    // For now, main.js should handle the header count via its own 'cartUpdated' listener.
});

// Event listener for the "Proceed to Checkout" button
proceedToCheckoutBtn.addEventListener('click', () => {
    // For now, just an alert. We'll implement WhatsApp integration later.
    const cart = getCart();
    if (cart.length > 0) {
        alert('Proceeding to checkout! (WhatsApp integration coming soon)');
        // In the future, this will generate the WhatsApp message and redirect.
    } else {
        alert('Your cart is empty. Please add items before checking out.');
    }
});