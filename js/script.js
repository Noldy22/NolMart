// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
// Import Firebase Authentication SDKs
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
// TODO: We will also need Firestore and Storage later. Add them as we go:
// import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
// import { getStorage } = "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";


// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAQNnErlcKE8JRIHIra5eB_Axspy3pEoqA",
    authDomain: "nolmart-ed090.firebaseapp.com",
    projectId: "nolmart-ed090",
    storageBucket: "nolmart-ed090.firebasestorage.app",
    messagingSenderId: "511177507325",
    appId: "1:511177507325:web:7238c7599c9f760c8ed994",
    measurementId: "G-WTRHEVHYRW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app); // Initialize analytics if needed
const auth = getAuth(app); // Get the Auth instance


console.log("script.js is loaded!");

// --- ADMIN AUTHENTICATION LOGIC ---
const adminLoginForm = document.getElementById('adminLoginForm');
const adminEmailInput = document.getElementById('adminEmail');
const adminPasswordInput = document.getElementById('adminPassword');
const loginErrorDisplay = document.getElementById('loginError');
const adminLogoutButton = document.getElementById('adminLogoutButton'); // Get logout button

if (adminLoginForm) { // This block only executes if the admin login form exists on the page
    adminLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        const email = adminEmailInput.value;
        const password = adminPasswordInput.value;
        loginErrorDisplay.textContent = ''; // Clear previous errors

        try {
            // --- ADMIN REGISTRATION (ONE-TIME SETUP) ---
            // IMPORTANT: This part is for initial admin creation.
            // You should have already used this to create your first admin user.
            // For security, keep this commented out or removed in your deployed code.
            // If you uncomment, make sure to comment out the signInWithEmailAndPassword below it.

            /*
            console.log('Attempting to register new admin user...');
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            console.log('Admin user registered/signed in:', userCredential.user);
            loginErrorDisplay.textContent = 'Admin user created successfully! Redirecting...';
            window.location.href = 'admin-dashboard.html'; // Redirect to dashboard
            */

            // --- ADMIN LOGIN ---
            // Use this for regular login attempts after initial user creation
            console.log('Attempting to sign in admin user...');
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            console.log('Admin user signed in:', userCredential.user);
            loginErrorDisplay.textContent = 'Login successful! Redirecting...';
            window.location.href = 'admin-dashboard.html'; // Redirect to dashboard

        } catch (error) {
            console.error("Login/Registration Error:", error.code, error.message);
            let errorMessage = 'An unknown error occurred.';
            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Invalid email address.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This user account has been disabled.';
                    break;
                case 'auth/user-not-found':
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect email or password.';
                    break;
                case 'auth/email-already-in-use': // Relevant if createUserWithEmailAndPassword was uncommented
                    errorMessage = 'Email already in use. Please login instead.';
                    break;
                case 'auth/weak-password': // Relevant if createUserWithEmailAndPassword was uncommented
                    errorMessage = 'Password should be at least 6 characters.';
                    break;
                default:
                    errorMessage = `Error: ${error.message}`;
            }
            loginErrorDisplay.textContent = errorMessage;
        }
    });
}

// Handle Admin Logout
if (adminLogoutButton) {
    adminLogoutButton.addEventListener('click', async (e) => {
        e.preventDefault(); // Prevent default link behavior
        try {
            await signOut(auth);
            console.log('User signed out successfully.');
            window.location.href = 'admin-login.html'; // Redirect to login page after logout
        } catch (error) {
            console.error("Logout Error:", error);
            alert("Error logging out. Please try again.");
        }
    });
}

// --- ADMIN PAGE PROTECTION ---
// This function checks the auth state and redirects if necessary
function protectAdminPage() {
    const currentPath = window.location.pathname;

    // List of admin-only pages
    const adminPages = [
        '/admin-dashboard.html',
        '/admin-add-product.html', // Will be created later
        '/admin-products.html'    // Will be created later
    ];

    // Check if the current page is an admin page AND not the login page
    // Using endsWith to handle cases where the base path might vary (e.g., /nolmart/admin-dashboard.html on GitHub Pages)
    if (adminPages.some(page => currentPath.endsWith(page))) {
        onAuthStateChanged(auth, (user) => {
            if (user) {
                // User is signed in. Allow access.
                console.log("User is authenticated:", user.email);
                // No action needed, page can load
            } else {
                // User is signed out. Redirect to login page.
                console.log("No user authenticated. Redirecting to login.");
                // Use a short delay to ensure console.log runs before redirect
                setTimeout(() => {
                    window.location.href = 'admin-login.html';
                }, 50); // Small delay of 50ms
            }
        });
    }
}

// Call this protection function when the DOM is loaded
document.addEventListener('DOMContentLoaded', protectAdminPage);


// --- GENERAL SITE FUNCTIONALITY (e.g., Navigation highlighting) ---

