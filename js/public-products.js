// js/public-products.js

/* TODO: ADD PAGINATION FEATURE? */

import { addItemToCart } from './cart.js';
import { showNotification } from './notifications.js';
import { WHATSAPP_NUMBER } from './config.js'; // Import the centralized WhatsApp number

let allProducts = []; // This will act as a local cache for all products to enable fast searching.

let activeCategory = 'all';
let activeSubcategory = 'all';

// New
//activeCategories = [{category: option}, {brand: option}, {subcategory: option}];
let activeCategories = {category: 'all', brand: 'all', subcategory: 'all'};

const productDescription = `Discover a wide range of quality products all in one place — from the latest electronics and smart gadgets to everyday home essentials. Whether you're upgrading your space, searching for useful tech, or finding the perfect item for daily convenience, our collection combines style, functionality, and value to suit every lifestyle. If we don't have it, you probably don't need it!`;

function shortenText() {
    const longText = document.querySelector('#productPage .products-listing .short-paragraph');
    if (!longText) {return};

    longText.innerHTML = productDescription.trim();
    const textElement = window.getComputedStyle(longText);

    window.addEventListener('resize', () => {
        longText.innerHTML = productDescription.trim();
        checkTextSize(longText, textElement);
    })
    checkTextSize(longText, textElement);
}

// Starter
function checkTextSize(longText, textElement) {
    const paragraphLimit = 4;
    
    // Full Text
    let fullText = productDescription.trim();

    const textLineHeight = parseFloat(textElement.lineHeight);
    const textHeight = parseFloat(textElement.height);

    const numberOfLines = Math.floor(textHeight/textLineHeight) + 1;

    const numberOfCharactersPerLine = Math.floor(fullText.length/numberOfLines);
    const characterLimit = numberOfCharactersPerLine * paragraphLimit;

    const editedText = `${fullText.slice(0, characterLimit)}<button class="overflow-link read-more">&nbsp;... Read More</button><span class="overflow-text">${fullText.slice(characterLimit, fullText.length)}</span><button class="overflow-link read-less">&nbsp;Read Less</button>`;

    if (numberOfLines > paragraphLimit) {
        longText.innerHTML = editedText;
    }
    else {return}

    //show text from read_more
    readMoreOrLess(longText);
}

//Every .short-paragraph has child .overflow-text
function readMoreOrLess(longText) {
    const readMoreBtn = longText.querySelector('.overflow-link.read-more');
    const readLessBtn = longText.querySelector('.overflow-link.read-less');
    const overflowText = longText.querySelector('.overflow-text');

    if (!readMoreBtn || !readLessBtn) return;

    // add read less element, but check if it exists—
    // if read less is clicked- addeventlistener here, just put remove class read less
    readMoreBtn.addEventListener('click', () => {
        console.log('clicked read more button')
        if (!overflowText) {
            console.log("Read More Error: Parent element missing .overflow-text child.");
            return
        }

        // TO DO: you can replace .style.display with classList. add another class to overflowText (active);
        overflowText.style.display = 'inline';
        readMoreBtn.style.display = 'none';
        readLessBtn.style.display = 'inline';
    })

    readLessBtn.addEventListener('click', () => {
        if (!overflowText) {
            console.log("Read Less Error: Parent element missing .overflow-text child.");
            return
        }

        // TODO: you can replace .style.display with classList. add another class to overflowText (active);
        overflowText.style.display = 'none';
        readMoreBtn.style.display = 'inline';
        readLessBtn.style.display = 'none';
    })
}

/**
 * Creates and returns a product card HTML element.
 * @param {Object} product - The product data.
 * @returns {HTMLElement} The created product card element.
 */
