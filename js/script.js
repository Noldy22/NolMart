<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  const analytics = getAnalytics(app);
</script>

console.log("script.js is loaded!");

// Function to highlight the active navigation link
function highlightActiveNav() {
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const currentPath = window.location.pathname; // Gets the path, e.g., /index.html or /products.html

    navLinks.forEach(link => {
        // Remove 'active' class from all links first
        link.classList.remove('active');

        // Get the link's href relative to the site root
        const linkPath = new URL(link.href).pathname;

        // Simple match for exact pages (index.html, about.html, contact.html)
        if (currentPath === linkPath) {
            link.classList.add('active');
        } 
        // Special handling for 'Products' link, if the current page is a product detail page
        // We'll assume product detail pages will have 'product-detail.html' in their path
        else if (linkPath.includes('products.html') && currentPath.includes('product-detail.html')) {
            link.classList.add('active');
        }
        // If we're on the root path and the link is for index.html (common for home)
        else if (currentPath === '/' && linkPath.includes('index.html')) {
            link.classList.add('active');
        }
    });
}

// Call the function when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', highlightActiveNav);