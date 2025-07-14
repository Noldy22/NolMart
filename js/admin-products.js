// js/admin-products.js

// Import db and auth instances from your local firebase-config.js
import { db, auth } from './firebase-config.js';

// IMPORTANT: Ensure these CDN URLs match the Firebase version used in firebase-config.js (11.10.0)
import { collection, getDocs, doc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";


// Get references to HTML elements
const productsTableBody = document.querySelector('#productsTable tbody');
const loadingMessage = document.getElementById('loadingMessage');
const adminLogoutButton = document.getElementById('adminLogoutButton');
const messageElement = document.getElementById('message'); // Reference to the message element


// --- Helper function to display messages ---
function displayMessage(msg, type, duration = 3000) {
    messageElement.textContent = msg;
    messageElement.className = 'message'; // Reset classes and add 'message' base class
    messageElement.style.display = 'block'; // Ensure it's visible

    if (type === 'success') {
        messageElement.classList.add('success');
    } else if (type === 'error') {
        messageElement.classList.add('error');
    }

    // DIAGNOSTIC: Log the classes applied to the message element
    console.log(`Message displayed: "${msg}" with classes: "${messageElement.className}"`);

    // Hide message after a duration
    setTimeout(() => {
        messageElement.style.display = 'none';
        messageElement.textContent = '';
        messageElement.className = ''; // Clear all classes
    }, duration);
}


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
            displayMessage("Error logging out: " + error.message, 'error');
        }
    });
}

// --- Function to Fetch and Display Products ---
async function fetchProducts() {
    loadingMessage.style.display = 'block'; // Show loading message
    productsTableBody.innerHTML = ''; // Clear any existing table rows
    messageElement.style.display = 'none'; // Hide any previous messages when loading new data
    messageElement.className = ''; // Clear classes from previous messages

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
        displayMessage("Failed to load products. " + error.message, 'error');
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
    if (confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
        try {
            const productDocRef = doc(db, "products", productId);
            await deleteDoc(productDocRef);
            console.log(`Product "${productName}" (ID: ${productId}) deleted successfully.`);
            displayMessage(`Product "${productName}" deleted successfully!`, 'success');
            fetchProducts(); // Re-fetch products to update the displayed list
        } catch (error) {
            console.error("Error deleting product:", error);
            displayMessage("Error deleting product: " + error.message, 'error');
        }
    }
}