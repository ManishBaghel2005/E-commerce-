(function () {
    // 1. Iframe protection ko active rakhein
    if (window.self !== window.top) return; 

    const currentPath = window.location.pathname.toLowerCase();

    // 2. Agar user login, register ya main home page par hai, to SEO guard ko block kar do
    if (
        currentPath.includes("login.html") || 
        currentPath.includes("register.html") || 
        currentPath.endsWith("/") || 
        currentPath.endsWith("index.html")
    ) {
        return; // Chupchaap execute hone se rok do
    }

    // 3. Ye guard ab sirf tabhi chalega jab user /seoadmin.html ya /seoallpost.html par hoga
    if (currentPath.includes("seo") || currentPath.includes("admin")) {
        const storedUser = localStorage.getItem("user");
        const token = localStorage.getItem("token");

        // Data missing hai to login par bhejo
        if (!storedUser || !token) {
            localStorage.clear();
            window.location.replace("./login.html");
            return;
        }

        try {
            const user = JSON.parse(storedUser);
            const role = user.role ? user.role.toLowerCase().trim() : "";

            // Agar main admin galti se yahan aaya hai, to use main admin page par bhejenge, login par nahi
            if (role === "admin" && currentPath.includes("seoadmin")) {
                window.location.replace("./admin.html");
                return;
            }

            // Agar user logged in hai par uska role seoadmin nahi hai (aur na hi main admin hai)
            if (role !== "seoadmin" && role !== "admin") {
                localStorage.clear();
                window.location.replace("./login.html");
                return;
            }

            // Agar role bilkul sahi hai (seoadmin), to DOM load hone par Hello Manish print karo
            document.addEventListener("DOMContentLoaded", () => {
                const welcomeText = document.querySelector("main h2");
                if (welcomeText && user.name) {
                    welcomeText.innerHTML = `Hello ${user.name}`;
                }
            });

        } catch (e) {
            localStorage.clear();
            window.location.replace("./login.html");
        }
    }
})();