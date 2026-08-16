import { showNotification } from './notifications.js';
import { showPageAfterLoad } from './loadPage.js';
import { hidePageDuringLoad } from './loadPage.js';
import { createProductCard } from './public-products.js';
import { productsByRow } from './public-products.js';

/**
 * Fetches all products from the static JSON file.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of products.
 */

// For displaying RELATED products
async function fetchProductsFromDB() {
    try {
        const response = await fetch('/public/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching products:", error);
        return [];
    }
}

// IMPORTANT NOTE: Language must be written in 1 language for all guides (eng/sw).
async function fetchAllGuides(lang) {
    let fetcher;
    if (lang) {
        fetcher = `/public/guides/${lang}.json`;
    } else {
        fetcher = `/public/guides/sw.json`;
    }

    try {
        const response = await fetch(fetcher);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching guides:", error);
        return [];
    }
}

// TODO
function createRelatedGuidesCard(guide) { // <-- "export" keyword added here
    const productId = guide.id;
    const productName = guide.name;
    const productDescription = guide.paragraph || guide.sections[0].paragraph;
    const rawDate =  new Date(guide.createdAt);
    const refinedDate = rawDate.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}) || 'N/A';

    const cardHtml = `
        <a href="guide.html?title=${productId}" class="product-link">
            <div class="top-section">
                <span class="created-date">${refinedDate}</span>
                <span class="divider">|</span>
                <span class="reading-time-length">15 MIN READ</span>
            </div>
            <h3 class="guide-name heading">${productName}</h3>
            <p class="product-description">${productDescription ? productDescription.substring(0, 280) + '...' : ''}</p>
            <p class="link-text">Learn more ></p>
        </a>
    `;

    const cardElement = document.createElement('div');
    cardElement.classList.add('related-guide-card');
    cardElement.setAttribute('data-guide-id', productId);
    cardElement.innerHTML = cardHtml.trim();

    return cardElement;
}

/**
 * Fetches and displays related products based on category.
 * @param {string} currentGuideId - The ID of the product currently being viewed, to exclude it from the list.
 * @param {string} category - The category to fetch related products from.
 */
async function fetchAndDisplayRelatedGuides(currentGuideId, category) {
    const container = document.getElementById('relatedGuidesContainer');
    if (!container) return;

    container.innerHTML = `<p>Loading similar items...</p>`;

    try {
        const allGuides = await fetchAllGuides();

        // Filter products by category and exclude current product
        let relatedProducts = allGuides
            .filter(p => p.category === category && p.id !== currentGuideId)
            .slice(0, 4);

        container.innerHTML = ''; // Clear loading message

        if (relatedProducts.length > 0) {
            relatedProducts.forEach(guide => {
                const guideCard = createGuideCard(guide);
                container.appendChild(guideCard);
            });
        } else {
            container.innerHTML = `
            <div class="empty-guides-section">
                <span>There are no related guides for this topic yet.</span> 
                <a href="guides.html" class="link-text">
                    Browse all guides
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20 12L4 12M20 12L14 18M20 12L14 6" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                </a>
            </div>`;
            container.classList.remove('product-grid')
        }
    } catch (error) {
        console.error("Error fetching related products:", error);
        container.innerHTML = `<p>Could not load related items.</p>`;
    }
}

function createGuideCard(guide) { // <-- "export" keyword added here
    const productId = guide.id;
    const productName = guide.name;
    const productDescription = guide.paragraph || guide.sections[0].paragraph;
    const rawDate =  new Date(guide.createdAt);
    const refinedDate = rawDate.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}) || 'N/A';

    const cardHtml = `
        <a href="guide.html?title=${productId}" class="product-link">
            <div class="top-section">
                <span class="created-date">${refinedDate}</span>
                <span class="divider">|</span>
                <span class="reading-time-length">15 MIN READ</span>
            </div>
            <h3 class="guide-name heading">${productName}</h3>
            <p class="product-description">${productDescription ? productDescription.substring(0, 280) + '...' : ''}</p>
            <p class="link-text">Learn more ></p>
        </a>
    `;

    const cardElement = document.createElement('div');
    cardElement.classList.add('related-guide-card');
    cardElement.setAttribute('data-guide-id', productId);
    cardElement.innerHTML = cardHtml.trim();

    return cardElement;
}

