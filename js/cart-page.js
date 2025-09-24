// js/cart-page.js

import {
    getCart,
    removeItemFromCart,
    updateItemQuantity,
    getCartTotalPrice,
    clearCart
} from './cart.js';
import { showConfirmModal } from './confirm-modal.js';
import { showNotification } from './notifications.js'; // Import notification function
import { WHATSAPP_NUMBER } from './config.js'; // Import the centralized WhatsApp number

// Get DOM elements for the cart page
const cartItemsContainer = document.getElementById('cartItemsContainer');
const cartTotalPriceSpan = document.getElementById('cartTotalPrice');
const emptyCartMessage = document.getElementById('emptyCartMessage');
const proceedToCheckoutBtn = document.getElementById('proceedToCheckoutBtn');
const cartSummaryAndActions = document.getElementById('cart-summary-and-actions');

/**
 * Renders the current state of the shopping cart on the cart.html page.
 */
function renderCart() {
    const cart = getCart(); // Get current cart items
    cartItemsContainer.innerHTML = ''; // Clear previous items

    if (cart.length === 0) {
        // Show empty cart message and hide the summary/checkout button
        emptyCartMessage.style.display = 'block';
        cartItemsContainer.style.display = 'none';
        if (cartSummaryAndActions) cartSummaryAndActions.style.display = 'none';
        return;
    } 
    
    // Hide empty cart message and show cart content
    emptyCartMessage.style.display = 'none';
    cartItemsContainer.style.display = 'block';
    if (cartSummaryAndActions) cartSummaryAndActions.style.display = 'block';

    // Loop through cart items and create HTML for each
    cart.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.classList.add('cart-item');
        itemElement.setAttribute('data-product-id', item.id); // Set data-id for easy lookup

        const itemTotal = (item.price * item.quantity).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        itemElement.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
            <div class="cart-item-details">
                <h4>${item.name}</h4>
                <p>Unit Price: Tzs ${parseFloat(item.price).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                <p>Item Total: Tzs ${itemTotal}</p>
            </div>
            <div class="cart-item-quantity">
                <input type="number" value="${item.quantity}" min="1"
                        data-product-id="${item.id}" class="quantity-input">
            </div>
            <div class="cart-item-remove">
                <button class="remove-item-btn" data-product-id="${item.id}"><i class="fas fa-trash-alt"></i></button>
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
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', (event) => {
            const productId = event.target.dataset.productId;
            const newQuantity = parseInt(event.target.value, 10);
            if (!isNaN(newQuantity) && newQuantity >= 1) {
                updateItemQuantity(productId, newQuantity);
            } else {
                event.target.value = getCart().find(item => item.id === productId)?.quantity || 1;
            }
        });
    });

    document.querySelectorAll('.remove-item-btn').forEach(button => {
        button.addEventListener('click', async (event) => {
            // Use currentTarget to ensure we get the button, even if user clicks the icon inside
            const productId = event.currentTarget.dataset.productId;
            
            const confirmed = await showConfirmModal("Are you sure you want to remove this item from your cart?");
            
            if (confirmed) {
                removeItemFromCart(productId);
                showNotification('Item removed from cart.', 'success');
            }
        });
    });
}

// --- Event Listeners for Page Load and Cart Updates ---

document.addEventListener('DOMContentLoaded', renderCart);

window.addEventListener('cartUpdated', () => {
    console.log("Cart updated event received. Re-rendering cart page.");
    renderCart();
});

// Event listener for the "Proceed to Checkout" button
if (proceedToCheckoutBtn) {
    proceedToCheckoutBtn.addEventListener('click', () => {
        const cart = getCart();
        if (cart.length === 0) {
            showNotification('Your cart is empty. Please add items before checking out.', 'error');
            return;
        }

        let message = "Hello, I'd like to place an order for the following items from NolMart:\n\n";

        cart.forEach((item, index) => {
            const itemTotal = (item.price * item.quantity).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            message += `${index + 1}. ${item.name}\n`;
            message += `    Quantity: ${item.quantity}\n`;
            message += `    Item Total: Tzs ${itemTotal}\n\n`;
        });

        const overallTotal = getCartTotalPrice().toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        message += `*Total Order Value: Tzs ${overallTotal}*\n\n`;
        message += "Please confirm availability and guide me on payment and delivery. Thank you!";

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;

        // --- ENHANCED CHECKOUT FLOW ---
        // 1. Show a notification that the order is being prepared for WhatsApp.
        showNotification('Preparing your order for WhatsApp...', 'success');

        // 2. Clear the cart. This will automatically trigger the 'cartUpdated' event to re-render the page.
        clearCart();

        // 3. Redirect the user to WhatsApp after a short delay to allow them to see the notification.
        setTimeout(() => {
            window.location.href = whatsappUrl;
        }, 1500); // 1.5-second delay
    });
}