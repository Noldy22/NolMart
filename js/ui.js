// js/ui.js

// --- GENERAL SITE FUNCTIONALITY (e.g., Navigation highlighting) ---
function highlightActiveNav() {
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const currentPathname = window.location.pathname;
    const currentPageFile = currentPathname.split('/').filter(segment => segment !== '').pop() || '/';

    navLinks.forEach(link => {
        link.classList.remove('active');

        if (link.id === 'adminLogoutButton' || link.id === 'adminLogoutButtonMobile') {
            return;
        }

        if (link.getAttribute('href') === '#') {
            return;
        }

        const linkPathname = new URL(link.href).pathname;
        const linkFile = linkPathname.split('/').filter(segment => segment !== '').pop() || '/';

        if (currentPageFile === linkFile) {
            link.classList.add('active');
            // TODO.
        } else if (currentPageFile === '/product' && linkFile === '/products') {
            link.classList.add('active');
        }
    });
}

// --- NEW, SIMPLIFIED CAROUSEL LOGIC ---
function initSwiperCarousel() {
    const swiper = new Swiper('.product-carousel', {
        // How many slides to show at once
        slidesPerView: 1,
        // Space between slides
        spaceBetween: 20,
        // Enable looping
        loop: true,
        // Add pagination dots
        pagination: {
            el: '.featured-products .swiper-pagination', // Target the pagination within the featured-products section
            clickable: true,
        },
        // Responsive settings
        breakpoints: {
            600: {
                slidesPerView: 2,
                spaceBetween: 20
            },
            // when window width is >= 768px
            900: {
                slidesPerView: 3,
                spaceBetween: 30
            },
            // when window width is >= 992px
            1200: {
                slidesPerView: 4,
                spaceBetween: 35
            }
        },
        // Auto-play settings
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
    });
}

// --- Mobile Navigation Logic ---
function setupMobileNavigation() {
    const hamburger = document.querySelector('.hamburger-menu');
    const navLinks = document.querySelector('.main-nav .nav-links');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            navLinks.classList.toggle('active');
            hamburger.classList.toggle('open');
        });

        navLinks.querySelectorAll('li a').forEach(link => {
            link.addEventListener('click', () => {
                if (link.id !== 'adminLogoutButtonMobile') {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('open');
                }
            });
        });
    }
}

// Export initialization functions
export { highlightActiveNav, initSwiperCarousel, setupMobileNavigation };