let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const guideId = urlParams.get('title');

    const guideContentContainer = document.getElementById('guideContentContainer');
    const errorMessage = document.getElementById('errorMessage');

    const pageListingName = document.querySelector('.page-listing li.active a'); //

    let currentGuide = null;

    if (!guideId) {
        if (errorMessage) {
            errorMessage.textContent = "Guide ID is missing in the URL.";
            errorMessage.style.display = 'block';
        }
        showNotification("Guide ID is missing in the URL. ", 'error');
        return;
    }

    if (errorMessage) errorMessage.style.display = 'none';
    if (guideContentContainer) guideContentContainer.style.display = 'block';

    //get products
    allProducts = await fetchProductsFromDB();

    //main content
    try {
        // Fetch all products and find the one matching the ID
        const defaultLanguage = 'sw'
        const allGuides = await fetchAllGuides(defaultLanguage);
        currentGuide = allGuides.find(p => p.id === guideId);

        if (currentGuide) {
            setLatestProductsSection(currentGuide);
            
            pageListingName.textContent = currentGuide.name || 'N/A';

            setGuideContent(currentGuide);

            //Meta
            document.title = `NolMart - ${currentGuide.name}`;
            const metaDescriptionContent = `${currentGuide.sections[0].paragraph.substring(0, 100)}... Order now for easy delivery in Tanzania.`;

            let metaTag = document.querySelector('meta[name="description"]');
            if (!metaTag) {
                metaTag = document.createElement('meta');
                metaTag.name = "description";
                document.head.appendChild(metaTag);
            }
            metaTag.setAttribute('content', metaDescriptionContent);
            //End of Meta

            // Fetch and display related products
            if (currentGuide.category) {
                fetchAndDisplayRelatedGuides(guideId, currentGuide.category);
            }

            showPageAfterLoad();

            // set translate button & attach event listener
            //const translateButtonContainer = document.querySelector('.floating-button.translate-float');
            const translateButtonContainer = document.querySelector('select[name="language-choices"]');
            switchLanguageButtons(translateButtonContainer,guideId); // event listener
        } else {
            if (errorMessage) {
                errorMessage.textContent = "Guide not found.";
                errorMessage.style.display = 'block';
            }
            
            showNotification("Guide not found.", 'error');
        }

    } catch (error) {
        console.error("Error fetching guide details:", error);

        if (errorMessage) {
            errorMessage.textContent = `Error loading guide details: ${error.message}. Please try again later.`;
            errorMessage.style.display = 'block';
        }
        showNotification(`Error loading guide details: ${error.message}`, 'error');
    }

    attachPageTrackerLayoutListeners();
})