export function createProductCard(product) { // <-- "export" keyword added here
    const productId = product.id;
    const productName = product.name;
    const productCategory = product.category;
    const productPrice = parseFloat(product.price);
    const formattedPrice = productPrice.toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const rawProductPrice = productPrice;
    const productDescription = product.description;
    const imageUrl = (product.imageUrls && Array.isArray(product.imageUrls) && product.imageUrls.length > 0)
        ? product.imageUrls[0]
        : 'img/placeholder-image.png';

    const cardHtml = `
        <div class="product-card" data-product-id="${productId}">
            <a href="product-detail.html?id=${productId}" class="product-link">
                <div class="product-image">
                    <img src="${imageUrl}" alt="${productName}">
                </div>
                <h3 class="product-name">${productName}</h3>
                <p class="product-price">Tzs ${formattedPrice}</p>
                <p class="product-description">${productDescription ? productDescription.substring(0, 70) + '...' : ''}</p>
            </a>
            <div class="product-actions">
                <button class="button add-to-cart-btn"
                            data-product-id="${productId}"
                            data-product-name="${productName}"
                            data-product-price="${rawProductPrice}"
                            data-product-image="${imageUrl}"
                            data-product-category="${productCategory}">
                        Add To Cart
                        <!--<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M16 8H17.1597C18.1999 8 19.0664 8.79732 19.1528 9.83391L19.8195 17.8339C19.9167 18.9999 18.9965 20 17.8264 20H6.1736C5.00352 20 4.08334 18.9999 4.18051 17.8339L4.84718 9.83391C4.93356 8.79732 5.80009 8 6.84027 8H8M16 8H8M16 8L16 7C16 5.93913 15.5786 4.92172 14.8284 4.17157C14.0783 3.42143 13.0609 3 12 3C10.9391 3 9.92172 3.42143 9.17157 4.17157C8.42143 4.92172 8 5.93913 8 7L8 8M16 8L16 12M8 8L8 12" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>-->
                </button>
                <button class="button buy-now-btn"
                            data-product-id="${productId}"
                            data-product-name="${productName}"
                            data-product-price="${rawProductPrice}">
                        Buy Now
                </button>
            </div>
        </div>
    `;

    const cardElement = document.createElement('div');
    cardElement.innerHTML = cardHtml.trim();

    // Attach event listeners
    const addToCartButton = cardElement.querySelector('.add-to-cart-btn');
    if (addToCartButton) {
        addToCartButton.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            const productToAdd = {
                id: addToCartButton.dataset.productId,
                name: addToCartButton.dataset.productName,
                category: addToCartButton.dataset.productCategory,
                price: parseFloat(addToCartButton.dataset.productPrice),
                imageUrls: [addToCartButton.dataset.productImage]
            };

            addItemToCart(productToAdd);
            showNotification(`${productToAdd.name} added to cart!`, 'success');
        });
    }

    const buyNowButton = cardElement.querySelector('.buy-now-btn');
    if (buyNowButton) {
        buyNowButton.addEventListener('click', (event) => {
            event.stopPropagation();
            event.preventDefault();
            const message = `Hello, I'd like to buy one unit of the following product from NolMart:\n\n` +
                `Product: ${buyNowButton.dataset.productName}\n` +
                `Price: Tzs ${parseFloat(buyNowButton.dataset.productPrice).toLocaleString('en-TZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}\n` +
                `Product ID: ${buyNowButton.dataset.productId}\n\n` +
                `Please confirm availability and guide me on payment and delivery. Thank you!`;
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
            window.location.href = whatsappUrl;
        });
    }

    return cardElement.firstChild;
}

/**
 * Renders a list of products into a specified container element.
 * @param {HTMLElement} container - The element to display products in.
 * @param {Array<Object>} productsToDisplay - An array of product objects.
 * @param {boolean} isCarousel - Whether to wrap cards in swiper-slide divs.
 */
function displayProducts(container, productsToDisplay, isCarousel = false) {
    container.innerHTML = ''; // Clear previous content or loading messages
    if (productsToDisplay.length === 0) {
        container.innerHTML = '<p class="search-message" style="text-align: center; width: 100%;">No products found.</p>';
        container.classList.remove('product-grid'); // to keep message at center
        return;
    }

    if (!isCarousel) {
        container.classList.add('product-grid');
    }

    productsToDisplay.forEach(product => {
        const productCard = createProductCard(product);

        if (isCarousel) {
            const slide = document.createElement('div');
            slide.classList.add('swiper-slide');
            slide.appendChild(productCard);
            container.appendChild(slide);
        } else {
            container.appendChild(productCard);
        }
    });
}

