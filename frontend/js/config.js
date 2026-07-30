// Backend URL configuration
const PRODUCTION_BACKEND_URL = "https://e-commerce-yf0t.onrender.com";
const DEFAULT_LOCAL_BACKEND_PORT = 5000;

function computeBaseUrl() {
    const { protocol, hostname } = window.location;

    // When opened as file:// treat as local frontend and point to localhost backend
    if (protocol === 'file:') {
        return `http://localhost:${DEFAULT_LOCAL_BACKEND_PORT}`;
    }

    // Common local development hosts
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
        return `${protocol}//${hostname}:${DEFAULT_LOCAL_BACKEND_PORT}`;
    }

    // Fallback to production backend for everything else
    return PRODUCTION_BACKEND_URL;
}

const BASE_URL = computeBaseUrl();

export function getImageUrl(imagePath, fallback = "./static/placeholder.png") {
    if (!imagePath || typeof imagePath !== 'string') return fallback;

    const trimmed = imagePath.trim();
    if (!trimmed) return fallback;

    // If already an absolute URL or data URI, return as-is
    if (/^https?:\/\//i.test(trimmed) || trimmed.startsWith('data:')) return trimmed;

    // Build an absolute URL using BASE_URL
    const base = String(BASE_URL).replace(/\/+$/, '');
    const normalized = trimmed.replace(/^\.?\//, '/');
    return `${base}${normalized.startsWith('/') ? normalized : '/' + normalized}`;
}

export const GOOGLE_SHEET_API_URL = "https://script.google.com/macros/s/AKfycbyyeLQYUdCrT8FxwDNLv-wVGF_YfC4aK4G4g4g2rRnWvtqeJeySVghAUFF1eN_atdnk/exec";

export default BASE_URL;