// TODO: Is a repeat of cart, make a neutral function that can be exported, just add parameters
function attachPageTrackerLayoutListeners() {
    const openTrackerBtn = document.getElementById('openTrackerBtn');
    const closeTrackerBtn = document.getElementById('closeTrackerBtn');
    const trackerOverlay = document.getElementById('pageTrackerOverlay');

    if (openTrackerBtn && closeTrackerBtn && trackerOverlay) {
        openTrackerBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Prevent default link behavior
            trackerOverlay.classList.add('active');
            document.body.style.overflow = 'hidden'; // Prevent scrolling background

            renderFloatingPageTracker(trackerOverlay);
        });

        closeTrackerBtn.addEventListener('click', () => {
            closePageTrackerOverlay();
        });

        // Close overlay if clicking outside content (on the overlay itself)
        trackerOverlay.addEventListener('click', (e) => {
            if (e.target === trackerOverlay) {
                trackerOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

function closePageTrackerOverlay() {
    const trackerOverlay = document.getElementById('pageTrackerOverlay');
    trackerOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

function renderFloatingPageTracker(trackerOverlay) {
    const container = trackerOverlay.querySelector('.floating-main-content ul');

    container.innerHTML = document.querySelector('.page-tracker ul').innerHTML;

    // Close page when a link is clicked
    container.querySelectorAll('li').forEach(el => {
        el.addEventListener('click', () => {
            closePageTrackerOverlay();
        })
    })
}

function setGuideContent(currentGuide) {
    const guideContentContainer = document.getElementById('guideContentContainer');
    const guideContentName = document.getElementById('guideContentName');
    const guideContentDate = document.getElementById('guideContentDate');

    guideContentName.textContent = currentGuide.name || 'N/A';

    const date = new Date(currentGuide.createdAt);
    guideContentDate.textContent = date.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}) || 'N/A';

    const insertGuideContainer = guideContentContainer.querySelector('.dynamic-data');
    insertGuideContainer.innerHTML = '';

    const pageTrackerContainer = document.querySelector('.page-tracker ul');
    
    pageTrackerContainer.innerHTML = '';
    createSections(currentGuide, insertGuideContainer);
    attachPageTrackerDesktopListener(insertGuideContainer);
}

function attachPageTrackerDesktopListener(insertGuideContainer) {
    const pageContainer = document.querySelector('.page-tracker ul');
    const pageLinks = pageContainer.querySelectorAll('li')

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {

                pageLinks.forEach(link =>
                    link.classList.remove("active")
                );

                const activeLink = pageContainer.querySelector(
                    `a[href="#${entry.target.id}"]`
                );

                activeLink.closest('li').classList.add("active");
            }
        });
    }, {
        rootMargin: "0px 0px -80% 0px",
        threshold: 0
    });

    const headings = insertGuideContainer.querySelectorAll('h3.heading');
    headings.forEach(heading => observer.observe(heading));
}

function getAllHeadings(heading, headingID, headingCounter) {
    const container = document.querySelector('.page-tracker ul');

    const el = document.createElement('li');
    const elLink = document.createElement('a');
    elLink.href = `#${headingID}`;
    elLink.textContent = headingCounter + '. ' + heading;

    el.appendChild(elLink);
    container.appendChild(el);
}


