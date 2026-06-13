// js/public-products.js

/* TODO: DISABLE CERTAIN FILTERS, WITH .FILTER, WHEN A FILTER IS SELECTED */

import { addItemToCart } from './cart.js';
import { showNotification } from './notifications.js';
import { WHATSAPP_NUMBER } from './config.js'; // Import the centralized WhatsApp number

// Global const/vars

let allProducts = []; // This will act as a local cache for all products to enable fast searching.

let activeCategory = 'all';
let activeSubcategory = 'all';

//update screen size 
let screenType = updateScreenSize();

// TODO: Make it multi-select with [].
let activeCategories = {category: 'all', subcategory: 'all', brand: 'all'};

const productDescription = `Discover everything you need in one place — from the latest electronics and smart gadgets to everyday home essentials. If we don't have it, you probably don't need it!`;

const paginationPageLimit = 16;
const defaultPageNumber = 1;
let pageNumber = 1;

// pagination back/next buttons
const backButton = document.querySelector('#paginationContainer .pagination-button.back-button');
const nextButton = document.querySelector('#paginationContainer .pagination-button.next-button');

function togglePageButton(lastPageNumber) {
    if (pageNumber === 1) {backButton.classList.add('disabled')} 
    else {backButton.classList.remove('disabled')}

    if (pageNumber === lastPageNumber) {nextButton.classList.add('disabled')} 
    else {nextButton.classList.remove('disabled')}
}

function updateUrlManually(param, value, action) {
    if (!(param && value && action)) return;

    const currentUrl = new URL(window.location.href);

    if (action === 'set') {currentUrl.searchParams.set(param, value)}
    else if (action === 'delete') {currentUrl.searchParams.delete(param)}

    //remove param if page is 1
    if (param === 'page' && value==1) {
        currentUrl.searchParams.delete(param)
    }

    window.history.pushState({}, '', currentUrl);
}

// newPage is either page number in url OR via button number.
function controlPagePagination(newPage) {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    const productCards = container.querySelectorAll('.product-card');
    const totalNumberOfProducts = productCards.length;

    const lastPageNumber = Math.ceil(totalNumberOfProducts / paginationPageLimit);
    
    newPage = Number(newPage);
    if (!newPage || (newPage > lastPageNumber || newPage < defaultPageNumber)) {
        pageNumber = defaultPageNumber;
    } else {
        pageNumber = newPage;
    }

    scrollToTop();

    // deal with start product, ensuring pagenumber is also valid
    let startProduct = (pageNumber - defaultPageNumber) * paginationPageLimit;
    if (!productCards[startProduct]) {
        startProduct = 0;
    }

    // set last product to be displayed
    let endProduct = (startProduct + (paginationPageLimit-1));
    if (!productCards[endProduct]) {
        endProduct = totalNumberOfProducts - 1;
    }

    productCards.forEach(p => p.classList.remove('active'));
    for (let i = startProduct; i <= endProduct; i++) {
        productCards[i].classList.add('active');
    }

    //generate pagination buttons
    generatePaginationButtons(lastPageNumber);
    togglePageButton(lastPageNumber);
    updateUrlManually('page', pageNumber, 'set'); //update param url
}


const pageButtonsLimit = 7;

function generatePaginationButtons(lastPageNumber) {
    const container = document.querySelector('#paginationContainer ul');

    let allButtons = '';
    const pageDotter = Math.ceil(pageButtonsLimit/2);

    let dots = '';
    let startDots = '';
    let endDots = '';

    let startPage = 1;
    let endPage = lastPageNumber;

    if (lastPageNumber >= pageButtonsLimit) {
        dots = '<li class="product-page-button pagination-button">...</li>';

        if (pageNumber > pageDotter) {
            startDots = dots;

            if (pageNumber <= lastPageNumber - pageDotter) { // if in the middle...
                startPage = pageNumber - 1;
            } else { // if at the last pages, with start dots, no end dots.
                startPage = lastPageNumber - pageDotter
            }
        } else {
            startPage = defaultPageNumber + 1;
        }

        if (pageNumber <= lastPageNumber - pageDotter) {
            endDots = dots;
            
            if (pageNumber > (pageDotter-1)) { // if start and end has dots
                endPage = pageNumber + 1;
            } else { //if the start has no dots, but end does.
                endPage = pageDotter;
            }
        } else {
            endPage = lastPageNumber
        }
    }

    //add first list item
    const firstListItem = `
    <li>
        <input type="radio" name="pagination-input" id="pagination-1" value="1" ${(1 === pageNumber) ? 'checked' : ''} />
        <label class="product-page-button pagination-button" for="pagination-1">
            <span>1</span>
        </label>
    </li>
    `;
    allButtons += firstListItem;

    if (lastPageNumber < 2) {
        container.innerHTML = allButtons;
        return;
    }

    // add dots, conditioned in above if statements
    allButtons += startDots;


    for (let i = startPage; i <= endPage; i++) {
        if (i === 1 || i === lastPageNumber) continue;

        const listItem = `
        <li>
            <input type="radio" name="pagination-input" id="pagination-${i}" value="${i}" ${(i === pageNumber) ? 'checked' : ''} />
            <label class="product-page-button pagination-button" for="pagination-${i}">
                <span>${i}</span>
            </label>
        </li>`;
    

        allButtons += listItem;
    }

    // add last list item
    allButtons += endDots;
    
    const lastListItem = `
    <li>
        <input type="radio" name="pagination-input" id="pagination-${lastPageNumber}" value="${lastPageNumber}" ${(lastPageNumber === pageNumber) ? 'checked' : ''} />
        <label class="product-page-button pagination-button" for="pagination-${lastPageNumber}">
            <span>${lastPageNumber}</span>
        </label>
    </li>`;
    allButtons += lastListItem;

    container.innerHTML = allButtons;
}