/**
 * Fetches products from the static JSON file, optionally filtered by category or limit.
 * @param {number|null} productLimit - Maximum number of products to fetch.
 * @param {string|null} category - Optional category to filter products by.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of products.
 */
async function fetchProductsFromDB(productLimit = null, category = null) {
    try {
        // Fetch products from the static JSON file
        const response = await fetch('/public/products.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        let products = await response.json();

        // Filter by category if specified
        if (category && category !== 'all') {
            products = products.filter(p => p.category === category);
        }

        // Apply limit if specified
        if (productLimit) {
            products = products.slice(0, productLimit);
        }

        return products;
    } catch (error) {
        console.error("Error fetching products from JSON:", error);
        showNotification(`Failed to load products: ${error.message}`, 'error');
        return []; // Return an empty array on error
    }
}

/**
 * Attaches event listeners for the improved search functionality.
 */
export function attachSearchEventListeners() {
    const searchInput = document.getElementById('searchInput');
    const searchResultsContainer = document.getElementById('searchResultsContainer');
    const noSearchResultsMessage = document.getElementById('noSearchResultsMessage');
    const searchInitialMessage = document.querySelector('.search-initial-message');

    if (!searchInput || !searchResultsContainer) return;

    let searchTimeout;
    searchInput.addEventListener('input', (event) => {
        console.log(event, searchResultsContainer);
        clearTimeout(searchTimeout);
        const searchTerm = event.target.value.trim().toLowerCase();

        if (searchInitialMessage) searchInitialMessage.style.display = 'none';
        if (noSearchResultsMessage) noSearchResultsMessage.style.display = 'none';

        if (searchTerm.length === 0) {
            searchResultsContainer.innerHTML = '';
            
            if (searchInitialMessage) {
                searchInitialMessage.style.display = 'block';
                searchResultsContainer.append(searchInitialMessage);
            }

            return
        }

        searchResultsContainer.innerHTML = '<p class="search-message" style="text-align: center; width: 100%;">Searching...</p>';

        searchTimeout = setTimeout(() => {
            const filteredProducts = allProducts.filter(product => {
                const nameMatch = product.name.toLowerCase().includes(searchTerm);
                const descriptionMatch = product.description && product.description.toLowerCase().includes(searchTerm);
                return nameMatch || descriptionMatch;
            });

            if (filteredProducts.length > 0) {
                displayProducts(searchResultsContainer, filteredProducts, false);
            } else {
                searchResultsContainer.innerHTML = '';
                if (noSearchResultsMessage) noSearchResultsMessage.style.display = 'block';
            }
        }, 300);
    });
}

/**
 * Initializes the content for the homepage.
 */
async function initHomePage() {
    // 1. Populate the 'Latest Products' carousel
    const latestProductsCarouselTrack = document.getElementById('latestProductsCarouselTrack');
    if (latestProductsCarouselTrack) {
        const latestProducts = allProducts.slice(0, 10);
        displayProducts(latestProductsCarouselTrack, latestProducts, true);
        document.dispatchEvent(new CustomEvent('carouselContentLoaded'));
    }

    // 2. Populate the 'Top Selling Products' section
    const topSellingContainer = document.getElementById('top-selling-container');
    if (topSellingContainer) {
        const topSellerIds = ['google-pixel-9-pro', 'samsung-galaxy-a16', 'google-pixel-8-pro', 'google-pixel-6'];
        const topSellers = allProducts.filter(p => topSellerIds.includes(p.id));
        displayProducts(topSellingContainer, topSellers, false);
    }

    // 3. Define the product categories to display on the homepage
    const categories = ['Electronics', 'Gadgets', 'Home', 'Office'];

    // 4. Loop through each category and populate its product section
    categories.forEach(category => {
        const containerId = `${category.toLowerCase()}-products-container`;
        const productContainer = document.getElementById(containerId);

        if (productContainer) {
            const section = productContainer.closest('.category-section');
            if (!section) return;

            const categoryProducts = allProducts.filter(p => p.category === category);
            
            if (categoryProducts.length === 0) {
                section.style.display = 'none';
            } else {
                section.style.display = '';
                const productsToDisplay = categoryProducts.slice(0, 4);
                displayProducts(productContainer, productsToDisplay, false);
            }
        }
    });
}

/**
 * Initializes the content for the main products page.
 */
async function initProductsPage() {
    const productsContainer = document.getElementById('productsContainer');
    if (!productsContainer) return;

    const loadingMsg = document.getElementById('loadingMessage');
    if (loadingMsg) loadingMsg.style.display = 'block';

    // allProducts is now assumed to be pre-loaded by the DOMContentLoaded event listener
    if (loadingMsg) loadingMsg.style.display = 'none';

    // Handle URL params for pre-filtering
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get('category');
    const subcategoryFromUrl = urlParams.get('subcategory');
    // TO DO: FOR BRANDS

    if (categoryFromUrl) {
        // only for "type" category
        activeCategories['category'] = categoryFromUrl;
        if (subcategoryFromUrl) {
            activeCategories.subcategory = subcategoryFromUrl;
        }
    }

    setupCategoryFilters();
    updateSubcategoryFilters();
    updateProductDisplay();
    setFilterFunction();
}

function setFilterFunction() {
    const openFilterBtns = document.querySelectorAll('.open-filter-btn');
    const filterOverlay = document.getElementById('filterOverlay');
    const closeFilterBtn = document.getElementById('closeFilterBtn');

    //used array indexing, cos its only 2 places to click to open filter
    if (openFilterBtns[0] && openFilterBtns[1] && closeFilterBtn && filterOverlay) {
        openFilterBtns.forEach(openFilterBtn => {
            openFilterBtn.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default link behavior
                filterOverlay.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scrolling background
            });
        })

        closeFilterBtn.addEventListener('click', () => {
            closeFloatingFilter();
        });

        // Close overlay if clicking outside content (on the overlay itself)
        filterOverlay.addEventListener('click', (e) => {
            if (e.target === filterOverlay) {
                filterOverlay.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
}

function closeFloatingFilter() {
    const filterOverlay = document.getElementById('filterOverlay');

    filterOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// TO DO: add clear option
function sortProducts(container, filteredProducts) {
    const radios = document.querySelectorAll('input[name="main-sort-section"]');

    radios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            let sortedProducts = [];
            
            if (event.target.value === 'price-high') {
                sortedProducts = filteredProducts.sort((a,b) => a.price-b.price)
            } else if (event.target.value === 'price-low') {
                sortedProducts = filteredProducts.sort((a,b) => b.price-a.price)
            }
            else return;

            displayProducts(container, sortedProducts, false)
        })
    })
}

