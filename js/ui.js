// js/ui.js

// --- GENERAL SITE FUNCTIONALITY (e.g., Navigation highlighting) ---
function highlightActiveNav() {
    const navLinks = document.querySelectorAll('.main-nav ul li a');
    const currentPathname = window.location.pathname;
    // Default to 'index.html' if on the root path '/'
    const currentPageFile = currentPathname.split('/').filter(segment => segment !== '').pop() || 'index.html';

    navLinks.forEach(link => {
        link.classList.remove('active'); // Always remove 'active' first for a clean slate

        // Skip admin logout buttons, as they are not "pages" to highlight
        if (link.id === 'adminLogoutButton' || link.id === 'adminLogoutButtonMobile') {
            return;
        }

        // --- FIX: Ignore links that are just '#' placeholders ---
        if (link.getAttribute('href') === '#') {
            return; // Skip these links from active highlighting logic
        }
        // --- END FIX ---

        const linkPathname = new URL(link.href).pathname;
        // Get the file name from the link's href, default to 'index.html' for root link '/'
        const linkFile = linkPathname.split('/').filter(segment => segment !== '').pop() || 'index.html';

        // Main logic to determine active link
        if (currentPageFile === linkFile) {
            link.classList.add('active');
        }
        // Special case: Highlight "Products" if on a product detail page
        else if (currentPageFile === 'product-detail.html' && linkFile === 'products.html') {
            link.classList.add('active');
        }
        // Removed the problematic `else if (linkFile && currentPathname.includes(linkFile))`
        // This was too broad and could cause unintended highlights.
    });
}

// --- CAROUSEL AUTO-SWIPE LOGIC ---
let currentCarouselInstance = null; // To manage the active carousel instance
let resizeTimeoutCarousel; // Debounce for carousel resize

function initCarousel() {
    // Clear any existing carousel interval and instance
    if (currentCarouselInstance) {
        if (currentCarouselInstance.autoSlideInterval) {
            clearInterval(currentCarouselInstance.autoSlideInterval);
        }
        if (currentCarouselInstance.initialMoveTimeout) {
            clearTimeout(currentCarouselInstance.initialMoveTimeout);
        }
        // Restore original slides if they were part of a cloned setup
        const carouselTrack = document.querySelector('.carousel-track');
        if (carouselTrack) {
            // Get only original slides (those not marked as clone)
            const originalSlides = Array.from(document.querySelectorAll('.carousel-slide:not(.clone)'));
            carouselTrack.innerHTML = ''; // Clear all nodes (clones + originals)
            // Re-append clones of originals, ensuring no active/clone classes from previous runs
            originalSlides.forEach(slide => {
                const cleanSlide = slide.cloneNode(true);
                cleanSlide.classList.remove('active', 'clone');
                carouselTrack.appendChild(cleanSlide);
            });
        }
        console.log("Previous carousel instance cleared.");
    }

    const carouselTrack = document.querySelector('.carousel-track');
    let originalSlides = Array.from(document.querySelectorAll('.carousel-slide:not(.clone)'));

    if (!carouselTrack || originalSlides.length === 0) {
        console.warn("Carousel elements not found or no original slides. Skipping carousel logic.");
        return;
    }
    if (originalSlides.length < 1) { // Changed from < 1 to > 0 as a warning; logic below handles 0
        console.warn("Not enough original slides for carousel. Cannot set up advanced features.");
        // If there's only one slide, no need for carousel behavior
        if (originalSlides.length === 1) {
            carouselTrack.style.transform = 'translateX(0)'; // Ensure single slide is visible
            return;
        }
    }

    const isDesktop = window.innerWidth >= 992;
    const slideInterval = 5000;

    // Re-query originalSlides in case they were altered, though current logic clones them.
    // This line is technically redundant if initCarousel ensures original slides are always pristine.
    originalSlides = Array.from(document.querySelectorAll('.carousel-slide:not(.clone)'));


    if (isDesktop) {
        console.log("Initializing advanced desktop carousel.");
        currentCarouselInstance = initAdvancedCarousel(carouselTrack, originalSlides, slideInterval);
    } else {
        console.log("Initializing simple (cloned) carousel for mobile/tablet.");
        currentCarouselInstance = initSimpleClonedCarousel(carouselTrack, originalSlides, slideInterval);
    }
}


