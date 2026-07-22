import BASE_URL from "./config.js";

// ===== Global State =====
let PRODUCTS_DATABASE = [];
let selectedCategories = [];
let maxPriceConstraint = 1500;
let ratingFloorFilter = 0;
let activeQuickTag = 'all';
let searchQuery = '';

let pendingCatalogProductId = null;
let pendingCatalogCartAction = null;

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
    loadProductsFromBackend();
    syncCartCounterIcon();
    setupMobileMenu();
    setupSearchListeners();
});

// ===== Fetch Backend Data =====
async function loadProductsFromBackend() {
    const gridContainer = document.getElementById('product-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = `<p class="text-ash text-center col-span-full py-10"><i class="fa-solid fa-spinner fa-spin text-2xl text-clay mb-2"></i><br>Loading products...</p>`;

    try {
        const response = await fetch(`${BASE_URL}/api/product/all`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Failed to fetch products");

        PRODUCTS_DATABASE = data.map(normalizeProduct);
        renderProductCatalog(PRODUCTS_DATABASE);
    } catch (err) {
        console.error("Product fetch failed:", err);
        gridContainer.innerHTML = `<p class="text-ash text-center col-span-full py-10">Could not load products. Please try again later.</p>`;
    }
}

function normalizeProduct(product) {
    const sizes = (product.variants && product.variants.length > 0)
        ? product.variants.map(v => ({
            ml: v.volume || "Standard",
            price: v.price || 0,
            mrp: v.comparePrice || v.price || 0
          }))
        : [{ ml: "Standard", price: product.price || 0, mrp: product.comparePrice || product.price || 0 }];

    let rawCategory = (product.category || "uncategorized").toLowerCase().trim();
    if (rawCategory === 'skincare') rawCategory = 'skin';
    if (rawCategory === 'bodycare') rawCategory = 'body';

    const imageSrc = product.imagepath 
        ? (product.imagepath.startsWith('http') ? product.imagepath : `${BASE_URL}${product.imagepath}`) 
        : '';

    return {
        id: product._id || product.id,
        name: product.name || 'Untitled Product',
        category: rawCategory, 
        isBestseller: !!product.isBestseller,
        rating: product.rating || 4,
        baseImg: imageSrc,
        description: product.description || 'No description available', 
        sizes
    };
}

// ===== Render Catalog =====
function renderProductCatalog(products) {
    const gridContainer = document.getElementById('product-grid');
    const noProductsPlaceholder = document.getElementById('no-products');

    if (!gridContainer) return;

    if (products.length === 0) {
        gridContainer.innerHTML = "";
        if (noProductsPlaceholder) noProductsPlaceholder.classList.remove('hidden');
        const countEl = document.getElementById('results-count');
        if (countEl) countEl.innerText = `0 Products Found`;
        return;
    }

    if (noProductsPlaceholder) noProductsPlaceholder.classList.add('hidden');
    const countEl = document.getElementById('results-count');
    if (countEl) countEl.innerText = `Showing ${products.length} products`;

    gridContainer.innerHTML = products.map(product => {
        const initialSize = product.sizes[0];
        const starsHTML = generateStarsHTML(product.rating);

        const sizeButtonsHTML = product.sizes.map((sz, idx) => {
            const isActive = idx === 0;
            const activeClasses = isActive 
                ? 'bg-ink text-parchment border-ink font-semibold' 
                : 'border-[#DCD3BA] text-ash hover:border-ink';

            return `
                <button 
                    type="button"
                    onclick="changeCardSize('${sz.ml}', ${sz.price}, ${sz.mrp || 0}, this)"
                    class="size-btn text-[11px] px-2.5 py-1 rounded-full border transition ${activeClasses}"
                >
                    ${sz.ml}
                </button>
            `;
        }).join('');

        return `
        <div data-product-id="${product.id}" class="relative w-full h-[470px] product-card bg-white rounded-2xl shadow-sm border border-[#ECE4CE] flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
            <span class="absolute top-3 left-3 z-10 text-[9px] font-bold tracking-wider w-9 h-9 ${product.isBestseller ? 'bg-orange-600' : 'bg-black'} uppercase text-white rounded-full flex items-center justify-center shadow-md">
                ${product.isBestseller ? 'Hot' : 'New'}
            </span>
          
            <div class="mx-4 mt-4 rounded-xl flex justify-center h-[170px] items-center overflow-hidden relative">
                <a href="./product.html?id=${product.id}" class="block w-full h-full p-2 flex items-center justify-center">
                    <img src="${product.baseImg}" alt="${product.name}" class="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-110">
                </a>
            </div>

            <div class="px-4 flex-1 flex flex-col justify-center gap-1.5">
                <h3 class="text-base font-robot font-medium text-ink text-center leading-snug capitalize line-clamp-1 product-name">${product.name}</h3>
                <p class="product-desc-text text-xs text-ash text-center font-robot px-2 line-clamp-2 min-h-[2rem]">
                    ${product.description}
                </p>

                <div class="flex items-center justify-center gap-3 mt-1 flex-wrap">
                    <div class="flex gap-1.5 items-center size-btn-container">
                        ${sizeButtonsHTML}
                    </div>
                    <div class="flex items-center gap-1.5 min-w-[80px] justify-center">
                        <span class="product-price font-serif font-semibold text-ink text-base">₹${initialSize.price}</span>
                        <span class="product-mrp font-serif text-xs line-through text-ash opacity-70">${initialSize.mrp ? '₹' + initialSize.mrp : ''}</span>
                    </div>
                </div>
            </div>

            <div class="px-4 mb-3">
                <p class="text-[10px] font-bold text-ash uppercase tracking-[0.2em] mb-1 text-center">Quantity</p>
                <div class="flex text-gold text-[11px] justify-center items-center gap-1 mb-2">
                    <span class="text-black text-xs font-medium">(${product.rating})</span>
                    <div class="flex text-[#D4AF37] gap-0.5">${starsHTML}</div>
                </div>

                <div class="flex items-center border border-[#DCD3BA] w-full rounded-lg overflow-hidden bg-white shadow-sm qty-container">
                    <button type="button" onclick="updateQty(-1, this)" class="w-11 h-8 bg-[#FAF7EE] text-ink hover:bg-[#F1EBD7] font-bold transition flex items-center justify-center select-none border-r border-[#DCD3BA]">−</button>
                    <input type="number" class="quantity flex-1 h-8 text-center font-semibold text-ink focus:outline-none text-sm min-w-0 bg-transparent" value="1" min="1" readonly>
                    <button type="button" onclick="updateQty(1, this)" class="w-11 h-8 bg-[#FAF7EE] text-ink hover:bg-[#F1EBD7] font-bold transition flex items-center justify-center select-none border-l border-[#DCD3BA]">+</button>
                </div>
            </div>

            <button type="button" onclick="handleCartButtonClick('${product.id}', this)" class="w-full bg-[#A0522D] hover:bg-[#8B4513] text-white py-3.5 font-semibold text-xs tracking-[0.15em] uppercase transition flex items-center justify-center gap-2 mt-auto">
                <i class="fa-solid fa-cart-shopping text-xs"></i> Add to Cart
            </button>
        </div>`;
    }).join('');
}

// ===== Rating Stars Helper =====
function generateStarsHTML(rating) {
    let html = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) {
            html += `<i class="fa-solid fa-star"></i>`;
        } else if (i - 0.5 <= rating) {
            html += `<i class="fa-solid fa-star-half-stroke"></i>`;
        } else {
            html += `<i class="fa-regular fa-star text-gray-300"></i>`;
        }
    }
    return html;
}

