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

// Optional: Add a console log here to confirm 'db' is what we expect
// console.log("admin-products.js - Firestore DB instance:", db);


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
            alert("Error logging out: " + error.message);
        }
    });
}

// --- Function to Fetch and Display Products ---
async function fetchProducts() {
    loadingMessage.style.display = 'block'; // Show loading message
    productsTableBody.innerHTML = ''; // Clear any existing table rows

    try {
        // This is where the error occurred because 'collection' from 10.4.0
        // didn't recognize 'db' from 11.10.0
        const productsCollectionRef = collection(db, "products");
        const querySnapshot = await getDocs(productsCollectionRef); // Get all documents from 'products' collection

        loadingMessage.style.display = 'none'; // Hide loading message after fetch attempt

        if (querySnapshot.empty) {
            productsTableBody.innerHTML = '<tr><td colspan="5">No products found. Add new products via the "Add New Product" link.</td></tr>';
            return; // Exit if no products
        }

        // Iterate over each product document
        querySnapshot.forEach((documentSnapshot) => {
            const product = documentSnapshot.data(); // Get the actual data of the product
            const productId = documentSnapshot.id; // Get the unique ID of the document

            const row = productsTableBody.insertRow(); // Create a new table row

            // --- Populate Cells ---
            // Image Cell
            const imgCell = row.insertCell();
            if (product.imageUrl) {
                const img = document.createElement('img');
                img.src = product.imageUrl;
                img.alt = product.name;
                img.classList.add('product-thumbnail');
                imgCell.appendChild(img);
            } else {
                imgCell.textContent = 'No Image'; // Fallback if no image URL
            }

            // Name Cell
            row.insertCell().textContent = product.name || 'N/A'; // Use 'N/A' if name is missing

            // Price Cell
            row.insertCell().textContent = `$${(parseFloat(product.price) || 0).toFixed(2)}`; // Format price, default to 0 if invalid

            // Description Cell (Truncate long descriptions)
            const descCell = row.insertCell();
            const descriptionText = product.description || 'No description';
            descCell.textContent = descriptionText.length > 75 // Adjust length as needed
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
        loadingMessage.style.display = 'none'; // Hide loading message even on error
        productsTableBody.innerHTML = '<tr><td colspan="5">Error loading products. Please check your console for details.</td></tr>';
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
            alert(`Product "${productName}" deleted successfully!`);
            fetchProducts(); // Re-fetch products to update the displayed list
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Error deleting product: " + error.message);
        }
    }
}