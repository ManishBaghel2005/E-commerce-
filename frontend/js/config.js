const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

// Render backend URL — yahi actual API server hai
const PRODUCTION_BACKEND_URL = "https://e-commerce-yf0t.onrender.com";

const BASE_URL = isLocal
    ? "http://localhost:5000"
    : PRODUCTION_BACKEND_URL;

export default BASE_URL;