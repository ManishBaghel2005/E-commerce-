import BASE_URL from "./config.js";

// =========================================================
// 1. ADMIN LOGOUT FUNCTIONALITY (Aapki HTML id ke mutabik)
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    const adminLogoutBtn = document.getElementById("adminLogoutBtn");
    
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", async () => {
            try {
                // Backend cookie ko delete karne ki request bhejega
                await fetch(`${BASE_URL}/api/auth/logout`, { 
                    method: "POST",
                    credentials: "include" 
                });
                
                // LocalStorage clear karenge
                localStorage.clear();
                
                // Redirect to Login/Home page
                window.location.href = "./login.html";
            } catch (err) {
                console.error("Admin Logout error:", err);
                localStorage.clear();
                window.location.href = "./login.html";
            }
        });
    }

    // =========================================================
    // 2. FRONTEND ROUTE GUARD (Double Layer Security)
    // =========================================================
    // Agar koi localstorage se user data cheat karne ki koshish kare
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
        localStorage.clear();
        window.location.href = "./login.html";
    }
});