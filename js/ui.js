// js/ui.js

// --- GENERAL SITE FUNCTIONALITY (e.g., Navigation highlighting) ---
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
    if (originalSlides.length < 1) {
        console.warn("Not enough original slides for carousel. Cannot set up advanced features.");
        return;
    }

    const isDesktop = window.innerWidth >= 992;
    const slideInterval = 5000;

    // We do NOT set transition: 'none' here directly.
    // The setup in the specific carousel functions will handle this with requestAnimationFrame.

    // Ensure original slides are clean and present. This part is critical.
    // Re-query original slides after cleaning just in case
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

    // --- Cloning setup ---
    // Clear existing children from track before adding clones/originals
    // This was previously done in initCarousel, but for clarity after cloning.
    // We append/prepend to an already cleaned track now.
    const tempTrackContents = [];
    // Clone last N original slides and prepend them
    originalSlides.slice(-numClones).reverse().forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        tempTrackContents.push(clone);
    });
    // Add original slides
    originalSlides.forEach(slide => tempTrackContents.push(slide));
    // Clone first N original slides and append them
    originalSlides.slice(0, numClones).forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        tempTrackContents.push(clone);
    });

    // Append all collected nodes to the track (which was cleared in initCarousel)
    carouselTrack.innerHTML = ''; // Ensure truly empty before populating
    tempTrackContents.forEach(node => carouselTrack.appendChild(node));


    const allSlides = Array.from(carouselTrack.children);
    let currentSlideIndex = numClones;

    let autoSlide;
    let initialMoveTimeout;

    // Use requestAnimationFrame to ensure CSS layout is settled before reading dimensions
    requestAnimationFrame(() => {
        const slideComputedStyle = getComputedStyle(allSlides[0]);
        const singleSlideTotalWidth = allSlides[0].offsetWidth + parseFloat(slideComputedStyle.marginRight);

        // Set initial transform without transition
        carouselTrack.style.transition = 'none';
        carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

        // Force browser reflow to ensure 'none' is applied immediately
        void carouselTrack.offsetWidth;

        // Enable transition after ensuring immediate application
        carouselTrack.style.transition = 'transform 0.5s ease-in-out';

        function moveToNextSlide() {
            currentSlideIndex++;
            carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

            if (currentSlideIndex >= totalOriginalSlides + numClones) {
                clearInterval(autoSlide);

                setTimeout(() => {
                    currentSlideIndex = numClones;
                    carouselTrack.style.transition = 'none';
                    carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

                    void carouselTrack.offsetWidth;

                    carouselTrack.style.transition = 'transform 0.5s ease-in-out';
                    autoSlide = setInterval(moveToNextSlide, slideInterval);
                }, 100);
            }
        }

        initialMoveTimeout = setTimeout(() => {
            moveToNextSlide();
            autoSlide = setInterval(moveToNextSlide, slideInterval);
        }, slideInterval);
    }); // End requestAnimationFrame

    carouselTrack.addEventListener('mouseenter', () => {
        clearInterval(autoSlide);
        clearTimeout(initialMoveTimeout);
    });
    carouselTrack.addEventListener('mouseleave', () => {
        autoSlide = setInterval(moveToNextSlide, slideInterval);
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

    const numClones = 2;

    // --- Cloning setup ---
    const tempTrackContents = [];
    // Clone last N original slides and prepend them
    originalSlides.slice(-numClones).reverse().forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        tempTrackContents.push(clone);
    });
    // Add original slides
    originalSlides.forEach(slide => tempTrackContents.push(slide));
    // Clone first N original slides and append them
    originalSlides.slice(0, numClones).forEach(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add('clone');
        tempTrackContents.push(clone);
    });

    // Append all collected nodes to the track (which was cleared in initCarousel)
    carouselTrack.innerHTML = '';
    tempTrackContents.forEach(node => carouselTrack.appendChild(node));


    const allSlides = Array.from(carouselTrack.children);
    let currentSlideIndex = numClones;

    let autoSlide;
    let initialMoveTimeout;

    // Use requestAnimationFrame to ensure CSS layout is settled before reading dimensions
    requestAnimationFrame(() => {
        const slideComputedStyle = getComputedStyle(allSlides[0]);
        const singleSlideTotalWidth = allSlides[0].offsetWidth + parseFloat(slideComputedStyle.marginRight);

        // Set initial transform without transition
        carouselTrack.style.transition = 'none';
        carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

        // Force browser reflow to ensure 'none' is applied immediately
        void carouselTrack.offsetWidth;

        // Enable transition after ensuring immediate application
        carouselTrack.style.transition = 'transform 0.5s ease-in-out';

        function updateActiveSlide() {
            allSlides.forEach(slide => slide.classList.remove('active'));
            const middleVisibleSlideIndex = currentSlideIndex + 1;
            if (allSlides[middleVisibleSlideIndex]) {
                allSlides[middleVisibleSlideIndex].classList.add('active');
            }
        }

        function moveToNextSlide() {
            currentSlideIndex++;
            carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

            if (currentSlideIndex >= totalOriginalSlides + numClones) {
                clearInterval(autoSlide);

                setTimeout(() => {
                    currentSlideIndex = numClones;
                    carouselTrack.style.transition = 'none';
                    carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

                    void carouselTrack.offsetWidth;

                    carouselTrack.style.transition = 'transform 0.5s ease-in-out';
                    autoSlide = setInterval(moveToNextSlide, slideInterval);
                }, 100);
            }
            updateActiveSlide();
        }

        updateActiveSlide(); // Initial active slide setup

        initialMoveTimeout = setTimeout(() => {
            moveToNextSlide();
            autoSlide = setInterval(moveToNextSlide, slideInterval);
        }, slideInterval);
    }); // End requestAnimationFrame

    carouselTrack.addEventListener('mouseenter', () => {
        clearInterval(autoSlide);
        clearTimeout(initialMoveTimeout);
    });
    carouselTrack.addEventListener('mouseleave', () => {
        autoSlide = setInterval(moveToNextSlide, slideInterval);
    });

    return { autoSlideInterval: autoSlide, initialMoveTimeout: initialMoveTimeout, carouselTrack: carouselTrack };
}

// Export initialization functions
export { highlightActiveNav, initCarousel };