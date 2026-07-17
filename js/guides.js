import { showNotification } from './notifications.js';
import { showPageAfterLoad } from './loadPage.js';
import { hidePageDuringLoad } from './loadPage.js';

/**
 * Fetches all products from the static JSON file.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of products.
 */

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
    if (lang==='en') {
        fetcher = '/public/guides.json'
    } else {
        fetcher = `/translations/guides/${lang}.json`
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

/**
 * Fetches and displays related products based on category.
 * @param {string} currentGuideId - The ID of the product currently being viewed, to exclude it from the list.
 * @param {string} category - The category to fetch related products from.
 */
/*async function fetchAndDisplayRelatedGuides(currentGuideId, category) {
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
            relatedProducts.forEach(product => {
                const productCard = createGuideCard(product);
                container.appendChild(productCard);
            });
        } else {
            container.innerHTML = `<p>No similar items found.</p>`;
        }
    } catch (error) {
        console.error("Error fetching related products:", error);
        container.innerHTML = `<p>Could not load related items.</p>`;
    }
}*/

let allProducts = [];

// TODO: CHANGE CODE SO THAT IT ONLY FETCHES GUIDE ACCORDING TO ID IN PAGE URL
document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const guideId = urlParams.get('title');

    const guideContentContainer = document.getElementById('guideContentContainer');
    const errorMessage = document.getElementById('errorMessage');

    const pageListingName = document.querySelector('.page-listing li.active a'); //
    const productDescription = document.getElementById('productDescription');

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
        const allGuides = await fetchAllGuides('en');
        currentGuide = allGuides.find(p => p.id === guideId);

        if (currentGuide) {
            setLatestProductsSection(currentGuide);

            // TODO: Select different container
            /*const breadcrumbContainer = document.getElementById('breadcrumb-container');
            if (breadcrumbContainer) {
                const category = currentGuide.category || '';
                const subcategory = currentGuide.subcategory || '';
                const productNameText = currentGuide.name || 'Product';

                const breadcrumbParts = [];

                if (category) {
                    breadcrumbParts.push(`<a href="products.html?category=${encodeURIComponent(category)}">${category}</a>`);
                }
                if (subcategory) {
                    // Assuming the link for a subcategory also needs the parent category
                    breadcrumbParts.push(`<a href="products.html?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcategory)}">${subcategory}</a>`);
                }
                breadcrumbParts.push(`<span>${productNameText}</span>`);

                breadcrumbContainer.innerHTML = breadcrumbParts.join(' / ');
            }*/
            
            //set guideContent
            
            pageListingName.textContent = currentGuide.name || 'N/A';

            //TODO: create foreach to process all sections.
            setGuideContent(currentGuide)
            // end of guide content loaded

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
            /*if (currentGuide.category) {
                fetchAndDisplayRelatedGuides(guideId, currentGuide.category);
            }*/

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
})

function setGuideContent(currentGuide) {
    const guideContentName = document.getElementById('guideContentName');
    const guideContentDate = document.getElementById('guideContentDate');

    guideContentName.textContent = currentGuide.name || 'N/A';

    const date = new Date(currentGuide.createdAt);
    guideContentDate.textContent = "Created At: " + (date.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}) || 'N/A');

    const insertGuideContainer = guideContentContainer.querySelector('.dynamic-data');
    insertGuideContainer.innerHTML = ''
    createSections(currentGuide, insertGuideContainer);
}

export function createSections(currentGuide, insertGuideContainer) {
    if (!currentGuide || !insertGuideContainer) return;

    const sections = currentGuide.sections || currentGuide;

    console.log(currentGuide)
    sections.forEach(section => {
        const heading = section.heading;
        const paragraph = section.paragraph;
        const list = section.list;
        const imageSections = section.image_sections;
        const subSections = section.sub_sections;

        if (heading && heading.length > 0) {
            const element = document.createElement('h3');
            element.classList.add('heading');
            element.textContent = heading;

            insertGuideContainer.appendChild(element);
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

        if (subSections && subSections.length > 0) {
            createSections(subSections, insertGuideContainer);
        }
    })
}

function setLatestProductsSection(currentGuide) {
    const lastestProductsSection = document.getElementById('latestProductsSection');
    if (!lastestProductsSection) return;

    lastestProductsSection.innerHTML = '';

    const latestProducts = allProducts.filter(p => p.subcategory === currentGuide.category).slice(0,6);
    latestProducts.forEach(product => {
        const listItem = `
        <li>
            <div class="image-section">
                <img src="${product.imageUrls}" alt="${product.name}" />
            </div>
            <h4 class="sub-heading">${product.name}</h4>
        </li>
        `
        lastestProductsSection.innerHTML += listItem;
    })
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
        console.log(currentGuide)
        setGuideContent(currentGuide)

        // show page after loading language
        showPageAfterLoad();
    })
}