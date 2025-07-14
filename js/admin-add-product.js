// js/admin-add-product.js

// --- IMPORTS: THESE ARE THE CRITICAL CHANGES ---
import { auth, storage, db } from './firebase-config.js'; // This is correct (relative path)
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js"; // <--- FIX: Changed to full CDN URL
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";   // <--- FIX: Changed to full CDN URL

document.addEventListener('DOMContentLoaded', () => {
    const addProductForm = document.getElementById('addProductForm');
    const productNameInput = document.getElementById('productName');
    const productPriceInput = document.getElementById('productPrice');
    const productDescriptionInput = document.getElementById('productDescription');
    const productCategoryInput = document.getElementById('productCategory');
    const productImagesInput = document.getElementById('productImages');
    const productVideoInput = document.getElementById('productVideo');
    const videoLinkInput = document.getElementById('videoLink');
    const messageElement = document.getElementById('message');

    // Logout functionality
    const adminLogoutButton = document.getElementById('adminLogoutButton');
    if (adminLogoutButton) {
        adminLogoutButton.addEventListener('click', async () => {
            try {
                await auth.signOut();
                window.location.href = 'admin-login.html';
            } catch (error) {
                console.error("Error logging out:", error);
                alert("Logout failed. Please try again.");
            }
        });
    }

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        showMessage("Processing product data...", "info"); // Initial message for overall process

        const productName = productNameInput.value;
        const productPrice = parseFloat(productPriceInput.value);
        const productDescription = productDescriptionInput.value;
        const productCategory = productCategoryInput.value;
        const productImages = productImagesInput.files;
        const productVideo = productVideoInput.files[0];
        const videoLink = videoLinkInput.value;

        let imageUrls = [];
        let videoUrl = '';

        try {
            // --- Firebase Storage Upload Logic ---
            showMessage("Uploading product files...", "info");

            // 1. Upload Product Images
            if (productImages.length > 0) {
                for (let i = 0; i < productImages.length; i++) {
                    const file = productImages[i];
                    const cleanedProductName = productName.replace(/[^a-zA-Z0-9-]/g, '_');
                    const storageRef = ref(storage, `product_images/${cleanedProductName}/${file.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, file);
                    await uploadTask;
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    imageUrls.push(downloadURL);
                    showMessage(`Uploaded image ${i + 1}/${productImages.length}...`, "info");
                }
            }

            // 2. Upload Product Video (if selected)
            if (productVideo) {
                const cleanedProductName = productName.replace(/[^a-zA-Z0-9-]/g, '_');
                const storageRef = ref(storage, `product_videos/${cleanedProductName}/${productVideo.name}`);
                const uploadTask = uploadBytesResumable(storageRef, productVideo);
                await uploadTask;
                videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
                showMessage("Uploaded product video...", "info");
            } else if (videoLink) {
                videoUrl = videoLink;
            }

            // --- Firestore Database Save Logic ---
            showMessage("Saving product details to database...", "info");

            const productData = {
                name: productName,
                price: productPrice,
                description: productDescription,
                category: productCategory,
                imageUrls: imageUrls,
                videoUrl: videoUrl,
                createdAt: new Date(), // Timestamp for creation
                updatedAt: new Date()  // Timestamp for last update (initially same as createdAt)
            };

            // Get a reference to the 'products' collection
            const productsCollectionRef = collection(db, "products");

            // Add the product data as a new document to the 'products' collection
            await addDoc(productsCollectionRef, productData);

            showMessage("Product added successfully!", "success");
            console.log("Product successfully added to Firestore:", productData);

            // Clear the form after successful submission
            addProductForm.reset();
            // Clear message after a short delay
            setTimeout(() => showMessage("", ""), 3000);

        } catch (error) {
            console.error("Error adding product:", error);
            // Display a more specific error message based on the stage
            let errorMessage = "An unknown error occurred.";
            if (error.code && error.message) {
                errorMessage = `Error: ${error.message}`;
            } else if (error.message) {
                errorMessage = error.message;
            }
            showMessage(`Error adding product: ${errorMessage}`, "error");
        }
    });

    // Helper function to display messages
    function showMessage(msg, type) {
        messageElement.textContent = msg;
        messageElement.className = ''; // Clear existing classes
        if (type) {
            messageElement.classList.add('message', type);
        }
    }
});