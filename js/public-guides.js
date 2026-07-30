import { showPageAfterLoad } from './loadPage.js';

let allGuides = [];

/**
 * Fetches products from the static JSON file, optionally filtered by category or limit.
 * @param {number|null} guideLimit - Maximum number of products to fetch.
 * @param {string|null} category - Optional category to filter products by.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of products.
 */
async function fetchGuidesFromDB(guideLimit = null, category = null, lang = "en") {
    try {
        // Fetch products from the static JSON file
        const response = await fetch(`/public/guides/${lang}.json`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let products = await response.json();

        // Filter by category if specified
        if (category && category.toLowerCase() !== 'all') {
            products = products.filter(p => p.category === category);
        }

        // Apply limit if specified
        if (guideLimit) {
            products = products.slice(0, guideLimit);
        }

        return products;
    } catch (error) {
        console.error("Error fetching products from JSON:", error);
        showNotification(`Failed to load products: ${error.message}`, 'error');
        return []; // Return an empty array on error
    }
}

/**
 * Creates and returns a product card HTML element.
 * @param {Object} guide - The guide data.
 * @returns {HTMLElement} The created product card element.
 */
export function createGuideCard(guide) { // <-- "export" keyword added here
    const productId = guide.id;
    const productName = guide.name;
    const productCategory = guide.category;
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
    cardElement.classList.add('guide-card');
    cardElement.setAttribute('data-guide-id', productId);
    cardElement.innerHTML = cardHtml.trim();

    return cardElement;
}

/**
 * Renders a list of products into a specified container element.
 * @param {HTMLElement} container - The element to display products in.
 * @param {Array<Object>} guidesToDisplay - An array of product objects.
 * @param {boolean} isCarousel - Whether to wrap cards in swiper-slide divs.
 */
//responsible to create prodct card and display them.
function displayProducts(container, guidesToDisplay) {
    container.innerHTML = ''; // Clear previous content or loading messages

    if (guidesToDisplay.length === 0) {
        container.innerHTML = '<p class="search-message" style="text-align: center; width: 100%;">No guides found.</p>';
        container.classList.remove('product-grid'); // to keep message at center
        return;
    }

    //container.classList.add('product-grid');
    guidesToDisplay.forEach(guide => {
        const guideCard = createGuideCard(guide);

        container.appendChild(guideCard);
    });
}

async function filterGuides(container, category) {
    const products = await fetchGuidesFromDB(null, category);

    displayProducts(container, products)
}

function setGuideCategories(container, guidesToDisplay) {
    // Set categories
    const categorySet = new Set();
    guidesToDisplay.forEach(guide => {
        // get available category
        categorySet.add(guide.category);
    });

    const availableCategories = ['All', ...categorySet];

    const categoryContainer = document.querySelector('#guideCategoryList');
    availableCategories.forEach(cat => {
        const elementList = document.createElement('li');
        const elementButton = document.createElement('button');

        elementButton.classList.add('guide-category');

        elementButton.textContent = cat;

        if (cat === "All") {
            elementButton.classList.add('active')
        }

        elementButton.addEventListener('click', () => {
            categoryContainer.querySelector('.guide-category.active').classList.remove('active');

            elementButton.classList.add('active');
            filterGuides(container, cat);
        })
        elementList.appendChild(elementButton);
        categoryContainer.appendChild(elementList);
    })
}

document.addEventListener('DOMContentLoaded', async () => {
    const guideContentContainer = document.querySelector('#guidesContainer .dynamic-data');
    allGuides = await fetchGuidesFromDB();

    displayProducts(guideContentContainer, allGuides);
    setGuideCategories(guideContentContainer, allGuides);

    showPageAfterLoad();
})