// js/navbar-interactions.js

// 1. Apne config file se BASE_URL ko import karein
import BASE_URL from './config.js'; 

// Custom event ka wait karein jo aapke include.js ne dispatch kiya hai
document.addEventListener("partialsLoaded", () => {
    console.log("Navbar DOM mein aa gaya hai! Ab features bind karte hain...");
    
    initSearchFeature();
    initMobileMenu();
    updateCartAndAuthStatus(); 
});

// ==========================================
// 2. Search Box aur Backend API Integration
// ==========================================
function initSearchFeature() {
    const searchOpenBtn = document.getElementById('search-open-btn');
    const searchCloseBtn = document.getElementById('search-close-btn');
    const searchContainer = document.getElementById('search-container');
    const searchInput = document.getElementById('search-input');

    if (!searchContainer || !searchInput) return;

    let suggestionsBox = document.getElementById('search-suggestions');
    if (!suggestionsBox) {
        suggestionsBox = document.createElement('div');
        suggestionsBox.id = 'search-suggestions';
        searchContainer.appendChild(suggestionsBox);
    }

    // Styling to match app.js design pattern
    suggestionsBox.className = 'absolute left-0 right-0 top-full bg-white text-black shadow-2xl rounded-b hidden z-[9999] max-h-60 overflow-y-auto border border-gray-200 w-full';

    searchOpenBtn?.addEventListener('click', () => {
        searchContainer.classList.toggle('search-hidden');
        if (!searchContainer.classList.contains('search-hidden')) {
            searchInput.focus();
        }
    });

    searchCloseBtn?.addEventListener('click', () => {
        searchContainer.classList.add('search-hidden');
        suggestionsBox.classList.add('hidden');
        searchInput.value = '';
    });

    let debounceTimer;
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        clearTimeout(debounceTimer);

        if (query.length < 2) {
            suggestionsBox.classList.add('hidden');
            return;
        }

        debounceTimer = setTimeout(async () => {
            try {
                const response = await fetch(`${BASE_URL}/api/product/search?q=${encodeURIComponent(query)}`);
                const data = await response.json();

                if (data.success && data.products && data.products.length > 0) {
                    suggestionsBox.innerHTML = data.products.map(product => {
                        // Handle dynamic image fallback
                        const imageSrc = product.imagepath 
                            ? (product.imagepath.startsWith("http") ? product.imagepath : `${BASE_URL}${product.imagepath}`)
                            : './static/placeholder.png';

                        // Handle dynamic price key fallback
                        const finalPrice = product.price || product.discountprice || product.productPrice || 'N/A';

                        // 🔥 FIXED: Changed redirection target from product-details.html to product.html
                        return `
                            <div onclick="window.location.href='product.html?id=${product._id}'" class="flex items-center gap-3 p-3 hover:bg-stone-50 cursor-pointer border-b border-stone-100 last:border-b-0 transition text-left">
                                <img src="${imageSrc}" alt="${product.name || 'Product'}" class="w-10 h-10 object-contain rounded bg-stone-50 border border-stone-200" onerror="this.src='./static/placeholder.png'">
                                <div class="flex-1 min-w-0">
                                    <p class="text-xs font-semibold text-black truncate text-left">${product.name || product.title || ''}</p>
                                    <p class="text-[11px] text-[#A0522D] font-bold text-left">₹ ${finalPrice}</p>
                                </div>
                                <i class="fa-solid fa-chevron-right text-[10px] text-stone-400 pr-1"></i>
                            </div>
                        `;
                    }).join('');
                    suggestionsBox.classList.remove('hidden');
                } else {
                    suggestionsBox.innerHTML = `<p class="p-4 text-xs text-stone-500 text-center font-medium">Koi product nahi mila "<i>${query}</i>" ke liye</p>`;
                    suggestionsBox.classList.remove('hidden');
                }
            } catch (error) {
                console.error("Frontend Search error:", error);
            }
        }, 300);
    });

    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            suggestionsBox.classList.add('hidden');
        }
    });
}

// ==========================================
// 3. Mobile Hamburger Menu Toggle
// ==========================================
function initMobileMenu() {
    const menuBtn = document.getElementById('menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

// ==========================================
// 4. Cart Badge aur Login/Logout State Sync
// ==========================================
function updateCartAndAuthStatus() {
    const cartBadge = document.getElementById('global-cart-badge');
    const authActions = document.getElementById('auth-actions');

    const cartCount = localStorage.getItem('cartCount') || '0';
    const token = localStorage.getItem('token'); 

    if (cartBadge) cartBadge.innerText = cartCount;

    if (authActions && token) {
        authActions.innerHTML = `
            <a href="./profile.html" class="text-base text-black hover:text-gold transition">
                <i class="fa-solid fa-user-check text-green-700"></i>
            </a>
            <button id="logout-btn" class="text-xs font-semibold text-red-600 hover:underline uppercase ml-2">Logout</button>
        `;

        document.getElementById('logout-btn')?.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            alert("Logged out successfully");
            window.location.reload();
        });
    }
}