const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const isNetlify = window.location.hostname.includes("netlify.app");

// Production backend host must be separate from the Netlify frontend host.
// If the frontend is deployed on Netlify, point API calls to the backend domain.
const PRODUCTION_BACKEND_URL = "https://www.aloraradiance.com";

const BASE_URL = isLocal
    ? "http://localhost:5000"
    : isNetlify
        ? PRODUCTION_BACKEND_URL
        : window.location.origin;

export default BASE_URL;



