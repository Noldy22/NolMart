// js/admin-add-product.js

// --- IMPORTS ---
import { auth, storage, db } from './firebase-config.js';
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import { collection, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js"; // Added doc, getDoc, updateDoc
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js"; // Added onAuthStateChanged, signOut

// Get references to HTML elements
const addProductForm = document.getElementById('addProductForm');
const productNameInput = document.getElementById('productName');
const productPriceInput = document.getElementById('productPrice');
const productDescriptionInput = document.getElementById('productDescription');
const productCategoryInput = document.getElementById('productCategory');
const productImagesInput = document.getElementById('productImages');
const productVideoInput = document.getElementById('productVideo');
const videoLinkInput = document.getElementById('videoLink');
const messageElement = document.getElementById('message');
const formTitle = document.getElementById('formTitle'); // New: Reference to the form title
const submitButton = document.getElementById('submitButton'); // New: Reference to the submit button
const currentImagesDisplay = document.getElementById('currentImagesDisplay'); // New: To show existing images
const currentVideoDisplay = document.getElementById('currentVideoDisplay'); // New: To show existing video

let isEditMode = false;
let productId = null;
let currentProductData = {}; // Stores the product data when in edit mode

// --- Helper function to display messages ---
function showMessage(msg, type, duration = 3000) {
    messageElement.textContent = msg;
    messageElement.className = ''; // Clear existing classes
    messageElement.style.display = 'block'; // Ensure it's visible

    if (type) {
        messageElement.classList.add('message', type);
    }

    // Hide message after a duration
    if (duration > 0) {
        setTimeout(() => {
            messageElement.style.display = 'none';
            messageElement.textContent = '';
            messageElement.className = ''; // Clear classes
        }, duration);
    }
}

// --- Authentication Check (Crucial for Admin Pages) ---
// This ensures only authenticated users can access and use this page
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Admin user detected.");
        checkEditModeAndLoadProduct(); // Proceed to check for edit mode or just add product
    } else {
        console.log("No admin user found. Redirecting to login page.");
        window.location.href = 'admin-login.html';
    }
});

// --- Logout functionality ---
const adminLogoutButton = document.getElementById('adminLogoutButton');
if (adminLogoutButton) {
    adminLogoutButton.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent default link behavior
        try {
            await signOut(auth);
            console.log("Admin logged out successfully.");
            window.location.href = 'admin-login.html';
        } catch (error) {
            console.error("Error logging out:", error);
            showMessage("Logout failed. Please try again.", "error");
        }
    });
}

// --- Check for Edit Mode and Load Product Data ---
async function checkEditModeAndLoadProduct() {
    const urlParams = new URLSearchParams(window.location.search);
    productId = urlParams.get('editId');

    if (productId) {
        isEditMode = true;
        formTitle.textContent = 'Edit Product';
        submitButton.textContent = 'Save Changes';
        showMessage('Loading product data...', 'info', 0); // Show indefinitely until loaded/error

        try {
            const productDocRef = doc(db, 'products', productId);
            const productSnap = await getDoc(productDocRef);

            if (productSnap.exists()) {
                currentProductData = productSnap.data();
                populateForm(currentProductData);
                showMessage('Product data loaded successfully.', 'success');
            } else {
                showMessage('Product not found for editing. Redirecting...', 'error');
                console.error("Product with ID " + productId + " not found.");
                // Redirect if product doesn't exist
                setTimeout(() => window.location.href = 'admin-products.html', 2000);
            }
        } catch (error) {
            console.error("Error fetching product for edit:", error);
            showMessage("Error loading product: " + error.message, 'error');
        }
    } else {
        isEditMode = false;
        formTitle.textContent = 'Add New Product';
        submitButton.textContent = 'Add Product';
    }
}

// --- Populate Form Fields in Edit Mode ---
function populateForm(product) {
    productNameInput.value = product.name || '';
    productPriceInput.value = product.price || '';
    productDescriptionInput.value = product.description || '';
    productCategoryInput.value = product.category || '';
    videoLinkInput.value = product.videoLink || '';

    // Display existing images
    currentImagesDisplay.innerHTML = ''; // Clear previous previews
    if (product.imageUrls && product.imageUrls.length > 0) {
        const title = document.createElement('h4');
        title.textContent = 'Current Images:';
        currentImagesDisplay.appendChild(title);
        product.imageUrls.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Product Image';
            img.style.maxWidth = '100px';
            img.style.maxHeight = '100px';
            img.style.margin = '5px';
            img.style.border = '1px solid #ddd';
            currentImagesDisplay.appendChild(img);
        });
    }

    // Display existing video (if a file was uploaded, not a link)
    currentVideoDisplay.innerHTML = ''; // Clear previous previews
    if (product.videoUrl && !product.videoLink) { // Only show if it's an uploaded video, not a link
        const title = document.createElement('h4');
        title.textContent = 'Current Video:';
        currentVideoDisplay.appendChild(title);
        const video = document.createElement('video');
        video.src = product.videoUrl;
        video.controls = true;
        video.style.maxWidth = '200px';
        video.maxHeight = '150px';
        currentVideoDisplay.appendChild(video);
    }
}


