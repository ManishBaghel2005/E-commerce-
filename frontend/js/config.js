const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const BASE_URL = isLocal 
    ? "http://localhost:5000" 
    : "https://e-commerce-yf0t.onrender.com"; 

export default BASE_URL;



