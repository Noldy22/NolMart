// js/admin-products.js

import { db, auth } from './firebase-config.js'; // Import db and auth instances
import { collection, getDocs, doc, deleteDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";

const productsTableBody = document.querySelector('#productsTable tbody');
const loadingMessage = document.getElementById('loadingMessage'); // Get the loading message element
const adminLogoutButton = document.getElementById('adminLogoutButton'); // Corrected ID from your HTML

// --- Authentication Check ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Admin logged in:", user.uid);
        fetchProducts(); // Fetch products only if admin is logged in
    } else {
        console.log("No admin logged in. Redirecting to login.");
        window.location.href = 'admin-login.html'; // Redirect to login if not authenticated
    }
});

// --- Logout Functionality ---
if (adminLogoutButton) { // Check if the button exists on this page
    adminLogoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut(auth);
            console.log("User logged out successfully.");
            window.location.href = 'admin-login.html'; // Redirect after logout
        } catch (error) {
            console.error("Error logging out:", error);
            alert("Error logging out: " + error.message);
        }
    });
}

// --- Fetch Products from Firestore ---
async function fetchProducts() {
    loadingMessage.style.display = 'block'; // Show loading message
    productsTableBody.innerHTML = ''; // Clear existing rows

    try {
        const productsCollectionRef = collection(db, "products");
        const querySnapshot = await getDocs(productsCollectionRef);

        loadingMessage.style.display = 'none'; // Hide loading message

        if (querySnapshot.empty) {
            productsTableBody.innerHTML = '<tr><td colspan="5">No products found.</td></tr>';
            return;
        }

        querySnapshot.forEach((doc) => {
            const product = doc.data();
            const productId = doc.id; // Get the document ID for editing/deleting

            const row = productsTableBody.insertRow();

            // Image Column
            const imgCell = row.insertCell();
            if (product.imageUrl) {
                const img = document.createElement('img');
                img.src = product.imageUrl;
                img.alt = product.name;
                img.classList.add('product-thumbnail');
                imgCell.appendChild(img);
            } else {
                imgCell.textContent = 'No Image';
            }

            // Name Column
            row.insertCell().textContent = product.name;

            // Price Column
            row.insertCell().textContent = `$${parseFloat(product.price || 0).toFixed(2)}`; // Handle potential undefined price

            // Description Column (truncate if too long)
            const descCell = row.insertCell();
            descCell.textContent = product.description && product.description.length > 50
                ? product.description.substring(0, 50) + '...'
                : product.description || 'No description'; // Handle potential undefined description

            // Actions Column (Edit and Delete Buttons)
            const actionsCell = row.insertCell();

            // Edit Button
            const editButton = document.createElement('button');
            editButton.textContent = 'Edit';
            editButton.classList.add('edit-button');
            editButton.addEventListener('click', () => editProduct(productId));
            actionsCell.appendChild(editButton);

            // Delete Button
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Delete';
            deleteButton.classList.add('delete-button');
            deleteButton.addEventListener('click', () => deleteProduct(productId, product.name));
            actionsCell.appendChild(deleteButton);
        });

    } catch (error) {
        console.error("Error fetching products:", error);
        loadingMessage.style.display = 'none'; // Hide loading message even on error
        productsTableBody.innerHTML = '<tr><td colspan="5">Error loading products. Please try again.</td></tr>';
    }
}

// --- Edit Product Function ---
function editProduct(productId) {
    console.log("Edit product with ID:", productId);
    window.location.href = `admin-add-product.html?editId=${productId}`;
}

// --- Delete Product Function ---
async function deleteProduct(productId, productName) {
    if (confirm(`Are you sure you want to delete "${productName}"? This action cannot be undone.`)) {
        try {
            const productDocRef = doc(db, "products", productId);
            await deleteDoc(productDocRef);
            console.log(`Product with ID: ${productId} deleted successfully.`);
            alert(`Product "${productName}" deleted successfully!`);
            fetchProducts(); // Re-fetch products to update the list
        } catch (error) {
            console.error("Error deleting product:", error);
            alert("Error deleting product: " + error.message);
        }
    }
}