import { showNotification } from './notifications.js';

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

async function fetchAllGuides() {
    try {
        const response = await fetch('/public/guides.json');
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
}


function styleDescription(description) {
    if (!description) {
        return 'No description available.';
    }
    // Trim the description to remove leading/trailing whitespace
    const trimmedDescription = description.trim();
    const lines = trimmedDescription.split('\n').filter(line => line.trim().length > 0);

    if (lines.length === 0) {
        return 'No description available.';
    }

    // Check if the content is intended to be a list
    const isList = lines.every(line => line.trim().startsWith('-'));

    if (isList) {
        // Process as a list
        const listItems = lines.map(line => {
            // Remove the "- " prefix and wrap in <li>
            const itemContent = line.trim().substring(1).trim();
            return `<li>${itemContent}</li>`;
        }).join('');
        return `<ul>${listItems}</ul>`;
    } else {
        // If not a list, treat as paragraphs, replacing newlines with <br>
        return trimmedDescription.replace(/\n/g, '<br>');
    }
}

let allProducts = [];

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const guideId = urlParams.get('title');

    const guideContentContainer = document.getElementById('guideContentContainer');
    const loadingMessage = document.getElementById('loadingMessage');
    const errorMessage = document.getElementById('errorMessage');

    const guideContentName = document.getElementById('guideContentName'); //
    const guideContentDate = document.getElementById('guideContentDate');
    const pageListingName = document.querySelector('.page-listing li.active a'); //
    const productDescription = document.getElementById('productDescription');

    let currentGuide = null;

    if (!guideId) {
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) {
            errorMessage.textContent = "Product ID is missing in the URL.";
            errorMessage.style.display = 'block';
        }
        showNotification("Product ID is missing in the URL.", 'error');
        return;
    }

    if (loadingMessage) loadingMessage.style.display = 'block';
    if (errorMessage) errorMessage.style.display = 'none';
    if (guideContentContainer) guideContentContainer.style.display = 'none';

    //get products
    allProducts = await fetchProductsFromDB();

    //main content
    try {
        // Fetch all products and find the one matching the ID
        const allGuides = await fetchAllGuides();
        currentGuide = allGuides.find(p => p.id === guideId);

        if (loadingMessage) loadingMessage.style.display = 'none';

        if (currentGuide) {
            setLatestProductsSection(currentGuide);

            // TODO: Select different container
            const breadcrumbContainer = document.getElementById('breadcrumb-container');
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
            }
            
            //set guideContentName
            guideContentName.textContent = currentGuide.name || 'N/A';
            const date = new Date(currentGuide.createdAt);
            guideContentDate.textContent = "Created At: " + (date.toLocaleDateString('en-GB', {day:'numeric', month:'long', year:'numeric'}) || 'N/A');
            
            pageListingName.textContent = currentGuide.name || 'N/A';



            //TODO: create foreach to process all sections.
            createSections(currentGuide.sections, guideContentContainer);

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

            // since everything is loaded, display the content
            if (guideContentContainer) guideContentContainer.style.display = 'block';

            // Fetch and display related products
            if (currentGuide.category) {
                fetchAndDisplayRelatedGuides(guideId, currentGuide.category);
            }

        } else {
            if (errorMessage) {
                errorMessage.textContent = "Product not found.";
                errorMessage.style.display = 'block';
            }
            showNotification("Product not found.", 'error');
        }

        getAllText();
    } catch (error) {
        console.error("Error fetching product details:", error);
        if (loadingMessage) loadingMessage.style.display = 'none';
        if (errorMessage) {
            errorMessage.textContent = `Error loading product details: ${error.message}. Please try again later.`;
            errorMessage.style.display = 'block';
        }
        showNotification(`Error loading product details: ${error.message}`, 'error');
    }
})

async function getAllText() {




    const mainSection = document.querySelector('main');

    const texts = mainSection.querySelectorAll('p, .heading, .sub-heading');

    /*texts.forEach(text => {
        const original = text.textContent;
        translateArticle(text.textContent, "en", "sw")
            .then(translated => {
                text.textContent = translated;
            })
            .catch(err => {
                console.error(err);

                text.textContent = original;
            });
    });*/



    const promises = texts.map(async (el) => {
        const original = el.textContent;

        const translated = await translateArticle(original, "en", "sw");

        el.textContent = translated;
    });

    await Promise.all(promises);
}

async function translateArticle(text, sourceLang, targetLang) {
  const response = await fetch("/api/translate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      text,
      source: sourceLang,
      target: targetLang
    })
  });

  const data = await response.json();
  return data.translatedText;
}

function createSections(sections, container) {
    if (!sections) return;

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

            container.appendChild(element);
        }

        if (paragraph && paragraph.length > 0) {
            const element = document.createElement('p');
            element.textContent = paragraph;

            container.appendChild(element);
        }

        if (list && list.length > 0) {
            const listContainer = document.createElement('ul');
            listContainer.classList.add('list-container');

            list.forEach(point => {
                const element = document.createElement('li');
                const elementText = document.createElement('p');

                elementText.textContent = point.bullet_point;

                element.appendChild(elementText);
                listContainer.appendChild(element);
            })

            container.appendChild(listContainer);
        }

        if (subSections && subSections.length > 0) {
            createSections(subSections, container);
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