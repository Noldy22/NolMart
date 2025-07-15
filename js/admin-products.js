// js/admin-products.js

// Import db and auth instances from your local firebase-config.js
import { db, auth } from './firebase-config.js';

// IMPORTANT: Ensure these CDN URLs match the Firebase version used in firebase-config.js (11.10.0)
import { collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Import your custom notification and confirm modal functions
import { showNotification } from './notifications.js'; // ADDED THIS
import { showConfirmModal } from './confirm-modal.js'; // ADDED THIS


// Get references to HTML elements
const productsTableBody = document.querySelector('#productsTable tbody');
const loadingMessage = document.getElementById('loadingMessage');
const adminLogoutButton = document.getElementById('adminLogoutButton');
// REMOVED: const messageElement = document.getElementById('message'); // Reference to the message element
// REMOVED: displayMessage helper function, as showNotification will be used instead


// --- Authentication Check (Crucial for Admin Pages) ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in, proceed to fetch products
        console.log("Admin user detected, fetching products...");
        fetchProducts();
    } else {
        // No user is signed in, redirect to login page
        console.log("No admin user found. Redirecting to login page.");
        window.location.href = 'admin-login.html';
    }
});

// --- Logout Functionality ---
if (adminLogoutButton) {
    adminLogoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            console.log("Admin logged out successfully.");
            window.location.href = 'admin-login.html';
        } catch (error) {
            console.error("Error logging out:", error);
            showNotification("Error logging out: " + error.message, 'error'); // CHANGED
        }
    });
}

// --- Function to Fetch and Display Products ---
async function fetchProducts() {
    loadingMessage.style.display = 'block'; // Show loading message
    productsTableBody.innerHTML = ''; // Clear any existing table rows
    // REMOVED: messageElement.style.display = 'none'; // Hide any previous messages when loading new data
    // REMOVED: messageElement.className = ''; // Clear classes from previous messages

    try {
        const productsCollectionRef = collection(db, "products");
        const querySnapshot = await getDocs(productsCollectionRef);

        loadingMessage.style.display = 'none'; // Hide loading message after fetch attempt

        if (querySnapshot.empty) {
            productsTableBody.innerHTML = '<tr><td colspan="5">No products found. Add new products via the "Add New Product" link.</td></tr>';
            return;
        }

        querySnapshot.forEach((documentSnapshot) => {
            const product = documentSnapshot.data();
            const productId = documentSnapshot.id;

            const row = productsTableBody.insertRow();

            // --- Populate Cells ---
            // Name Cell
            row.insertCell().textContent = product.name || 'N/A';

            // Category Cell
            row.insertCell().textContent = product.category || 'N/A'; // Display product category

            // Price Cell (Currency changed to Tzs)
            row.insertCell().textContent = `Tzs ${(parseFloat(product.price) || 0).toFixed(2)}`;

            // Description Cell (Truncate long descriptions)
            const descCell = row.insertCell();
            const descriptionText = product.description || 'No description';
            descCell.textContent = descriptionText.length > 75
                ? descriptionText.substring(0, 75) + '...'
                : descriptionText;

            // Actions Cell (Edit and Delete Buttons)
            const actionsCell = row.insertCell();

            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-button');
            editButton.addEventListener('click', () => editProduct(productId));
            actionsCell.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', () => deleteProduct(productId, product.name));
            actionsCell.appendChild(deleteButton);
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        loadingMessage.style.display = 'none';
        productsTableBody.innerHTML = '<tr><td colspan="5">Error loading products. Please check your console for details.</td></tr>';
        showNotification("Failed to load products. " + error.message, 'error'); // CHANGED
    }
}

// --- Edit Product Function (Will Redirect for now) ---
function editProduct(productId) {
    console.log("Initiating edit for product ID:", productId);
    // Redirect to admin-add-product.html with the product ID as a URL parameter
    window.location.href = `admin-add-product.html?editId=${productId}`;
}

// --- Delete Product Function ---
async function deleteProduct(productId, productName) {
    // Use your custom confirmation modal instead of native confirm()
    const confirmed = await showConfirmModal(`Are you sure you want to delete "${productName}"? This action cannot be undone.`); // CHANGED
    
    if (confirmed) { // Proceed only if user confirmed via the custom modal
        try {
            const productDocRef = doc(db, "products", productId);
            await deleteDoc(productDocRef);
            console.log(`Product "${productName}" (ID: ${productId}) deleted successfully.`);
            showNotification(`Product "${productName}" deleted successfully!`, 'success'); // CHANGED
            fetchProducts(); // Re-fetch products to update the displayed list
        } catch (error) {
            console.error("Error deleting product:", error);
            showNotification("Error deleting product: " + error.message, 'error'); // CHANGED
        }
    } else {
        console.log(`Deletion of "${productName}" cancelled.`);
        // Optionally, show a "cancelled" notification if desired
        // showNotification(`Deletion of "${productName}" cancelled.`, 'info');
    }
}