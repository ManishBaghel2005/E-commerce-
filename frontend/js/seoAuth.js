import BASE_URL from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    const currentPath = window.location.pathname.toLowerCase();

    // ------------------------------------------
    // 1. DYNAMIC REDIRECTION LOGIC (Safe Delay ke saath)
    // ------------------------------------------
    // 50ms ka chota delay taaki login form submission ka data save hone ka time mile
    setTimeout(() => {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        if (storedUser && token) {
            try {
                const user = JSON.parse(storedUser);
                const role = user.role ? user.role.toLowerCase().trim() : "";

                // Agar user home page ya login page par hai aur role seoadmin hai, to dashboard bhejo
                if (role === "seoadmin" && (currentPath.endsWith("index.html") || currentPath.endsWith("login.html") || currentPath.endsWith("/"))) {
                    window.location.href = "./seoadmin.html";
                    return;
                }
            } catch (e) {
                console.error("Redirection error:", e);
            }
        }
    }, 50);

    // ------------------------------------------
    // 2. SEO GUARD (Sirf tabhi chalega jab actual SEO pages par ho)
    // ------------------------------------------
    if (currentPath.includes("seoadmin.html") || currentPath.includes("seoallpost.html")) {
        
        // Dashboard par check karne se pehle 100ms wait karenge taaki auth clashing na ho
        setTimeout(() => {
            const storedUser = localStorage.getItem("user");
            const token = localStorage.getItem("token");

            // Data missing hai to main login state (index.html) par bhejo
            if (!storedUser || !token) {
                localStorage.clear();
                window.location.href = "./index.html"; 
                return;
            }

            try {
                const user = JSON.parse(storedUser);
                const role = user.role ? user.role.toLowerCase().trim() : "";

                // Agar role na toh seoadmin hai aur na hi admin, to nikaal do
                if (role !== "seoadmin" && role !== "admin") {
                    localStorage.clear();
                    window.location.href = "./index.html"; 
                    return;
                }
                
                // Name Update logic for SEO dashboard
                const welcomeText = document.querySelector("main h2");
                if (welcomeText && user.name) {
                    welcomeText.innerHTML = `Hello ${user.name.toUpperCase()}`;
                }
            } catch (e) {
                localStorage.clear();
                window.location.href = "./index.html";
                return;
            }
        }, 100);
    }

    // ------------------------------------------
    // 3. SEO SIDEBAR LOGOUT LOGIC
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
                window.location.href = "./index.html";
            } catch (err) {
                console.error("SEO Logout failure:", err);
                localStorage.clear();
                window.location.href = "./index.html";
            }
        });
    }
});