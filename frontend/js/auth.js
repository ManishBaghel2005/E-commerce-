import BASE_URL from "./config.js";

// ==========================================
// 1. GLOBAL CUSTOM SUCCESS MODAL
// ==========================================
export function showSuccessModal(title, message, callback) {
    const existingModal = document.getElementById("custom-success-modal");
    if (existingModal) existingModal.remove();

    const modal = document.createElement("div");
    modal.id = "custom-success-modal";
    modal.className = "fixed inset-0 flex items-center justify-center z-[9999] bg-black/60 backdrop-blur-sm";
    modal.innerHTML = `
        <div class="bg-white rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl border border-gold/20 text-center">
            <div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
            </div>
            <h3 class="text-lg font-bold text-gray-900 mb-1">${title}</h3>
            <p class="text-gray-500 text-sm mb-6">${message}</p>
            <button id="modal-ok-btn" class="w-full bg-[#2A2A24] hover:bg-amber-800 text-white font-semibold py-2.5 rounded-xl transition shadow-md focus:outline-none">
                OK
            </button>
        </div>
    `;
    document.body.appendChild(modal);

    document.getElementById("modal-ok-btn").addEventListener("click", () => {
        modal.remove();
        if (callback) callback();
    });
}

// ==========================================
// 2. ROUTE & GUARD LOGIC (FIXED)
// ==========================================
function runAuthGuard() {
    const currentPath = window.location.pathname.toLowerCase();

    // Stored credentials
    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token") || localStorage.getItem("userToken");

    let user = null;
    let role = "";

    if (storedUser) {
        try {
            user = JSON.parse(storedUser);
            // Flexible Role Normalization
            role = user.role ? String(user.role).toLowerCase().trim() : "";
        } catch (e) {
            console.error("Invalid user JSON in localStorage", e);
        }
    }

    // A) PUBLIC PAGES CHECK
    const isPublicPage = currentPath.endsWith("login.html") || 
                         currentPath.endsWith("index.html") || 
                         currentPath === "/" || 
                         currentPath.endsWith("/");

    if (storedUser && user && isPublicPage) {
        if (role.includes("seo")) {
            window.location.replace("./seoadmin.html");
            return;
        } else if (role.includes("admin")) {
            window.location.replace("./admin.html");
            return;
        }
    }

    // B) SEO PAGES PROTECTION GUARD
    const isSeoPage = currentPath.includes("seoadmin") || 
                      currentPath.includes("seoallpost") || 
                      currentPath.includes("seoadminupdate");

    if (isSeoPage) {
        // Broad SEO role acceptance ("seoadmin", "seo", "admin")
        const isSeoUser = role.includes("seo") || role.includes("admin");

        if (!storedUser || !user || !isSeoUser) {
            console.warn("Unauthorized access to SEO page. Clearing session & Redirecting...");
            localStorage.clear();
            window.location.replace("./login.html");
            return;
        }

        // Welcome Name Render for SEO Panel
        const welcomeText = document.querySelector("main h2");
        if (welcomeText && user.name) {
            const currentText = welcomeText.innerText.toLowerCase();
            if (currentText.includes("hello") || currentText.includes("welcome")) {
                welcomeText.innerHTML = `Hello ${user.name.toUpperCase()}`;
            }
        }
    }

    // C) ADMIN PAGES PROTECTION GUARD
    const adminPagesList = [
        "admin.html",
        "addnewproduct.html",
        "adminleadshow.html",
        "adminproduct.html",
        "adminupdateproduct.html",
        "adminuserquery.html"
    ];

    const isAdminPage = adminPagesList.some(page => currentPath.includes(page));

    if (isAdminPage) {
        if (!storedUser || !user || !role.includes("admin")) {
            console.warn("Unauthorized access to Admin page. Clearing session & Redirecting...");
            localStorage.clear();
            window.location.replace("./login.html");
            return;
        }
    }
}

// Run auth guard ONLY when document is ready (Prevents double Execution clashes)
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runAuthGuard);
} else {
    runAuthGuard();
}


// ==========================================
// 3. LOGOUT LOGIC (Handles both SEO Sidebar & Main Navbar)
// ==========================================
async function handleLogout() {
    try {
        await fetch(`${BASE_URL}/api/auth/logout`, { 
            method: "POST",
            credentials: "include" 
        });
    } catch (err) {
        console.error("Logout API error:", err);
    }
    localStorage.clear();
    window.location.replace("./login.html");
}