/**
 * Updates the displayed products based on the current active filters.
 */
function updateProductDisplay() {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    let filteredProducts = allProducts;

    Object.entries(activeCategories).forEach(([category, option]) => {
        if (option !== 'all') {
            filteredProducts = filteredProducts.filter(p => p[category] === option);
            //example: p[brand] === samsung? | p[type] === home? etc.
        } else return;
    })

    displayProducts(container, filteredProducts, false);
    sortProducts(container, filteredProducts);
}

//To Do: So that this does for all pages, not only products page
function setNavDropdownLinks(title, items) {
    console.log(title, items);

    const listItem = document.createElement('li');
    listItem.dataset.filterType = title;

    const listItemTitle = document.createElement('div');
    listItemTitle.textContent = capitalizeFirstLetter(title);;

    listItem.appendChild(listItemTitle);

    const productTypeParent = document.createElement('ul');
    items.forEach(item => {
        const productType = document.createElement('li');
        const productLink = document.createElement('a');

        const hrefLink = `products.html?${title}=${item}`;
        productLink.setAttribute('href', hrefLink);

        console.log('href link: ', hrefLink);
        productLink.textContent = capitalizeFirstLetter(item);
        productType.appendChild(productLink);

        productTypeParent.appendChild(productType)
    })

    listItem.appendChild(productTypeParent);

    const container = document.querySelector('.main-header .nav-links .nav-dropdown ul');
    container.appendChild(listItem);
}

function capitalizeFirstLetter(word) {
    return word.slice(0,1).toUpperCase() + word.slice(1);
}

/**
 * Sets up the main category filter buttons.
 */
