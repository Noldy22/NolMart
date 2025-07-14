// js/cart-page.js

import {
    getCart,
    addItemToCart,
    removeItemFromCart,
    updateItemQuantity,
    getCartTotalPrice,
    getCartTotalQuantity,
    clearCart // We will use this now
} from './cart.js'; // Import all necessary cart functions

// --- CONFIGURATION ---
const WHATSAPP_NUMBER = '255695557358'; // Your WhatsApp number without '+' or spaces

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

        // Calculate item total for display
        const itemTotal = (item.price * item.quantity).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        itemElement.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>Unit Price: Tzs ${parseFloat(item.price).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p>Item Total: Tzs ${itemTotal}</p>
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
});

// Event listener for the "Proceed to Checkout" button
proceedToCheckoutBtn.addEventListener('click', () => {
    const cart = getCart();
    if (cart.length === 0) {
        alert('Your cart is empty. Please add items before checking out.');
        return;
    }

    let message = "Hello, I'd like to place an order for the following items from NolMart:\n\n";

    cart.forEach((item, index) => {
        const itemTotal = (item.price * item.quantity).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        message += `${index + 1}. ${item.name}\n`;
        message += `   Quantity: ${item.quantity}\n`;
        message += `   Unit Price: Tzs ${parseFloat(item.price).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n`;
        message += `   Item Total: Tzs ${itemTotal}\n\n`;
    });

    const overallTotal = getCartTotalPrice().toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    message += `*Total Order Value: Tzs ${overallTotal}*\n\n`;
    message += "Please confirm availability and guide me on payment and delivery. Thank you!";

    // Encode the message for URL
    const encodedMessage = encodeURIComponent(message);

    // Construct the WhatsApp URL
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

    // Redirect the user to WhatsApp
    window.location.href = whatsappUrl;

    // Optional: Clear the cart after redirecting to WhatsApp
    // You might want to ask the user for confirmation before clearing,
    // or clear it on a "thank you" page after they return from WhatsApp.
    // For now, let's just clear it to ensure they don't re-order the same items easily.
    // clearCart();
    // alert("Your order details have been sent to WhatsApp. Your cart has been cleared.");
    // renderCart(); // Re-render to show empty cart
});