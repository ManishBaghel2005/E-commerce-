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
// 2. LOGOUT LOGIC (Both Main Site & Admin Sidebar)
// ==========================================
// Ek common function jo har tarah ke logout button par kaam karega
async function handleLogout() {
    try {
        await fetch(`${BASE_URL}/api/auth/logout`, { 
            method: "POST",
            credentials: "include" 
        });
        localStorage.clear();
        window.location.href = "./login.html";
    } catch (err) {
        console.error("Logout error:", err);
        localStorage.clear();
        window.location.href = "./login.html";
    }
}

// Pure document par listener laga diya taaki kisi bhi page par koi bhi logout button ho, wo kaam kare
document.addEventListener("click", (e) => {
    // 1. Agar admin sidebar ka logout button click hua ho
    if (e.target && (e.target.id === "adminLogoutBtn" || e.target.closest("#adminLogoutBtn"))) {
        e.preventDefault();
        handleLogout();
    }
    // 2. Agar website ke main navbar ka logout button click hua ho
    if (e.target && (e.target.id === "logout-btn" || e.target.closest("#logout-btn"))) {
        e.preventDefault();
        handleLogout();
    }
});

// ==========================================
// 3. LOGIN FORM SUBMISSION INTERCEPTOR
// ==========================================
document.addEventListener("submit", async (e) => {
    if (e.target && e.target.id === "loginForm") {
        e.preventDefault(); // Browser refresh permanently block
        
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
                // Pehle localStorage me data set karenge
                localStorage.setItem("user", JSON.stringify(data.user)); 
                if (data.token) localStorage.setItem("token", data.token);

                // Role ke mutabik target url select karenge
                let targetUrl = "./index.html"; 
                if (data.user && data.user.role === "admin") {
                    targetUrl = "./admin.html";
                } else if (data.user && data.user.role === "seoadmin") {
                    targetUrl = "./seoadmin.html";
                }

                showSuccessModal("Login Successful!", `Welcome back!`, () => {
                    window.location.href = targetUrl;
                });
            } else {
                showSuccessModal("Login Failed", data.message || "Invalid credentials.", null);
            }
        } catch (error) {
            console.error("Login Error:", error);
            showSuccessModal("Error", "Server se contact nahi ho paa raha hai.", null);
        }
    }
});

// ==========================================
// 4. NAVBAR STATE RENDERING (For main index.html)
// ==========================================
export function renderNavbarState() {
    const authActions = document.getElementById("auth-actions");
    if (!authActions) return; 

    const storedUser = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (storedUser && token) {
        try {
            const user = JSON.parse(storedUser);
            authActions.innerHTML = `
                <div class="flex items-center gap-3 text-sm font-medium text-black normal-case">
                    <span>Hi, <b class="text-[#2A2A24] font-bold uppercase">${user.name || "User"}</b></span>
                    <button id="logout-btn" class="bg-black hover:bg-orange-600 text-white text-[10px] px-2.5 py-1.5 rounded-lg transition uppercase tracking-wider font-bold shadow-sm">
                        Logout
                    </button>
                </div>
            `;
        } catch (err) {
            localStorage.clear();
        }
    } else {
        authActions.innerHTML = `
            <a href="./login.html" class="text-base text-black hover:text-gold transition">
                <i class="fa-solid fa-user"></i>
            </a>
        `;
    }
}

document.addEventListener("partialsLoaded", renderNavbarState);
if (document.readyState === "complete" || document.readyState === "interactive") {
    renderNavbarState();
} else {
    document.addEventListener("DOMContentLoaded", renderNavbarState);
}