function setupCategoryFilters() {
    //Extra design for active selected filter
    const extraSpan = document.createElement('div');
    extraSpan.classList.add('category-selected-status');

    // use loop to process categories & brands
    // eg: category = type | brand | subcategory etc
    // eg option = samsung | hp | iphone etc
    Object.entries(activeCategories).forEach(([category, option]) => {
        const filterContainer = document.getElementById(`productsCategoryFilter${category.slice(0,1).toUpperCase() + category.slice(1,category.length)}`);
        if (!filterContainer) return;

        // Get unique filter options and ensure 'all' is first.
        // Ex: all Type (if category == type) : Home, Electronics etc.
        const filterOptions = [...new Set(allProducts.map(p => p[category]).filter(Boolean))].sort();
        filterOptions.unshift('all');

        //nav
        setNavDropdownLinks(category, filterOptions);

        filterContainer.innerHTML = '';

        filterOptions.forEach(filterOption => {
            const categoryOption = document.createElement('li');
            categoryOption.classList.add('category-filter-option');
            categoryOption.dataset['category'] = filterOption;
            categoryOption.textContent = filterOption === 'all' ? 'All' : filterOption;

            if (filterOption === activeCategories[`${category}`]) {
                categoryOption.classList.add('active-category-filter');
            }

            const extraSpan = document.createElement('div');
            extraSpan.classList.add('category-selected-status');
            extraSpan.innerHTML = `<svg viewBox="0 -0.5 25 25" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.5 12.5L10.167 17L19.5 8" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>`;
            categoryOption.append(extraSpan);

            filterContainer.appendChild(categoryOption);

            categoryOption.addEventListener('click', () => {
                activeCategories[category] = categoryOption.dataset['category'];

                activeSubcategory = 'all'; // Reset subcategory when main category changes

                // Update active class for main categories
                filterContainer.querySelectorAll('.category-filter-option').forEach(btn => btn.classList.remove('active-category-filter'));
                categoryOption.classList.add('active-category-filter');

                updateSubcategoryFilters(activeCategories.category);
                updateProductDisplay();

                // scroll to the top to get top products first
                document.getElementById('productPage').scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            });
        });
    })
}

/**
 * Sets up or updates the subcategory filter buttons based on the active main category.
 */
// change according to new changes with activeCategories
function updateSubcategoryFilters() {
    const subFilterContainer = document.getElementById('productsSubcategoryFilterContainer');
    if (!subFilterContainer) return;

    subFilterContainer.innerHTML = '';

    // make loop fpr everything down
    if (activeCategory === 'all') {
        return; // No subcategories if 'All Products' is selected
    }

    const productsInActiveCategory = allProducts.filter(p => p.category === activeCategory);
    const subcategories = [...new Set(productsInActiveCategory.map(p => p.subcategory).filter(Boolean))].sort();

    if (subcategories.length === 0) {
        return; // Don't show the subcategory bar if there are no subcategories
    }

    subcategories.unshift('all'); // Add 'All' option for the current category

    // TO DO.
    subcategories.forEach(subcategory => {
        const button = document.createElement('button');
        button.classList.add('button', 'subcategory-filter-btn'); // New class for styling
        button.dataset.subcategory = subcategory;
        button.textContent = subcategory;
        if (subcategory === activeSubcategory) {
            button.classList.add('active-subcategory-filter'); // New active class
        }
        subFilterContainer.appendChild(button);
    });

    subFilterContainer.addEventListener('click', (event) => {
        if (!event.target.classList.contains('subcategory-filter-btn')) return;

        activeSubcategory = event.target.dataset.subcategory;

        // Update active class for subcategories
        subFilterContainer.querySelectorAll('.subcategory-filter-btn').forEach(btn => btn.classList.remove('active-subcategory-filter'));
        event.target.classList.add('active-subcategory-filter');

        updateProductDisplay();
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch all products once on initial load and cache them.
    // This is crucial for filtering and search to work correctly across the site.
    allProducts = await fetchProductsFromDB();
    
    // Initialize page-specific content
    if (document.getElementById('latestProductsCarouselTrack')) {
        initHomePage();
    }
    if (document.getElementById('productsContainer')) {
        initProductsPage();
    }

    //shorten paragraph texts
    shortenText();
});
