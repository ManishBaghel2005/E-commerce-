const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// Render backend URL — yahi actual API server hai
const PRODUCTION_BACKEND_URL = "https://e-commerce-gzl3.vercel.app";

const BASE_URL = isLocal
    ? "http://localhost:5000"
    : PRODUCTION_BACKEND_URL;

export function getImageUrl(imagePath, fallback = "./static/placeholder.png") {
    if (!imagePath || typeof imagePath !== "string") return fallback;

    const trimmedPath = imagePath.trim();
    if (!trimmedPath) return fallback;

    if (/^https?:\/\//i.test(trimmedPath) || trimmedPath.startsWith("data:")) {
        return trimmedPath;
    }

    const normalizedPath = trimmedPath.replace(/^\.?\//, "/");
    return `${BASE_URL}${normalizedPath.startsWith("/") ? normalizedPath : `/${normalizedPath}`}`;
}

export const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyyeLQYUdCrT8FxwDNLv-wVGF_YfC4aK4G4g4g2rRnWvtqeJeySVghAUFF1eN_atdnk/exec";

export default BASE_URL;