// ===== Size Switch =====
function changeCardSize(sizeLabel, exactPrice, exactMrp, element) {
    const currentCard = element.closest('.product-card');
    if (!currentCard) return;

    currentCard.querySelector('.product-price').innerText = `₹${exactPrice}`;
    const mrpEl = currentCard.querySelector('.product-mrp');
    if (mrpEl) mrpEl.innerText = exactMrp ? `₹${exactMrp}` : '';

    currentCard.querySelectorAll('.size-btn').forEach(btn => {
        btn.className = "size-btn text-[11px] px-2.5 py-1 rounded-full border border-[#DCD3BA] text-ash hover:border-ink transition";
    });

    element.className = "size-btn text-[11px] px-2.5 py-1 rounded-full border border-ink bg-ink text-parchment font-semibold transition";
}

// ===== Quantity Stepper =====
function updateQty(change, element) {
    const parentQtyWrapper = element.closest('.qty-container');
    const targetInput = parentQtyWrapper.querySelector('.quantity');

    let currentQty = parseInt(targetInput.value) || 1;
    currentQty += change;

    if (currentQty < 1) currentQty = 1;
    targetInput.value = currentQty;
}

// ===== Filters & Search Logic =====
function filterProducts() {
    const checkboxes = document.querySelectorAll('input[name="category"]:checked');
    selectedCategories = Array.from(checkboxes).map(cb => cb.value.toLowerCase().trim());

    const priceRangeInput = document.getElementById('price-range');
    if (priceRangeInput) maxPriceConstraint = parseInt(priceRangeInput.value);

    let results = PRODUCTS_DATABASE.filter(item => {
        if (searchQuery) {
            const matchesName = item.name.toLowerCase().includes(searchQuery);
            const matchesDesc = item.description.toLowerCase().includes(searchQuery);
            const matchesCategory = item.category.toLowerCase().includes(searchQuery);
            if (!matchesName && !matchesDesc && !matchesCategory) return false;
        }

        if (selectedCategories.length > 0 && !selectedCategories.includes(item.category)) {
            return false;
        }
        if (item.rating < ratingFloorFilter) return false;
        if (activeQuickTag === 'bestseller' && !item.isBestseller) return false;

        const basePrice = item.sizes[0].price;
        if (basePrice > maxPriceConstraint) return false;

        return true;
    });

    const sortFilter = document.getElementById('sort-filter');
    if (sortFilter) {
        const sortSelection = sortFilter.value;
        if (sortSelection === 'price-low-high') {
            results.sort((a, b) => a.sizes[0].price - b.sizes[0].price);
        } else if (sortSelection === 'price-high-low') {
            results.sort((a, b) => b.sizes[0].price - a.sizes[0].price);
        } else if (sortSelection === 'rating-high-low') {
            results.sort((a, b) => b.rating - a.rating);
        }
    }

    renderProductCatalog(results);
}

