const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const BASE_URL = isLocal 
    ? "http://localhost:5000" 
    : "https://your-backend-live-url.onrender.com/api/auth"; 

export default BASE_URL;



