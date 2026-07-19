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
// 2. ROBUST NAVBAR RENDERING FUNCTION
// ==========================================
export function renderNavbarState() {
    const authActions = document.getElementById("auth-actions");
    const storedUser = localStorage.getItem("user");

    if (!authActions) return;

    if (storedUser && storedUser !== "undefined") {
        try {
            const user = JSON.parse(storedUser);
            const displayName = user.name || "User";

            authActions.innerHTML = `
                <div class="flex items-center gap-3 text-sm font-medium text-black normal-case">
                    <span>Hi, <b class="text-[#2A2A24] font-bold uppercase">${displayName}</b></span>
                    <button id="logout-btn" class="bg-black hover:bg-orange-600 text-white text-[10px] px-2.5 py-1.5 rounded-lg transition uppercase tracking-wider font-bold shadow-sm">
                        Logout
                    </button>
                </div>
            `;

            document.getElementById("logout-btn").addEventListener("click", () => {
                localStorage.clear();
                window.location.href = "./index.html";
            });

        } catch (err) {
            console.error("LocalStorage Parse Error:", err);
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

// ==========================================
// 3. LIFECYCLE MANAGEMENT (Navbar Mount Watch)
// ==========================================
document.addEventListener("partialsLoaded", renderNavbarState);
if (document.readyState === "complete" || document.readyState === "interactive") {
    renderNavbarState();
} else {
    document.addEventListener("DOMContentLoaded", renderNavbarState);
}

const safetyInterval = setInterval(() => {
    if (document.getElementById("auth-actions")) {
        renderNavbarState();
        clearInterval(safetyInterval);
    }
}, 100);
setTimeout(() => clearInterval(safetyInterval), 5000);

// ==========================================
// 4. LOGIN FORM SUBMISSION INTERCEPTOR
// ==========================================
const myLoginForm = document.getElementById("loginForm");
if (myLoginForm) {
    myLoginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${BASE_URL}/api/auth/login`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
                credentials: "include" 
            });

            const data = await response.json();

            if (response.ok) {
                // FIXED: Direct storage stringify validation
                localStorage.setItem("user", JSON.stringify(data.user)); 
                if (data.token) localStorage.setItem("token", data.token);

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
    });
}

// ==========================================
// 5. REGISTER FORM SUBMISSION INTERCEPTOR
// ==========================================
const myRegisterForm = document.getElementById("registerForm");
if (myRegisterForm) {
    myRegisterForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const name = document.getElementById("name").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const phone = document.getElementById("phone").value.trim();

        try {
            const response = await fetch(`${BASE_URL}/api/auth/register`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password, phone })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccessModal("Registration Successful!", "Aapka account ban gaya hai. Ab aap login kar sakte hain.", () => {
                    window.location.href = "./login.html";
                });
            } else {
                showSuccessModal("Registration Failed", data.message || "Valid details enter karein.", null);
            }
        } catch (error) {
            console.error("Register Error:", error);
            showSuccessModal("Error", "Server se contact nahi ho paa raha hai.", null);
        }
    });
}

// ==========================================
// 6. FORGOT PASSWORD & VIEW TOGGLE LOGIC (🚀 NEW)
// ==========================================
const showForgotBtn = document.getElementById("showForgotBtn");
const backToLoginBtn = document.getElementById("backToLoginBtn");
const loginSection = document.getElementById("loginSection");
const forgotSection = document.getElementById("forgotSection");

if (showForgotBtn && backToLoginBtn && loginSection && forgotSection) {
    showForgotBtn.addEventListener("click", () => {
        loginSection.classList.add("hidden");
        forgotSection.classList.remove("hidden");
    });
    backToLoginBtn.addEventListener("click", () => {
        forgotSection.classList.add("hidden");
        loginSection.classList.remove("hidden");
    });
}

const myForgotForm = document.getElementById("forgotForm");
if (myForgotForm) {
    myForgotForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = document.getElementById("forgotEmail").value.trim();

        try {
            const response = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            });
            const data = await response.json();

            if (response.ok) {
                showSuccessModal("Email Sent!", "Password reset link aapke email par bhej diya gaya hai.", () => {
                    forgotSection.classList.add("hidden");
                    loginSection.classList.remove("hidden");
                });
            } else {
                showSuccessModal("Failed", data.message || "Email send nahi ho saka.", null);
            }
        } catch (error) {
            console.error("Forgot Error:", error);
            showSuccessModal("Error", "Server connectivity error.", null);
        }
    });
}

// ==========================================
// 7. RESET PASSWORD INTERCEPTOR
// ==========================================
const myResetForm = document.getElementById("resetForm");
if (myResetForm) {
    myResetForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const password = document.getElementById("password").value;

        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");

        if (!token) {
            showSuccessModal("Error", "Invalid ya expired reset token link hai.", null);
            return;
        }

        try {
            const response = await fetch(`${BASE_URL}/api/auth/reset-password/${token}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok) {
                showSuccessModal("Password Updated!", "Aapka password badal gaya hai. Naye password se login karein.", () => {
                    window.location.href = "./login.html";
                });
            } else {
                showSuccessModal("Reset Failed", data.message || "Password change nahi ho saka.", null);
            }
        } catch (error) {
            console.error("Reset Password Error:", error);
            showSuccessModal("Error", "Server respond nahi kar raha hai.", null);
        }
    });
}