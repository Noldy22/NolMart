// js/cart.js

const CART_STORAGE_KEY = 'nolmart_cart';

// --- Helper Functions to Get/Save Cart from Local Storage ---

/**
 * Retrieves the current cart from Local Storage.
 * @returns {Array<Object>} An array of cart items, or an empty array if no cart exists.
 */
function getCart() {
    try {
        const cartJson = localStorage.getItem(CART_STORAGE_KEY);
        return cartJson ? JSON.parse(cartJson) : [];
    } catch (error) {
        console.error("Error parsing cart from Local Storage:", error);
        return []; // Return empty cart on error
    }
}

/**
 * Saves the current cart array to Local Storage.
 * @param {Array<Object>} cart - The cart array to save.
 */
function saveCart(cart) {
    try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
        // Dispatch a custom event whenever the cart is updated
        window.dispatchEvent(new CustomEvent('cartUpdated'));
    } catch (error) {
        console.error("Error saving cart to Local Storage:", error);
    }
}

// --- Cart Modification Functions ---

/**
 * Adds a product to the cart or increments its quantity if it already exists.
 * @param {Object} product - The product object to add (must have id, name, price, imageUrls).
 * @param {number} [quantity=1] - The quantity to add.
 * @returns {Array<Object>} The updated cart.
 */
export function addItemToCart(product, quantity = 1) {
    if (!product || !product.id || !product.name || typeof product.price === 'undefined') {
        console.error("Invalid product object provided to addItemToCart:", product);
        return getCart(); // Return current cart without changes
    }

    const cart = getCart();
    const existingItemIndex = cart.findIndex(item => item.id === product.id);

    if (existingItemIndex > -1) {
        // Item already in cart, increment quantity
        cart[existingItemIndex].quantity += quantity;
    } else {
        // Item not in cart, add new item
        const imageUrl = (product.imageUrls && product.imageUrls.length > 0) ? product.imageUrls[0] : 'img/placeholder-image.png';
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            imageUrl: imageUrl, // Store the first image URL for display
            quantity: quantity
        });
    }
    saveCart(cart);
    console.log("Item added/updated in cart:", product.name, "New cart:", cart);
    return cart;
}

/**
 * Removes an item from the cart.
 * @param {string} productId - The ID of the product to remove.
 * @returns {Array<Object>} The updated cart.
 */
export function removeItemFromCart(productId) {
    let cart = getCart();
    cart = cart.filter(item => item.id !== productId);
    saveCart(cart);
    console.log("Item removed from cart. New cart:", cart);
    return cart;
}

/**
 * Updates the quantity of a specific item in the cart.
 * If newQuantity is 0 or less, the item is removed.
 * @param {string} productId - The ID of the product to update.
 * @param {number} newQuantity - The new quantity for the item.
 * @returns {Array<Object>} The updated cart.
 */
export function updateItemQuantity(productId, newQuantity) {
    let cart = getCart();
    const itemIndex = cart.findIndex(item => item.id === productId);

    if (itemIndex > -1) {
        if (newQuantity <= 0) {
            // Remove item if quantity is 0 or less
            cart.splice(itemIndex, 1);
        } else {
            // Update quantity
            cart[itemIndex].quantity = newQuantity;
        }
    }
    saveCart(cart);
    console.log("Item quantity updated. New cart:", cart);
    return cart;
}

// --- Cart Information Functions ---

/**
 * Gets the total number of unique items in the cart (not total quantity).
 * @returns {number} The number of unique items in the cart.
 */
export function getCartItemCount() {
    const cart = getCart();
    return cart.length;
}

/**
 * Gets the total quantity of all items in the cart.
 * @returns {number} The sum of all item quantities in the cart.
 */
export function getCartTotalQuantity() {
    const cart = getCart();
    return cart.reduce((total, item) => total + item.quantity, 0);
}


/**
 * Calculates the total price of all items in the cart.
 * @returns {number} The total monetary value of the cart.
 */
export function getCartTotalPrice() {
    const cart = getCart();
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
}

/**
 * Clears all items from the cart.
 */
export function clearCart() {
    saveCart([]); // Save an empty array
    console.log("Cart cleared.");
}

// Re-export getCart as well, so other modules can read the cart directly
export { getCart };