// 🔍 Search Listener Setup
// Replace your setupSearchListeners inside `moreproduct.js` with this:

function setupSearchListeners() {
    document.addEventListener('input', async (e) => {
        const input = e.target;
        if (!input || (input.id !== 'search-input' && !input.classList.contains('search-bar') && input.type !== 'search')) {
            return;
        }

        const query = input.value.toLowerCase().trim();
        searchQuery = query;

        // 1. Live-filter the products grid on moreproduct.html
        filterProducts();

        // 2. Fetch and show the suggestion dropdown (just like Blog.html & other pages)
        await fetchAndShowSuggestions(query);
    });
}

// Helper to render backend suggestions dropdown under the search bar
async function fetchAndShowSuggestions(query) {
    const searchContainer = document.getElementById('search-container');
    if (!searchContainer) return;

    // Look for or create the suggestions container div
    let suggestionsBox = document.getElementById('search-suggestions-box');
    if (!suggestionsBox) {
        suggestionsBox = document.createElement('div');
        suggestionsBox.id = 'search-suggestions-box';
        suggestionsBox.className = 'absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-xl shadow-2xl max-h-80 overflow-y-auto z-50 mt-1';
        searchContainer.appendChild(suggestionsBox);
    }

    if (!query) {
        suggestionsBox.innerHTML = '';
        suggestionsBox.classList.add('hidden');
        return;
    }

    try {
        // Fetch matching products from backend API
        const response = await fetch(`${BASE_URL}/api/product/all`);
        const data = await response.json();

        if (!response.ok) return;

        // Filter results matching search query
        const matches = data.filter(item => {
            const name = (item.name || '').toLowerCase();
            const cat = (item.category || '').toLowerCase();
            return name.includes(query) || cat.includes(query);
        });

        if (matches.length === 0) {
            suggestionsBox.innerHTML = `<div class="p-4 text-center text-sm text-gray-400">No matching products found</div>`;
            suggestionsBox.classList.remove('hidden');
            return;
        }

        // Render matching suggestion items with images and titles
        suggestionsBox.innerHTML = matches.map(prod => {
            const imgSrc = prod.imagepath 
                ? (prod.imagepath.startsWith('http') ? prod.imagepath : `${BASE_URL}${prod.imagepath}`) 
                : '';
            const price = prod.price || (prod.variants && prod.variants[0] ? prod.variants[0].price : 'N/A');

            return `
                <a href="./product.html?id=${prod._id || prod.id}" class="flex items-center gap-3 p-3 hover:bg-amber-50/50 transition border-b border-gray-100 last:border-none group">
                    <img src="${imgSrc}" alt="${prod.name}" class="w-10 h-10 object-contain rounded bg-white border p-1">
                    <div class="flex-1 min-w-0">
                        <p class="text-sm font-medium text-gray-800 truncate group-hover:text-amber-700">${prod.name}</p>
                        <p class="text-xs text-amber-800 font-semibold">₹${price}</p>
                    </div>
                    <i class="fa-solid fa-chevron-right text-xs text-gray-300 group-hover:text-amber-700"></i>
                </a>
            `;
        }).join('');

        suggestionsBox.classList.remove('hidden');
    } catch (err) {
        console.error("Error fetching suggestions:", err);
    }
}