// TODO: SET SO THAT IT RUNS ONLY ONCE, NOT EVERY TIME PAGINATION BUTOTN IS CLICKED
/* default checked, should be the one in url, else: default */
function listenPaginationButtons() {
    const container = document.getElementById('paginationContainer');

    container.addEventListener('change', (event) => {
        const item = event.target;
        if (!item.matches('input[type="radio"][name="pagination-input"]')) return;

        const newPageNumber = Number(item.value);

        controlPagePagination(newPageNumber);
    })
}

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
//responsible to create prodct card and display them.
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

function lowercaseUrlKeys() {
    const originalParams = new URLSearchParams(window.location.search);

    const lowerParams = new URLSearchParams(
        Array.from(originalParams, ([key, value]) => [key.toLowerCase(), value])
    );

    const newUrl = `${window.location.pathname}?${lowerParams.toString()}`;
    window.history.replaceState({}, '', newUrl);
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

    let dynamicCategory;
    Object.entries(activeCategories).forEach(([category,option]) => {
        dynamicCategory = isCategoryType(category);

        const optionFromUrl = urlParams.get(dynamicCategory);

        if (!optionFromUrl) {return}

        // makes parameter's value NOT capital sensitive
        let refinedOptionFromUrl = optionFromUrl;
        const optionItem = allProducts.find(p => {
            if (p[`${category}`].toLowerCase() === optionFromUrl.toLowerCase()) {
                refinedOptionFromUrl = p[`${category}`];
                return true;
            } return false;
        });

        activeCategories[category] = refinedOptionFromUrl;
    })
    
    setupCategoryFilters();
    setFilterFunction();
    controlPagePagination(urlParams.get('page'));
    listenPaginationButtons();
    updateProductDisplay();

    // get all sort
    const radios = document.querySelectorAll('input[name="main-sort-section"]');
    radios.forEach(radio => {
        radio.addEventListener('change', (event) => {
            updateProductDisplay(true, event)
        })
    })

    window.addEventListener('resize', () => {
        screenType = updateScreenSize();
        setupCategoryFilters();
    })

    // Listen for back / next click and update page pagination
    if (backButton) {
        backButton.addEventListener('click', () => {
            controlPagePagination(pageNumber - 1)
        })
    }

    if (nextButton) {
        nextButton.addEventListener('click', () => {
            controlPagePagination(pageNumber + 1)
        })
    }
}

function updateScreenSize() {
    return (window.innerWidth > 1000) ? 'desktop' : 'mobile';
}