// --- Simple Cloned Carousel (Mobile/Tablet) Logic ---
function initSimpleClonedCarousel(carouselTrack, originalSlides, slideInterval) {
    const totalOriginalSlides = originalSlides.length;

    function getVisibleSlidesCount() {
        const viewportWidth = window.innerWidth;
        if (viewportWidth >= 768) return 2;
        else return 1;
    }
    const visibleSlides = getVisibleSlidesCount();
    const numClones = Math.min(totalOriginalSlides, visibleSlides + 1);

    const tempTrackContents = [];
    originalSlides.slice(-numClones).reverse().forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        tempTrackContents.push(clone);
    });
    originalSlides.forEach(slide => tempTrackContents.push(slide));
    originalSlides.slice(0, numClones).forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        clone.classList.add('clone-end'); // Add a class for last clones if needed for specific styling
        tempTrackContents.push(clone);
    });

    carouselTrack.innerHTML = '';
    tempTrackContents.forEach(node => carouselTrack.appendChild(node));


    const allSlides = Array.from(carouselTrack.children);
    let currentSlideIndex = numClones;

    let autoSlide;
    let initialMoveTimeout;

    requestAnimationFrame(() => {
        const slideComputedStyle = getComputedStyle(allSlides[0]);
        const singleSlideTotalWidth = allSlides[0].offsetWidth + parseFloat(slideComputedStyle.marginRight);

        carouselTrack.style.transition = 'none';
        carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

        void carouselTrack.offsetWidth; // Force reflow

        carouselTrack.style.transition = 'transform 0.5s ease-in-out';

        function moveToNextSlide() {
            currentSlideIndex++;
            carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

            if (currentSlideIndex >= totalOriginalSlides + numClones) {
                clearInterval(autoSlide);

                // Jump back to the equivalent original slide after transition
                setTimeout(() => {
                    currentSlideIndex = numClones;
                    carouselTrack.style.transition = 'none'; // Temporarily remove transition for instant jump
                    carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

                    void carouselTrack.offsetWidth; // Force reflow to apply 'none' transition

                    carouselTrack.style.transition = 'transform 0.5s ease-in-out'; // Re-apply transition
                    autoSlide = setInterval(moveToNextSlide, slideInterval);
                }, 100); // Short delay to allow visual transition to finish before snap
            }
        }

        initialMoveTimeout = setTimeout(() => {
            moveToNextSlide();
            autoSlide = setInterval(moveToNextSlide, slideInterval);
        }, slideInterval);
    });

    return { autoSlideInterval: autoSlide, initialMoveTimeout: initialMoveTimeout, carouselTrack: carouselTrack };
}


// --- Advanced Carousel (Desktop) Logic ---
function initAdvancedCarousel(carouselTrack, originalSlides, slideInterval) {
    const totalOriginalSlides = originalSlides.length;
    if (totalOriginalSlides < 3) {
        console.warn("Not enough original slides for advanced carousel (min 3 recommended). Reverting to simple cloned carousel.");
        return initSimpleClonedCarousel(carouselTrack, originalSlides, slideInterval);
    }

    const numClones = 2; // For desktop, we need 2 clones at each end for smooth transition

    const tempTrackContents = [];
    originalSlides.slice(-numClones).reverse().forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        tempTrackContents.push(clone);
    });
    originalSlides.forEach(slide => tempTrackContents.push(slide));
    originalSlides.slice(0, numClones).forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        clone.classList.add('clone-end'); // Add a class for last clones if needed for specific styling
        tempTrackContents.push(clone);
    });

    carouselTrack.innerHTML = '';
    tempTrackContents.forEach(node => carouselTrack.appendChild(node));


    const allSlides = Array.from(carouselTrack.children);
    let currentSlideIndex = numClones; // Start at the first actual original slide

    let autoSlide;
    let initialMoveTimeout;

    requestAnimationFrame(() => {
        const slideComputedStyle = getComputedStyle(allSlides[0]);
        const singleSlideTotalWidth = allSlides[0].offsetWidth + parseFloat(slideComputedStyle.marginRight);

        carouselTrack.style.transition = 'none'; // Disable transition for initial positioning
        carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

        void carouselTrack.offsetWidth; // Force reflow to apply 'none' transition

        carouselTrack.style.transition = 'transform 0.5s ease-in-out'; // Re-enable transition

        function updateActiveSlide() {
            allSlides.forEach(slide => slide.classList.remove('active'));
            const middleVisibleSlideIndex = currentSlideIndex + 1; // Assuming 3 visible slides, the middle one is (current + 1)
            if (allSlides[middleVisibleSlideIndex]) {
                allSlides[middleVisibleSlideIndex].classList.add('active');
            }
        }

        function moveToNextSlide() {
            currentSlideIndex++;
            carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

            if (currentSlideIndex >= totalOriginalSlides + numClones) {
                clearInterval(autoSlide); // Stop interval before jump

                setTimeout(() => {
                    currentSlideIndex = numClones; // Jump back to the start of original slides
                    carouselTrack.style.transition = 'none'; // Temporarily remove transition
                    carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

                    void carouselTrack.offsetWidth; // Force reflow

                    carouselTrack.style.transition = 'transform 0.5s ease-in-out'; // Re-apply transition
                    autoSlide = setInterval(moveToNextSlide, slideInterval); // Restart interval
                }, 100); // Short delay for visual smoothness
            }
            updateActiveSlide();
        }

        updateActiveSlide(); // Set initial active slide

        initialMoveTimeout = setTimeout(() => {
            moveToNextSlide();
            autoSlide = setInterval(moveToNextSlide, slideInterval);
        }, slideInterval);
    });

    return { autoSlideInterval: autoSlide, initialMoveTimeout: initialMoveTimeout, carouselTrack: carouselTrack };
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

        // Close menu if a nav link is clicked (optional, but good UX for mobile)
        navLinks.querySelectorAll('li a').forEach(link => {
            link.addEventListener('click', () => {
                // Check if it's the logout button, don't close immediately as it might redirect
                if (link.id !== 'adminLogoutButtonMobile') {
                    navLinks.classList.remove('active');
                    hamburger.classList.remove('open');
                }
            });
        });
    }
}


// Export initialization functions
export { highlightActiveNav, initCarousel, setupMobileNavigation };