function updatePriceLabel(value) {
    const label = document.getElementById('price-max-label');
    if (label) label.innerText = `₹${value}`;
}

function setRatingFilter(minStars) {
    ratingFloorFilter = minStars;
    filterProducts();
}

function applyQuickFilter(mode) {
    activeQuickTag = mode;
    const bestsellerBadge = document.getElementById('badge-bestseller');

    if (bestsellerBadge) {
        if (mode === 'bestseller') bestsellerBadge.classList.remove('hidden');
        else bestsellerBadge.classList.add('hidden');
    }
    filterProducts();
}

function resetFilters() {
    document.querySelectorAll('input[name="category"]').forEach(cb => cb.checked = false);
    const range = document.getElementById('price-range');
    if (range) range.value = 1500;
    const sort = document.getElementById('sort-filter');
    if (sort) sort.value = 'featured';
    
    updatePriceLabel(1500);
    ratingFloorFilter = 0;
    activeQuickTag = 'all';
    searchQuery = '';
    
    document.querySelectorAll('#search-input, .search-bar').forEach(input => input.value = '');

    const bestsellerBadge = document.getElementById('badge-bestseller');
    if (bestsellerBadge) bestsellerBadge.classList.add('hidden');

    filterProducts();
}

// ===== Cart Interceptor & Lead Flow =====
function handleCartButtonClick(productId, buttonElement) {
    const isLeadFilled = localStorage.getItem('leadFilled');

    if (isLeadFilled === 'true') {
        commitProductToCart(productId, buttonElement);
    } else {
        pendingCatalogProductId = productId;
        pendingCatalogCartAction = buttonElement;

        if (typeof window.openLeadModal === 'function') {
            window.openLeadModal(buttonElement);
        } else {
            const modal = document.getElementById('leadModal');
            if (modal) modal.classList.remove('hidden');
        }
    }
}

function commitProductToCart(productId, actionBtnElement) {
    const cardElement = actionBtnElement.closest('.product-card');
    if (!cardElement) return;

    const activeSelectedSizeBtn = cardElement.querySelector('.size-btn-container .bg-ink');
    const targetSizeText = activeSelectedSizeBtn ? activeSelectedSizeBtn.innerText.trim() : "Standard";

    const selectedRawPriceText = cardElement.querySelector('.product-price').innerText;
    const parsedPriceVal = parseInt(selectedRawPriceText.replace(/[^\d.]/g, '').trim()) || 0;

    const currentQtyVal = parseInt(cardElement.querySelector('.quantity').value) || 1;
    const targetNameText = cardElement.querySelector('.product-name').innerText;
    
    const descriptionElement = cardElement.querySelector('.product-desc-text');
    const targetDescText = descriptionElement ? descriptionElement.innerText.trim() : 'No description available';

    const imgElement = cardElement.querySelector('img');
    const targetImgSrc = imgElement ? imgElement.getAttribute('src') : '';

    let localCartArr = JSON.parse(localStorage.getItem('glowRitualCartData')) || [];

    const uniqueCartKey = `${productId}_${targetSizeText}`;
    let matchingItem = localCartArr.find(cartItem => cartItem.uniqueCartItemKeyId === uniqueCartKey);

    if (matchingItem) {
        matchingItem.qtyCountOrderMetric += currentQtyVal;
    } else {
        localCartArr.push({
            uniqueCartItemKeyId: uniqueCartKey,
            productId: productId,
            productName: targetNameText,
            productDescription: targetDescText,
            activeSelectedSizeConfig: targetSizeText,
            unitPriceItemConfig: parsedPriceVal,
            qtyCountOrderMetric: currentQtyVal,
            baseImg: targetImgSrc
        });
    }

    localStorage.setItem('glowRitualCartData', JSON.stringify(localCartArr));
    syncCartCounterIcon();

    if (typeof window.updateHeaderCartCount === 'function') {
        window.updateHeaderCartCount();
    }

    const backupText = actionBtnElement.innerHTML;
    actionBtnElement.innerHTML = `<i class="fa-solid fa-circle-check text-xs"></i> Item Added!`;
    actionBtnElement.classList.replace('bg-[#A0522D]', 'bg-green-600');

    setTimeout(() => {
        actionBtnElement.innerHTML = backupText;
        actionBtnElement.classList.replace('bg-green-600', 'bg-[#A0522D]');
        const inputQty = cardElement.querySelector('.quantity');
        if (inputQty) inputQty.value = 1;
    }, 1200);
}