/* sets up smaller screens (only) filter */
function setFilterFunction() {
    const openFilterBtns = document.querySelectorAll('.open-filter-btn');
    const filterOverlay = document.querySelector('#filterOverlay.mobile');
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
            closeFloatingFilter(filterOverlay);
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

function closeFloatingFilter(filterOverlay) {
    filterOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore scrolling
}

// TODO: FIX 
// TO DO: add clear option
function sortProducts(event, filteredProducts) {
    const container = document.getElementById('productsContainer');
    if (!container) return;

    //const filteredProducts = updateProductDisplay(true);

    let sortedProducts = [];

    if (event.target.value === 'price-high') {
        sortedProducts = filteredProducts.sort((a,b) => a.price-b.price)
    } else if (event.target.value === 'price-low') {
        sortedProducts = filteredProducts.sort((a,b) => b.price-a.price)
    }
    else return;
}

// clears sort selections
function clearSort() {
    const radios = document.querySelectorAll('input[name="main-sort-section"]');

    radios.forEach(radio => {
        radio.checked = false;
    })
}

//rewrites subcategory as type
function isCategoryType(item) {
    if (item === 'subcategory')
    return 'type'
    else return item
}

/**
 * Updates the displayed products based on the current active filters.
 */
function updateProductDisplay(sort=false, event=null) {
    const container = document.getElementById('productsContainer');
    if (!container) return;                                                                                                                                   

    let filteredProducts = allProducts;

    Object.entries(activeCategories).forEach(([category, option]) => {
        if (option !== 'all') {
            filteredProducts = filteredProducts.filter(p => p[category] === option);
            //example: p[brand] === samsung? | p[type] === home? etc.

            updateUrlManually(isCategoryType(category),option,'set')
        } else {
            //ensures category is not filtered, so 'all' can be set.
            updateUrlManually(isCategoryType(category),option,'delete');
            return
        };
    })

    if (sort && event) {
        sortProducts(event, filteredProducts);
    }

    displayProducts(container, filteredProducts, false);
    controlPagePagination(defaultPageNumber);
}

function setNavDropdownLinks() {
    Object.entries(activeCategories).forEach(([category, option]) => {

        // Get unique filter options and ensure 'all' is first.
        // Ex: all Type (if category == type) : Home, Electronics etc.
        const filterOptions = createFilterOptions(category);
        
        //create dropdown elements
        const listItem = document.createElement('li');
        listItem.dataset.filterType = category;

        const listItemTitle = document.createElement('div');
        listItemTitle.textContent = `SHOP BY ${isCategoryType(category).toUpperCase()}`;

        listItem.appendChild(listItemTitle);

        const productTypeParent = document.createElement('ul');
        filterOptions.forEach(item => {
            const productType = document.createElement('li');
            const productLink = document.createElement('a');

            //TODO: FIX link
            const hrefLink = `products.html?${isCategoryType(category)}=${item}`;
            productLink.setAttribute('href', hrefLink);

            productLink.textContent = capitalizeFirstLetter(item);
            productType.appendChild(productLink);

            productTypeParent.appendChild(productType)
        })

        listItem.appendChild(productTypeParent);

        const container = document.querySelector('.main-header .nav-links .nav-dropdown ul');
        container.appendChild(listItem);
    })
}

function capitalizeFirstLetter(word) {
    if (!word) return null;

    return word.slice(0,1).toUpperCase() + word.slice(1);
}


function createFilterOptions(category) {
    const filterOptions = [...new Set(allProducts.map(p => p[category]).filter(Boolean))].sort();
    filterOptions.unshift('all');

    return filterOptions;
}

/**
 * Sets up the main category filter buttons.
 */
function setupCategoryFilters() {
    //Extra design for active selected filter
    const extraSpan = document.createElement('div');
    extraSpan.classList.add('category-selected-status');

    const filterScreenType = document.querySelector(`#filterOverlay.${screenType}`);

    // Ensure empty before going through list *
    const filterHolder = filterScreenType.querySelector('.category-filters-main ul');
    filterHolder.innerHTML = '';

    // use loop to process categories & brands
    // eg: category = type | brand | subcategory etc
    // eg option = samsung | hp | iphone etc
    Object.entries(activeCategories).forEach(([category, option]) => {
        //Dynamically Set HTML Filter List Items
        setFilterListItem(filterHolder, category);

        const filterContainer = filterScreenType.querySelector(`#productsCategoryFilter${capitalizeFirstLetter(category)}`);
        if (!filterContainer) return;

        // Get unique filter options and ensure 'all' is first.
        // Ex: all Type (if category == type) : Home, Electronics etc.
        const filterOptions = createFilterOptions(category);

        filterContainer.innerHTML = ''; // Ensure no options, avoid repeats, eg at click of an option

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
        });
    })

    //listen for filter option click
    filterHolder.addEventListener('click', (event) => {
        const categoryOption = event.target;
        if (!categoryOption.matches('.category-filter-option')) return;

        const filterContainer = categoryOption.closest('ul');

        const filterType = filterContainer.id.replace('productsCategoryFilter','').toLowerCase();
        activeCategories[filterType] = categoryOption.dataset['category'];

        // Update active class for main categories
        filterContainer.querySelectorAll('.category-filter-option').forEach(btn => btn.classList.remove('active-category-filter'));
        categoryOption.classList.add('active-category-filter');

        if (screenType==='mobile') clearSort();
        updateProductDisplay(); // update product display, as filter is updated

        // scroll to the top to get top products first
        scrollToTop()
    })
}

function scrollToTop() {
    document.getElementById('topPage').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}

function setFilterListItem(container, currentCategory) {
    const item = `<li class="filter-list-item">
            <input type="checkbox" name="main-filter-section" id="main-filter-${currentCategory}-${screenType}" checked hidden/>

            <label class="filter-title" for="main-filter-${currentCategory}-${screenType}">
                <span class="category-filter-design"></span>
                <span>${(currentCategory === "subcategory") ? "Type" : capitalizeFirstLetter(currentCategory)}</span>
                <span class="category-arrow">
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M10 17L15 12L10 7" stroke="#000000" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path> </g></svg>
                </span>
            </label>

            <div class="category-filters">
                <ul id="productsCategoryFilter${capitalizeFirstLetter(currentCategory)}"></ul>
            </div>
        </li>`

    container.innerHTML += item;
}

/**
 * Sets up or updates the subcategory filter buttons based on the active main category.
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Fetch all products once on initial load and cache them.
    // This is crucial for filtering and search to work correctly across the site.
    allProducts = await fetchProductsFromDB();
    
    // Initialize page-specific content
    if (document.getElementById('latestProductsCarouselTrack')) {
        initHomePage();
    }
    if (document.getElementById('productsContainer')) {
        lowercaseUrlKeys();
        initProductsPage();
    }

    //nav
    setNavDropdownLinks();

    //shorten paragraph texts
    shortenText();
});