// Function to highlight the active navigation link
function highlightActiveNav() {
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const currentPathname = window.location.pathname;
    const pathSegments = currentPathname.split('/').filter(segment => segment !== '');
    const currentPageFile = pathSegments[pathSegments.length - 1];

    navLinks.forEach(link => {
        link.classList.remove('active');

        if (link.id === 'adminLogoutButton') {
            return;
        }

        const linkPathname = new URL(link.href).pathname;
        const linkFile = linkPathname.split('/').filter(segment => segment !== '').pop();

        if (currentPageFile === linkFile) {
            link.classList.add('active');
        }
        else if (currentPathname === '/' && linkFile === 'index.html') {
            link.classList.add('active');
        }
        else if (linkFile === 'products.html' && currentPageFile === 'product-detail.html') {
            link.classList.add('active');
        }
        else if (linkFile && currentPathname.includes(linkFile)) {
             // This check is often less precise than the others, keep an eye on it.
        }
    });
}

document.addEventListener('DOMContentLoaded', highlightActiveNav);


// --- CAROUSEL AUTO-SWIPE LOGIC (Unified Setup) ---

let currentCarouselInstance = null; // To manage the active carousel instance
let resizeTimeoutCarousel; // Debounce for carousel resize

function initCarousel() {
    // Clear any existing carousel interval and instance
    if (currentCarouselInstance && currentCarouselInstance.autoSlideInterval) {
        clearInterval(currentCarouselInstance.autoSlideInterval);
        currentCarouselInstance.carouselTrack.innerHTML = ''; // Clear cloned slides
        console.log("Previous carousel instance cleared.");
    }

    const carouselTrack = document.querySelector('.carousel-track');
    let originalSlides = Array.from(document.querySelectorAll('.carousel-slide:not(.clone)')); // Get only original slides
    // If originalSlides are empty, maybe they are already clones or not found
    if (originalSlides.length === 0) {
        // Try to get slides that might have been part of a previous init
        originalSlides = Array.from(document.querySelectorAll('.carousel-slide'));
        // If still no slides or only a few, maybe HTML structure is not ready or no products.
        if (originalSlides.length < 3) { // Need at least 3 original slides for cloning to make sense
            console.warn("Not enough original slides for carousel or carousel elements missing. Skipping carousel setup.");
            return;
        }
    }


    if (!carouselTrack || originalSlides.length === 0) {
        console.warn("Carousel elements not found or no original slides. Skipping carousel logic.");
        return;
    }

    const isDesktop = window.innerWidth >= 992; // Define desktop breakpoint
    const slideInterval = 5000; // 5 seconds

    if (isDesktop) {
        console.log("Initializing advanced desktop carousel.");
        currentCarouselInstance = initAdvancedCarousel(carouselTrack, originalSlides, slideInterval);
    } else {
        console.log("Initializing simple mobile carousel.");
        currentCarouselInstance = initSimpleCarousel(carouselTrack, originalSlides, slideInterval);
    }
}


// --- Simple Carousel (Mobile/Tablet) Logic ---
function initSimpleCarousel(carouselTrack, originalSlides, slideInterval) {
    let currentSlideIndex = 0;
    const totalSlides = originalSlides.length;

    // Reset track if it was previously set up for advanced carousel
    carouselTrack.style.transform = `translateX(0)`;
    carouselTrack.style.transition = 'transform 0.5s ease-in-out';
    carouselTrack.innerHTML = ''; // Clear all nodes (clones + originals)

    // Re-append original slides (since we cleared them)
    originalSlides.forEach(slide => carouselTrack.appendChild(slide));

    // Remove active class from any slides if present
    originalSlides.forEach(slide => slide.classList.remove('active'));


    function getVisibleSlidesCount() {
        const viewportWidth = window.innerWidth;
        if (viewportWidth >= 992) return 3; // Should not happen in simple mode
        else if (viewportWidth >= 768) return 2;
        else return 1;
    }

    function moveToNextSlide() {
        if (originalSlides.length === 0) {
            console.warn("No slides to move in simple carousel.");
            clearInterval(autoSlide);
            return;
        }

        const slideComputedStyle = getComputedStyle(originalSlides[0]);
        const singleSlideTotalWidth = originalSlides[0].offsetWidth + parseFloat(slideComputedStyle.marginRight);

        currentSlideIndex++;

        if (currentSlideIndex >= totalSlides) {
            currentSlideIndex = 0;
            carouselTrack.style.transition = 'none'; // No transition for instant reset
            carouselTrack.style.transform = `translateX(0)`;
            setTimeout(() => {
                carouselTrack.style.transition = 'transform 0.5s ease-in-out';
            }, 50);
        } else {
            const translateXValue = -currentSlideIndex * singleSlideTotalWidth;
            carouselTrack.style.transform = `translateX(${translateXValue}px)`;
        }
    }

    let autoSlide = setInterval(moveToNextSlide, slideInterval);

    carouselTrack.addEventListener('mouseenter', () => clearInterval(autoSlide));
    carouselTrack.addEventListener('mouseleave', () => autoSlide = setInterval(moveToNextSlide, slideInterval));

    return { autoSlideInterval: autoSlide, carouselTrack: carouselTrack }; // Return instance details
}


