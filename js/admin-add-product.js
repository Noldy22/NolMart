// js/admin-add-product.js

// --- UPDATED IMPORTS ---
import { auth, storage, db } from './firebase-config.js';

// Change these import paths to the full CDN URLs
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js"; // <-- FIX THIS LINE
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";   // <-- FIX THIS LINE (for when we use Firestore)

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
                await auth.signOut(); // Use the directly imported 'auth' instance
                window.location.href = 'admin-login.html'; // Redirect to login page
            } catch (error) {
                console.error("Error logging out:", error);
                alert("Logout failed. Please try again.");
            }
        });
    }

    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        showMessage("Uploading product files...", "info"); // Show an info message

        const productName = productNameInput.value;
        const productPrice = parseFloat(productPriceInput.value);
        const productDescription = productDescriptionInput.value;
        const productCategory = productCategoryInput.value;
        const productImages = productImagesInput.files; // FileList object
        const productVideo = productVideoInput.files[0]; // Single File object
        const videoLink = videoLinkInput.value;

        // --- Start of Firebase Storage Upload Logic ---
        let imageUrls = [];
        let videoUrl = '';

        try {
            // 1. Upload Product Images
            if (productImages.length > 0) {
                for (let i = 0; i < productImages.length; i++) {
                    const file = productImages[i];
                    // Ensure product name is clean for path, replace spaces or special chars if needed
                    const cleanedProductName = productName.replace(/[^a-zA-Z0-9-]/g, '_'); // Basic cleaning
                    const storageRef = ref(storage, `product_images/${cleanedProductName}/${file.name}`);
                    const uploadTask = uploadBytesResumable(storageRef, file);

                    await uploadTask; // Wait for the upload to complete
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    imageUrls.push(downloadURL);
                    showMessage(`Uploaded image ${i + 1}/${productImages.length}...`, "info");
                }
            }

            // 2. Upload Product Video (if selected)
            if (productVideo) {
                const cleanedProductName = productName.replace(/[^a-zA-Z0-9-]/g, '_'); // Basic cleaning
                const storageRef = ref(storage, `product_videos/${cleanedProductName}/${productVideo.name}`);
                const uploadTask = uploadBytesResumable(storageRef, productVideo);
                await uploadTask; // Wait for the upload to complete
                videoUrl = await getDownloadURL(uploadTask.snapshot.ref);
                showMessage("Uploaded product video...", "info");
            } else if (videoLink) {
                videoUrl = videoLink; // Use external link if no file uploaded
            }

            showMessage("All files uploaded successfully!", "success");

            // --- End of Firebase Storage Upload Logic ---

            // At this point, imageUrls and videoUrl contain the paths needed for Firestore.
            // This is where we will call the function to save to Firestore in the next checkpoint.
            console.log("Product Data to Save:", {
                name: productName,
                price: productPrice,
                description: productDescription,
                category: productCategory,
                imageUrls: imageUrls,
                videoUrl: videoUrl,
                createdAt: new Date() // Add a timestamp for when the product was added
            });

            // For now, clear the form after successful "upload" (simulated for now)
            // The Firestore save will happen here in the next step
            // addProductForm.reset();
            // setTimeout(() => showMessage("", ""), 3000);

        } catch (error) {
            console.error("Error during file upload:", error);
            showMessage(`Error uploading files: ${error.message}`, "error");
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