// --- Form Submission Handler ---
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage("Processing product data...", "info", 0); // Show indefinitely

    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const description = productDescriptionInput.value.trim();
    const category = productCategoryInput.value.trim();
    const newProductImages = productImagesInput.files; // Files selected in input
    const newProductVideo = productVideoInput.files[0]; // Video selected in input
    const videoLink = videoLinkInput.value.trim();

    if (!name || isNaN(price) || !description || !category) {
        showMessage('Please fill in all required fields (Name, Price, Description, Category).', 'error');
        return;
    }

    try {
        let imageUrlsToSave = currentProductData.imageUrls || []; // Start with existing images
        let videoUrlToSave = currentProductData.videoUrl || ''; // Start with existing video

        // Handle Image Uploads
        if (newProductImages.length > 0) {
            showMessage("Uploading new images...", "info", 0);
            // This call will now ALWAYS return an array of URLs
            imageUrlsToSave = await uploadFiles(newProductImages, 'product_images', name);
        } else if (isEditMode && !currentProductData.imageUrls && currentProductData.imageUrls !== undefined) {
             // If in edit mode and no new images are uploaded, and there were no existing images,
             // or existing images were explicitly cleared (not implemented yet, but good to consider)
             imageUrlsToSave = []; // Clear images if none were previously there and none uploaded now
        }


        // Handle Video Upload
        if (newProductVideo) {
            showMessage("Uploading new video...", "info", 0);
            // This call will now ALWAYS return an array, even for a single video.
            // We'll take the first element for videoUrlToSave.
            const uploadedVideoUrls = await uploadFiles(newProductVideo, 'product_videos', name);
            videoUrlToSave = uploadedVideoUrls[0] || ''; // Get the first URL from the returned array
        } else if (videoLink) {
            videoUrlToSave = videoLink; // Prioritize link if no file is uploaded
        } else if (isEditMode && !currentProductData.videoUrl && !currentProductData.videoLink) {
            // If in edit mode, no new video/link, and no existing video/link
            videoUrlToSave = '';
        }


        const productData = {
            name: name,
            price: price,
            description: description,
            category: category,
            imageUrls: imageUrlsToSave, // This will now always be an array
            videoUrl: videoUrlToSave, // This will be the uploaded video URL or the videoLink
            videoLink: videoLink, // Keep videoLink separate if you need it for display logic
            updatedAt: new Date() // Always update timestamp on save/update
        };

        if (isEditMode) {
            await updateProductInFirestore(productData);
        } else {
            // Only set createdAt for new products
            productData.createdAt = new Date();
            await addProductToFirestore(productData);
        }

    } catch (error) {
        console.error("Error during product submission:", error);
        let errorMessage = "An unknown error occurred.";
        if (error.message) {
            errorMessage = error.message;
        }
        showMessage(`Error: ${errorMessage}`, "error");
    }
});


// --- Upload Files to Firebase Storage ---
async function uploadFiles(files, folder, productName) {
    const urls = [];
    const cleanedProductName = productName.replace(/[^a-zA-Z0-9-]/g, '_');

    // If files is a FileList (multiple images)
    if (files instanceof FileList) {
        for (const file of files) {
            const storageRef = ref(storage, `${folder}/${cleanedProductName}/${file.name}`);
            const uploadTask = uploadBytesResumable(storageRef, file);
            await uploadTask; // Wait for each upload to complete
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            urls.push(downloadURL);
        }
    } else { // If it's a single File (for video)
        const file = files;
        const storageRef = ref(storage, `${folder}/${cleanedProductName}/${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        await uploadTask; // Wait for the upload to complete
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        urls.push(downloadURL); // Always push to urls array
    }
    // *** MODIFIED LINE: ALWAYS RETURN AN ARRAY ***
    return urls;
}


// --- Add Product to Firestore ---
async function addProductToFirestore(data) {
    try {
        await addDoc(collection(db, "products"), data);
        showMessage('Product added successfully!', 'success');
        console.log("Product successfully added to Firestore:", data);
        addProductForm.reset(); // Clear form after successful submission
        currentImagesDisplay.innerHTML = ''; // Clear image previews
        currentVideoDisplay.innerHTML = ''; // Clear video preview
    } catch (error) {
        console.error("Error adding product:", error);
        showMessage("Error adding product: " + error.message, 'error');
    }
}

// --- Update Product in Firestore ---
async function updateProductInFirestore(data) {
    try {
        const productDocRef = doc(db, "products", productId);
        await updateDoc(productDocRef, data);
        showMessage('Product updated successfully!', 'success');
        console.log(`Product with ID ${productId} updated successfully in Firestore:`, data);
        // Optionally redirect back to manage products or keep on page
        setTimeout(() => window.location.href = 'admin-products.html', 1500);
    } catch (error) {
        console.error("Error updating product:", error);
        showMessage("Error updating product: " + error.message, 'error');
    }
}