document.addEventListener("click", (e) => {
    if (e.target && (
        e.target.id === "adminLogoutBtn" || 
        e.target.closest("#adminLogoutBtn") || 
        e.target.id === "logout-btn" || 
        e.target.closest("#logout-btn")
    )) {
        e.preventDefault();
        handleLogout();
    }
});

// ==========================================
// 4. LOGIN FORM SUBMISSION HANDLER
// ==========================================
function initLoginForm() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

    // Clone element to prevent multiple attached event listeners
    const newForm = loginForm.cloneNode(true);
    loginForm.parentNode.replaceChild(newForm, loginForm);

    newForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        e.stopPropagation();

        const emailEl = document.getElementById("email");
        const passwordEl = document.getElementById("password");
        if (!emailEl || !passwordEl) return;

        const email = emailEl.value.trim();
        const password = passwordEl.value;

        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include" 
            });

            const data = await response.json();

            if (response.ok && data.success !== false) {
                const userData = data.user || data.data || {};
                
                const displayName = userData.name || userData.username || (userData.email ? userData.email.split('@')[0] : "User");
                
                const userObjToStore = {
                    ...userData,
                    name: displayName
                };

                // Save to localStorage
                localStorage.setItem("user", JSON.stringify(userObjToStore)); 
                
                const authToken = data.token || data.userToken;
                if (authToken) {
                    localStorage.setItem("token", authToken);
                    localStorage.setItem("userToken", authToken);
                }

                // Role-based target URL determination
                const role = userData.role ? userData.role.toLowerCase().trim() : "user";
                
                let targetUrl = "./index.html"; 
                if (role === "admin") {
                    targetUrl = "./admin.html";
                } else if (role === "seoadmin") {
                    targetUrl = "./seoadmin.html";
                }

                showSuccessModal("Login Successful!", `Welcome back, ${displayName}!`, () => {
                    window.location.href = targetUrl;
                });
            } else {
                showSuccessModal("Login Failed", data.message || "Invalid Email or Password.", null);
            }
        } catch (error) {
            console.error("Login Error:", error);
            showSuccessModal("Error", "Server se contact nahi ho paa raha hai.", null);
        }
    });
}

if (document.readyState === "complete" || document.readyState === "interactive") {
    initLoginForm();
} else {
    document.addEventListener("DOMContentLoaded", initLoginForm);
}

// ==========================================
// 5. NAVBAR STATE RENDERING
// ==========================================
export function renderNavbarState() {
    const storedUser = localStorage.getItem("user");

    const updateUI = (authContainer) => {
        if (!storedUser) {
            authContainer.innerHTML = `
                <a href="./login.html" class="text-base text-black hover:text-gold transition">
                    <i class="fa-solid fa-user"></i>
                </a>
            `;
            return;
        }

        try {
            const user = JSON.parse(storedUser);
            const userName = user.name || user.username || (user.email ? user.email.split('@')[0] : "User");

            authContainer.innerHTML = `
                <div class="flex items-center gap-3 text-sm font-medium text-black normal-case">
                    <span class="whitespace-nowrap">Hi, <b class="text-[#2A2A24] font-bold uppercase">${userName}</b></span>
                    <button id="logout-btn" class="bg-black hover:bg-orange-600 text-white text-[10px] px-2.5 py-1.5 rounded-lg transition uppercase tracking-wider font-bold shadow-sm cursor-pointer">
                        Logout
                    </button>
                </div>
            `;
        } catch (err) {
            console.error("Error parsing user from localStorage:", err);
            localStorage.removeItem("user");
        }
    };

    const checkAndRender = () => {
        const authActions = document.getElementById("auth-actions");
        if (authActions) {
            updateUI(authActions);
            return true;
        }
        return false;
    };

    if (checkAndRender()) return;

    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        if (checkAndRender() || attempts > 30) {
            clearInterval(interval);
        }
    }, 100);
}

// Event Listeners for Navbar Rendering
document.addEventListener("partialsLoaded", renderNavbarState);
document.addEventListener("DOMContentLoaded", renderNavbarState);
window.addEventListener("load", renderNavbarState);
renderNavbarState();