function syncCartCounterIcon() {
    const countDisplay = document.getElementById('cart-count');
    if (!countDisplay) return;

    const cartCollection = JSON.parse(localStorage.getItem('glowRitualCartData')) || [];
    const netSum = cartCollection.reduce((total, item) => total + item.qtyCountOrderMetric, 0);

    countDisplay.innerText = netSum;
}

// ===== Robust Mobile Menu Helper =====
// ===== Robust Mobile Menu Helper for Tailwind Slide Drawer =====
function setupMobileMenu() {
    document.addEventListener("click", (e) => {
        // Handle Open / Close Button Clicks
        const menuBtn = e.target.closest("#menu-btn") || e.target.closest(".mobile-menu-toggle");
        const closeBtn = e.target.closest("#menu-close-btn");
        const mobileMenu = document.getElementById("mobile-menu");
        const mobileDrawer = document.getElementById("mobile-menu-drawer");

        if (!mobileMenu) return;

        // Open Menu Action
        if (menuBtn) {
            e.preventDefault();
            mobileMenu.classList.remove("hidden", "pointer-events-none", "opacity-0");
            if (mobileDrawer) {
                mobileDrawer.classList.remove("-translate-x-full");
            }
            return;
        }

        // Close Menu Action (Click on 'X' or Backdrop Overlay)
        if (closeBtn || e.target === mobileMenu) {
            e.preventDefault();
            if (mobileDrawer) {
                mobileDrawer.classList.add("-translate-x-full");
            }
            mobileMenu.classList.add("opacity-0");
            setTimeout(() => {
                mobileMenu.classList.add("hidden", "pointer-events-none");
            }, 300);
            return;
        }
    });
}

// ========================================================
// 🔍 SELF-CONTAINED SEARCH HANDLER FOR MOREPRODUCT.JS ONLY
// (Safe: Does not touch include.js or navbar.html)
// ========================================================

// 1. Toggle Search Overlay (Open / Close)
document.addEventListener('click', (e) => {
    // Check if clicked element is the search icon/button
    const openBtn = e.target.closest('#search-open-btn');
    if (openBtn) {
        e.preventDefault();
        const searchContainer = document.getElementById('search-container');
        if (searchContainer) {
            searchContainer.classList.remove('hidden');
            const input = document.getElementById('search-input');
            if (input) input.focus();
        }
        return;
    }

    // Check if clicked element is the search close button ('X')
    const closeBtn = e.target.closest('#search-close-btn');
    if (closeBtn) {
        e.preventDefault();
        const searchContainer = document.getElementById('search-container');
        if (searchContainer) {
            searchContainer.classList.add('hidden');
        }
        return;
    }
});

// 2. Real-time Product Filtering on Typing
document.addEventListener('input', (e) => {
    if (e.target && e.target.id === 'search-input') {
        searchQuery = e.target.value.toLowerCase().trim();
        filterProducts(); // Calls your existing filter function
    }
});

// Expose Global Window References
window.changeCardSize = changeCardSize;
window.updateQty = updateQty;
window.filterProducts = filterProducts;
window.updatePriceLabel = updatePriceLabel;
window.setRatingFilter = setRatingFilter;
window.applyQuickFilter = applyQuickFilter;
window.resetFilters = resetFilters;
window.commitProductToCart = commitProductToCart;
window.handleCartButtonClick = handleCartButtonClick;