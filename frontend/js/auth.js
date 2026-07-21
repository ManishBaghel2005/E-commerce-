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
// 2. LOGOUT LOGIC
// ==========================================
async function handleLogout() {
    try {
        await fetch(`${BASE_URL}/api/auth/logout`, { 
            method: "POST",
            credentials: "include" 
        });
    } catch (err) {
        console.error("Logout error:", err);
    }
    localStorage.clear();
    window.location.reload(); // Refresh page to reset navbar state
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
// 3. LOGIN FORM SUBMISSION
// ==========================================
function initLoginForm() {
    const loginForm = document.getElementById("loginForm");
    if (!loginForm) return;

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

            if (response.ok) {
                const userData = data.user || {};
                
                // Extract user name properly
                const displayName = userData.name || userData.username || (userData.email ? userData.email.split('@')[0] : "User");
                
                const userObjToStore = {
                    ...userData,
                    name: displayName
                };

                localStorage.setItem("user", JSON.stringify(userObjToStore)); 
                if (data.token) {
                    localStorage.setItem("token", data.token);
                    localStorage.setItem("userToken", data.token);
                }

                let targetUrl = "./index.html"; 
                if (userData.role === "admin") {
                    targetUrl = "./admin.html";
                } else if (userData.role === "seoadmin") {
                    targetUrl = "./seoadmin.html";
                }

                showSuccessModal("Login Successful!", `Welcome back, ${displayName}!`, () => {
                    window.location.href = targetUrl;
                });
            } else {
                showSuccessModal("Login Failed", data.message || "Invalid credentials.", null);
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
// 4. NAVBAR STATE RENDERING (ROBUST DOM CHECK)
// ==========================================
export function renderNavbarState() {
    const storedUser = localStorage.getItem("user");

    // Helper function to render UI
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

    // Retry Mechanism: Agar component late load ho raha hai to wait karega
    const checkAndRender = () => {
        const authActions = document.getElementById("auth-actions");
        if (authActions) {
            updateUI(authActions);
            return true;
        }
        return false;
    };

    // Immediate check
    if (checkAndRender()) return;

    // Retry every 100ms until DOM renders (Max 3 seconds)
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        if (checkAndRender() || attempts > 30) {
            clearInterval(interval);
        }
    }, 100);
}

// Event Listeners for safe multi-script integration
document.addEventListener("partialsLoaded", renderNavbarState);
document.addEventListener("DOMContentLoaded", renderNavbarState);
window.addEventListener("load", renderNavbarState);
renderNavbarState();