// --- Advanced Carousel (Desktop) Logic ---
function initAdvancedCarousel(carouselTrack, originalSlides, slideInterval) {
    const totalOriginalSlides = originalSlides.length;
    // We need enough original slides for cloning to make a meaningful loop.
    if (totalOriginalSlides < 3) { // E.g., if you only have 2 products, infinite loop is less impactful
        console.warn("Not enough original slides for advanced carousel (min 3 recommended). Reverting to simple carousel.");
        return initSimpleCarousel(carouselTrack, originalSlides, slideInterval);
    }

    // Clear existing content and re-add original slides for fresh setup
    carouselTrack.innerHTML = '';
    originalSlides.forEach(slide => slide.classList.remove('active')); // Ensure no active class from prev init

    // Number of slides to clone from each end (usually 1 or 2, depends on how many are visible at ends)
    // For 3 visible items, 2 clones on each side makes transitions smooth.
    const numClones = 2; // Clone 2 slides from each end

    // Clone last N original slides and prepend them
    const clonedLast = originalSlides.slice(-numClones).map(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        return clone;
    });
    clonedLast.reverse().forEach(clone => carouselTrack.prepend(clone)); // Prepend in reverse order

    // Append original slides
    originalSlides.forEach(slide => carouselTrack.appendChild(slide));

    // Clone first N original slides and append them
    const clonedFirst = originalSlides.slice(0, numClones).map(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        return clone;
    });
    clonedFirst.forEach(clone => carouselTrack.appendChild(clone));

    // Get all slides now, including clones
    const allSlides = Array.from(carouselTrack.children);
    const totalClonedSlides = allSlides.length;

    // Calculate initial position: We start at the first ORIGINAL slide
    let currentSlideIndex = numClones; // Start at the index of the first original slide
    const slideComputedStyle = getComputedStyle(allSlides[0]);
    const singleSlideTotalWidth = allSlides[0].offsetWidth + parseFloat(slideComputedStyle.marginRight);

    // Set initial transform without transition
    carouselTrack.style.transition = 'none';
    carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

    // Enable transition after a brief moment
    setTimeout(() => {
        carouselTrack.style.transition = 'transform 0.5s ease-in-out';
    }, 50);


    // Function to update active class (middle card bigger)
    function updateActiveSlide() {
        allSlides.forEach(slide => slide.classList.remove('active'));

        // Determine the middle original slide based on currentSlideIndex
        // If we are showing 3 items (1 active, 2 sides), the active one is currentSlideIndex + 1 (the middle of the visible 3)
        // Adjust this if your CSS display or desired active position is different.
        const middleVisibleSlideIndex = currentSlideIndex + 1; // Assuming center of 3 visible

        if (allSlides[middleVisibleSlideIndex]) {
            allSlides[middleVisibleSlideIndex].classList.add('active');
        }
    }

    // Function to move the carousel to the next slide
    function moveToNextSlide() {
        console.log(`Adv Carousel: currentSlideIndex before move: ${currentSlideIndex}`);

        currentSlideIndex++; // Move one slide at a time

        carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

        // --- Infinite Loop Snap Back Logic ---
        // If we've moved into the appended clones
        if (currentSlideIndex >= totalOriginalSlides + numClones) {
            console.log("Moved into appended clones. Snapping back.");
            currentSlideIndex = numClones; // Reset to the first original slide
            carouselTrack.style.transition = 'none'; // Disable transition for instant snap
            carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;
            // Re-enable transition after brief delay for next animation
            setTimeout(() => {
                carouselTrack.style.transition = 'transform 0.5s ease-in-out';
            }, 50);
        }
        // If we are moving backwards (not implemented yet, but for full infinite loop, this would handle going left)
        // else if (currentSlideIndex < 0) { ... }

        updateActiveSlide(); // Update active class after move
    }

    // Initial active slide setup
    updateActiveSlide();

    let autoSlide = setInterval(moveToNextSlide, slideInterval);
    console.log("Advanced carousel auto-slide interval started.");

    carouselTrack.addEventListener('mouseenter', () => {
        console.log("Advanced Carousel: Mouse entered, pausing auto-slide.");
        clearInterval(autoSlide);
    });

    carouselTrack.addEventListener('mouseleave', () => {
        console.log("Advanced Carousel: Mouse left, restarting auto-slide.");
        autoSlide = setInterval(moveToNextSlide, slideInterval);
    });

    return { autoSlideInterval: autoSlide, carouselTrack: carouselTrack }; // Return instance details
}

// Global resize listener to re-initialize carousel based on screen size
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeoutCarousel);
    resizeTimeoutCarousel = setTimeout(() => {
        console.log("Window resized. Re-initializing carousel.");
        initCarousel(); // Re-run the main carousel initialization
    }, 250); // Debounce resize event
});

// Initial carousel setup when the DOM is loaded
document.addEventListener('DOMContentLoaded', initCarousel);