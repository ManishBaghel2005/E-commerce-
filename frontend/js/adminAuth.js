import BASE_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    // Current page ka naam check karenge
    const isLoginPage = window.location.pathname.includes("login.html");

    // ------------------------------------------
    // 1. FRONTEND GUARD (Only runs on actual Admin/Product pages)
    // ------------------------------------------
    if (!isLoginPage) {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (!storedUser || !token) {
            localStorage.clear();
            window.location.href = "./login.html";
            return;
        }

        try {
            const user = JSON.parse(storedUser);
            if (user.role !== "admin") {
                localStorage.clear();
                window.location.href = "./login.html";
                return;
            }
            
            // Welcome text update
            const welcomeText = document.querySelector("main h2");
            if (welcomeText && user.name) {
                welcomeText.innerHTML = `Hello ${user.name.toUpperCase()}`;
            }
        } catch (e) {
            localStorage.clear();
            window.location.href = "./login.html";
            return;
        }
    }

    // ------------------------------------------
    // 2. ADMIN SIDEBAR LOGOUT LOGIC
    // ------------------------------------------
    const adminLogoutBtn = document.getElementById("adminLogoutBtn");
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", async (e) => {
            e.preventDefault();
            try {
                await fetch(`${BASE_URL}/api/auth/logout`, { 
                    method: "POST",
                    credentials: "include" 
                });
                localStorage.clear();
                window.location.href = "./login.html";
            } catch (err) {
                console.error("Admin Logout failure:", err);
                localStorage.clear();
                window.location.href = "./login.html";
            }
        });
    }
});