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
        // This is for the mobile logout button placeholder.
        // It should not be highlighted as an "active" page.
        if (link.id === 'adminLogoutButtonMobile') {
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
        // REMOVED: No need to clear resumeTimeout as pause functionality is removed
        // if (currentCarouselInstance.resumeTimeout) {
        //     clearTimeout(currentCarouselInstance.resumeTimeout);
        // }
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
        tempTrackContents.push(clone);
    });

    carouselTrack.innerHTML = '';
    tempTrackContents.forEach(node => carouselTrack.appendChild(node));


    const allSlides = Array.from(carouselTrack.children);
    let currentSlideIndex = numClones;

    let autoSlide;
    let initialMoveTimeout;
    // REMOVED: No longer need resumeTimeout as pause functionality is removed
    // let resumeTimeout;

    requestAnimationFrame(() => {
        const slideComputedStyle = getComputedStyle(allSlides[0]);
        const singleSlideTotalWidth = allSlides[0].offsetWidth + parseFloat(slideComputedStyle.marginRight);

        carouselTrack.style.transition = 'none';
        carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

        void carouselTrack.offsetWidth;

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
    });

    // REMOVED: mouseenter and mouseleave event listeners as pause is no longer needed
    // carouselTrack.addEventListener('mouseenter', () => {
    //     clearInterval(autoSlide);
    //     clearTimeout(initialMoveTimeout);
    //     clearTimeout(resumeTimeout); // Clear the resume timeout immediately if mouse enters again
    // });
    // carouselTrack.addEventListener('mouseleave', () => {
    //     resumeTimeout = setTimeout(() => {
    //         autoSlide = setInterval(moveToNextSlide, slideInterval);
    //     }, 3000); // 3000 milliseconds = 3 seconds
    // });

    // REMOVED: resumeTimeout from the return object
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
        tempTrackContents.push(clone);
    });

    carouselTrack.innerHTML = '';
    tempTrackContents.forEach(node => carouselTrack.appendChild(node));


    const allSlides = Array.from(carouselTrack.children);
    let currentSlideIndex = numClones;

    let autoSlide;
    let initialMoveTimeout;
    // REMOVED: No longer need resumeTimeout as pause functionality is removed
    // let resumeTimeout;

    requestAnimationFrame(() => {
        const slideComputedStyle = getComputedStyle(allSlides[0]);
        const singleSlideTotalWidth = allSlides[0].offsetWidth + parseFloat(slideComputedStyle.marginRight);

        carouselTrack.style.transition = 'none';
        carouselTrack.style.transform = `translateX(${-currentSlideIndex * singleSlideTotalWidth}px)`;

        void carouselTrack.offsetWidth;

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

        updateActiveSlide();

        initialMoveTimeout = setTimeout(() => {
            moveToNextSlide();
            autoSlide = setInterval(moveToNextSlide, slideInterval);
        }, slideInterval);
    });

    // REMOVED: mouseenter and mouseleave event listeners as pause is no longer needed
    // carouselTrack.addEventListener('mouseenter', () => {
    //     clearInterval(autoSlide);
    //     clearTimeout(initialMoveTimeout);
    //     clearTimeout(resumeTimeout); // Clear the resume timeout immediately if mouse enters again
    // });
    // carouselTrack.addEventListener('mouseleave', () => {
    //     resumeTimeout = setTimeout(() => {
    //         autoSlide = setInterval(moveToNextSlide, slideInterval);
    //     }, 3000); // 3000 milliseconds = 3 seconds
    // });

    // REMOVED: resumeTimeout from the return object
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