import BASE_URL from './config.js';

async function fetchFullBlogDetail() {
    const titleEl = document.getElementById('post-title');
    const dateEl = document.getElementById('post-date');
    const categoryEl = document.getElementById('post-category');
    const coverEl = document.getElementById('post-cover');
    const bodyEl = document.getElementById('post-body');
    const loaderEl = document.getElementById('post-loader');
    const contentArea = document.getElementById('blog-content-area');

    // 1. URL search params se query slug extract karein
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');

    if (!slug) {
        if (loaderEl) loaderEl.innerHTML = "<p class='text-clay font-bold'>Error: Invalid article link.</p>";
        return;
    }

    try {
        // 2. Target specific single entry endpoint from backend
        const response = await fetch(`${BASE_URL}/api/blogs/post/${slug}`);
        const result = await response.json();

        if (result.success && result.data) {
            const post = result.data;

            // Date Formatting style adjustment
            const formattedDate = new Date(post.createdAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });

            // 3. Absolute image target configurations
            const absoluteCoverImage = post.coverImage.startsWith('http') 
                ? post.coverImage 
                : `${BASE_URL}${post.coverImage}`;

            // 4. Update elements fields nodes values
            titleEl.innerText = post.title;
            dateEl.innerText = formattedDate;
            categoryEl.innerText = post.category || "General";
            coverEl.src = absoluteCoverImage;
            coverEl.alt = post.title;

            // ⚠️ CRITICAL: Editor dynamic content (HTML strings aur images inside content) inject karne ke liye innerHTML use karein
            bodyEl.innerHTML = post.content;

            // View configurations display block shifts toggle
            if (loaderEl) loaderEl.classList.add('hidden');
            if (contentArea) contentArea.classList.remove('hidden');
        } else {
            if (loaderEl) loaderEl.innerHTML = "<p class='text-clay font-bold'>Article not found.</p>";
        }
    } catch (err) {
        console.error("Failed fetching item fields:", err);
        if (loaderEl) loaderEl.innerHTML = "<p class='text-clay font-bold'>Error connecting to server resource.</p>";
    }
}

document.addEventListener('DOMContentLoaded', fetchFullBlogDetail);