export function createSections(currentGuide, insertGuideContainer, headingCounter = 0) {
    if (!currentGuide || !insertGuideContainer) return;

    const sections = currentGuide.sections || currentGuide;


    sections.forEach(section => {
        const heading = section.heading;
        const paragraph = section.paragraph;
        const list = section.list;
        const imageSections = section.image_section;
        const videoSections = section.video_section;
        const subSections = section.sub_sections;

        if (heading && heading.length > 0) {
            headingCounter += 1;

            const element = document.createElement('h3');
            element.classList.add('heading');
            element.id = `guide-heading-${headingCounter}`;
            element.textContent = heading;

            insertGuideContainer.appendChild(element);

            getAllHeadings(heading, element.id, headingCounter)      

        }

        if (paragraph && paragraph.length > 0) {
            const element = document.createElement('p');
            element.textContent = paragraph;

            insertGuideContainer.appendChild(element);
        }

        if (list && list.length > 0) {
            const listContainer = document.createElement('ul');
            listContainer.classList.add('list-container');

            list.forEach(point => {
                const element = document.createElement('li');
                const elementText = document.createElement('p');

                elementText.textContent = point;

                element.appendChild(elementText);
                listContainer.appendChild(element);
            })

            insertGuideContainer.appendChild(listContainer);
        }

        if (videoSections && videoSections.length > 0) {
            const element = document.createElement('div');
            element.classList.add('media-container')

            videoSections.forEach(videoSection => {
                const caption = videoSection.title;
                const url = videoSection.url;

                if (caption) {
                    const elementText = document.createElement('h4');
                    elementText.classList.add('heading');
                    elementText.textContent = caption;

                    element.appendChild(elementText);
                }

                if (url) {
                    const container = document.createElement('div');
                    container.classList.add('media-section');

                    const elementMedia = document.createElement('iframe');
                    elementMedia.setAttribute('src', url);
                    elementMedia.setAttribute('frameborder', '0');
                    elementMedia.setAttribute('frameborder', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
                    elementMedia.setAttribute('allowfullscreen', 'true');

                    container.appendChild(elementMedia);
                    element.appendChild(container);
                }

                insertGuideContainer.appendChild(element);
            })
        }

        if (imageSections && imageSections.length > 0) {
            const element = document.createElement('div'); // TODO: add class
            element.classList.add('media-container')

            imageSections.forEach(imageSection => {
                const imageCaption = imageSection.title;
                const imageURL = imageSection.url;

                if (imageCaption) {
                    const elementText = document.createElement('h4');
                    elementText.classList.add('heading');
                    elementText.textContent = imageCaption;

                    element.appendChild(elementText);
                }

                if (imageURL) {
                    const imageContainer = document.createElement('div');
                    imageContainer.classList.add('media-section');

                    const elementImage = document.createElement('img');
                    elementImage.setAttribute('src', imageURL);

                    imageContainer.appendChild(elementImage);
                    element.appendChild(imageContainer);
                }

                insertGuideContainer.appendChild(element);
            })
        }

        if (subSections && subSections.length > 0) {
            headingCounter = createSections(subSections, insertGuideContainer, headingCounter);
        }
    })

    return headingCounter;
}

function setLatestProductsSection(currentGuide) {
    const lastestProductsSection = document.getElementById('latestProductsSection');
    if (!lastestProductsSection) return;

    lastestProductsSection.innerHTML = '';

    const latestProducts = allProducts.filter(p => p.subcategory === currentGuide.category).slice(0,4);

    if (latestProducts.length <= 0) {
        container.innerHTML = `
        <div class="empty-guides-section">
            <span>There are no related guides for this topic yet.</span> 
            <a href="guides.html" class="link-text">
                Browse all guides
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M20 12L4 12M20 12L14 18M20 12L14 6" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
            </a>
        </div>`;
        container.classList.remove('product-grid')
    } else {
        latestProducts.forEach(product => {
            const listItem = createProductCard(product);
            lastestProductsSection.appendChild(listItem);
        })
    }

    cleanProductsByRow();
}

function cleanProductsByRow() {
    const container =  document.querySelector('main');
    const containerWidth = container.offsetWidth;
    const productCardWidth = 240;
    const productGrid = document.querySelector('.product-grid');
    const productCardGap = Number(window.getComputedStyle(productGrid).gap.slice(0, -2));

    const productsInRow = Math.floor((containerWidth + productCardGap) / (productCardWidth + productCardGap));

    const productsNumberDisplay = 4;
    if ((productsNumberDisplay / productsInRow) % 0) return;
    else {
        console.log(productsNumberDisplay % productsInRow);
    }
    // how many distributed rows determined by total / num in top row. 
    // 18/8 -> z = round down (ans) = 2 -> 18 - (8 * 2) = 2 remaining.
    // 8,8,2. 18. 
}

function switchLanguageButtons(container,guideId) {
    if (!container) return;

    container.addEventListener('change', async function() {

        hidePageDuringLoad();

        //en = english, sw = swahili
        //const lang1 = frontButton.dataset.language;
        const targetLanguage = this.value;

        // TODO: CHANGE GETALLTEXT TO GET TRANSLATED VERSION OF TEXT.
        const allGuides = await fetchAllGuides(targetLanguage);
        const currentGuide = allGuides.find(p => p.id === guideId);
        
        setGuideContent(currentGuide)

        // show page after loading language
        showPageAfterLoad();
    })
}