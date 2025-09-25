// js/admin-add-product.js

// --- IMPORTS ---
import { auth, storage, db } from './firebase-config.js';
import { ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";
import { collection, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

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
const formTitle = document.getElementById('formTitle');
const submitButton = document.getElementById('submitButton');
const currentImagesDisplay = document.getElementById('currentImagesDisplay');
const currentVideoDisplay = document.getElementById('currentVideoDisplay');

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
onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log("Admin user detected.");
        checkEditModeAndLoadProduct();
    } else {
        console.log("No admin user found. Redirecting to login page.");
        window.location.href = 'admin-login.html';
    }
});

// --- Logout functionality ---
const adminLogoutButton = document.getElementById('adminLogoutButton');
if (adminLogoutButton) {
    adminLogoutButton.addEventListener('click', async (e) => {
        e.preventDefault();
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
        showMessage('Loading product data...', 'info', 0);

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

    // Display existing images with remove buttons
    currentImagesDisplay.innerHTML = '';
    if (product.imageUrls && product.imageUrls.length > 0) {
        const title = document.createElement('h4');
        title.textContent = 'Current Images:';
        currentImagesDisplay.appendChild(title);

        product.imageUrls.forEach(url => {
            const previewContainer = document.createElement('div');
            previewContainer.classList.add('media-preview-item');

            const img = document.createElement('img');
            img.src = url;
            img.alt = 'Product Image';
            previewContainer.appendChild(img);

            const removeBtn = document.createElement('button');
            removeBtn.type = 'button'; // Prevent form submission
            removeBtn.textContent = 'Remove';
            removeBtn.classList.add('remove-media-btn');
            removeBtn.dataset.url = url;

            removeBtn.addEventListener('click', handleRemoveMedia);

            previewContainer.appendChild(removeBtn);
            currentImagesDisplay.appendChild(previewContainer);
        });
    }

    // Display existing video with remove button
    currentVideoDisplay.innerHTML = '';
    if (product.videoUrl && !product.videoLink) {
        const title = document.createElement('h4');
        title.textContent = 'Current Video:';
        currentVideoDisplay.appendChild(title);

        const previewContainer = document.createElement('div');
        previewContainer.classList.add('media-preview-item');

        const video = document.createElement('video');
        video.src = product.videoUrl;
        video.controls = true;
        previewContainer.appendChild(video);

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.textContent = 'Remove';
        removeBtn.classList.add('remove-media-btn');
        removeBtn.dataset.url = product.videoUrl;
        removeBtn.dataset.type = 'video';

        removeBtn.addEventListener('click', handleRemoveMedia);

        previewContainer.appendChild(removeBtn);
        currentVideoDisplay.appendChild(previewContainer);
    }
}

// --- NEW --- Handles the click event for the "Remove" button on media previews
function handleRemoveMedia(event) {
    const urlToRemove = event.target.dataset.url;
    const mediaType = event.target.dataset.type;

    if (mediaType === 'video') {
        // Remove the video URL from the global product data object
        if (currentProductData.videoUrl === urlToRemove) {
            currentProductData.videoUrl = '';
        }
    } else {
        // Filter out the image URL from the global product data object's array
        if (currentProductData.imageUrls) {
            currentProductData.imageUrls = currentProductData.imageUrls.filter(url => url !== urlToRemove);
        }
    }

    // Remove the entire preview element from the DOM for immediate visual feedback
    event.target.parentElement.remove();

    showMessage('Media marked for removal. Save changes to confirm.', 'info');
}

// --- Form Submission Handler ---
addProductForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showMessage("Processing product data...", "info", 0);

    const name = productNameInput.value.trim();
    const price = parseFloat(productPriceInput.value);
    const description = productDescriptionInput.value.trim();
    const category = productCategoryInput.value.trim();
    const newProductImages = productImagesInput.files;
    const newProductVideo = productVideoInput.files[0];
    const videoLink = videoLinkInput.value.trim();

    if (!name || isNaN(price) || !description || !category) {
        showMessage('Please fill in all required fields (Name, Price, Description, Category).', 'error');
        return;
    }

    try {
        let imageUrlsToSave = currentProductData.imageUrls || [];
        let videoUrlToSave = currentProductData.videoUrl || '';

        // Handle Image Uploads
        if (newProductImages.length > 0) {
            showMessage("Uploading new images...", "info", 0);
            const newImageUrls = await uploadFiles(newProductImages, 'product_images', name);
            // If editing, add new images to the existing (and possibly filtered) list
            imageUrlsToSave = isEditMode ? [...imageUrlsToSave, ...newImageUrls] : newImageUrls;
        }

        // Handle Video Upload
        if (newProductVideo) {
            showMessage("Uploading new video...", "info", 0);
            const uploadedVideoUrls = await uploadFiles([newProductVideo], 'product_videos', name); // Pass as array
            videoUrlToSave = uploadedVideoUrls[0] || '';
        } else if (videoLink) {
            videoUrlToSave = videoLink;
        }

        const productData = {
            name: name,
            name_lower: name.toLowerCase(),
            price: price,
            description: description,
            category: category,
            imageUrls: imageUrlsToSave,
            videoUrl: videoUrlToSave,
            videoLink: videoLink,
            updatedAt: new Date()
        };

        if (isEditMode) {
            await updateProductInFirestore(productData);
        } else {
            productData.createdAt = new Date();
            await addProductToFirestore(productData);
        }

    } catch (error) {
        console.error("Error during product submission:", error);
        showMessage(`Error: ${error.message}`, "error");
    }
});

// --- Upload Files to Firebase Storage ---
async function uploadFiles(files, folder, productName) {
    const urls = [];
    const cleanedProductName = productName.replace(/[^a-zA-Z0-9-]/g, '_');

    for (const file of files) {
        const storageRef = ref(storage, `${folder}/${cleanedProductName}/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);
        await uploadTask;
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        urls.push(downloadURL);
    }
    return urls;
}

// --- Add Product to Firestore ---
async function addProductToFirestore(data) {
    try {
        await addDoc(collection(db, "products"), data);
        showMessage('Product added successfully!', 'success');
        addProductForm.reset();
        currentImagesDisplay.innerHTML = '';
        currentVideoDisplay.innerHTML = '';
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
        setTimeout(() => window.location.href = 'admin-products.html', 1500);
    } catch (error) {
        console.error("Error updating product:", error);
        showMessage("Error updating product: " + error.message, 'error');
    }
}