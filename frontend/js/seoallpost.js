import BASE_URL from './config.js';

// DOM Elements
const blogTableBody = document.getElementById('blog-table-body');

// 1. Fetch Blogs From Backend Server on Page Load
async function fetchAllBlogs() {
    try {
        const response = await fetch(`${BASE_URL}/api/blogs`); // Aapka GET route jahan se saare blogs aate hain
        const data = await response.json();

        // Check if data is array or handle accordingly
        const blogs = data.blogs || data; 

        if (!response.ok || !blogs || blogs.length === 0) {
            blogTableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-10 text-center text-gray-500">
                        <i class="fa-solid fa-folder-open text-2xl block mb-2 text-gray-400"></i> Koi blog nahi mila bhai! Pehle ek blog create kijiye.
                    </td>
                </tr>`;
            return;
        }

        // Render Tables row elements
        renderBlogTable(blogs);

    } catch (error) {
        console.error("Fetch error:", error);
        blogTableBody.innerHTML = `
            <tr>
                <td colspan="4" class="px-6 py-10 text-center text-red-500 font-medium">
                    <i class="fa-solid fa-circle-exclamation mr-2"></i> Backend server se blogs load karne mein dikkat aa rahi hai.
                </td>
            </tr>`;
    }
}

// 2. Render UI List Dynamic Function
function renderBlogTable(blogs) {
    blogTableBody.innerHTML = ''; // Loading text ko clear karne ke liye

    blogs.forEach(blog => {
        // Fallback for cover image if path is wrong
        const imageSrc = blog.coverImage ? (blog.coverImage.startsWith('http') ? blog.coverImage : `${BASE_URL}/${blog.coverImage}`) : 'https://placehold.co/600x400?text=No+Image';

        const tr = document.createElement('tr');
        tr.className = "hover:bg-gray-50/70 transition";
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <img src="${imageSrc}" class="w-16 h-10 object-cover rounded border border-gray-200 shadow-sm" alt="cover">
            </td>
            <td class="px-6 py-4">
                <div class="font-semibold text-gray-900 line-clamp-1">${blog.title}</div>
                <span class="inline-flex items-center px-2 py-0.5 mt-1 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                    ${blog.category || 'Uncategorized'}
                </span>
            </td>
            <td class="px-6 py-4 text-gray-500 font-mono text-xs">
                /blog/${blog.slug}
            </td>
            <td class="px-6 py-4 text-right whitespace-nowrap space-x-2">
                <!-- EDIT BUTTON -->
                <button data-id="${blog._id || blog.id}" class="edit-btn inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                    <i class="fa-solid fa-pen-to-square"></i> Edit
                </button>
                <!-- DELETE BUTTON -->
                <button data-id="${blog._id || blog.id}" class="delete-btn inline-flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition">
                    <i class="fa-solid fa-trash-can"></i> Delete
                </button>
            </td>
        `;
        blogTableBody.appendChild(tr);
    });

    // Attach event listeners to newly created buttons
    attachActionListeners();
}

// 3. Attach Listeners to Edit and Delete Buttons
function attachActionListeners() {
    // Handling Edit Button Kliks
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const blogId = btn.getAttribute('data-id');
            // Edit page par query parameter ke saath bhej denge taaki form auto-populate ho sake
            window.location.href = `./seoadmin.html?edit=${blogId}`;
        });
    });

    // Handling Delete Button Kliks
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const blogId = btn.getAttribute('data-id');
            
            if (confirm("⚠️ Bhai, kya aap pakka is blog ko delete karna chahte hain? Yeh wapas nahi aayega!")) {
                try {
                    btn.innerText = "Deleting...";
                    btn.disabled = true;

                    const response = await fetch(`${BASE_URL}/api/blogs/delete/${blogId}`, {
                        method: 'DELETE'
                    });

                    const resData = await response.json();

                    if (response.ok || resData.success) {
                        alert("🗑️ Blog successfully delete ho gaya.");
                        fetchAllBlogs(); // List refresh karne ke liye dobara run karenge
                    } else {
                        alert(`Error: ${resData.message || 'Delete karne me dikkat aayi.'}`);
                        btn.innerText = "Delete";
                        btn.disabled = false;
                    }

                } catch (error) {
                    console.error("Delete operation failed:", error);
                    alert("Server error! Delete nahi ho paaya.");
                    btn.innerText = "Delete";
                    btn.disabled = false;
                }
            }
        });
    });
}

// Document Load hote hi automatically trigger kar do fetch function
document.addEventListener('DOMContentLoaded', fetchAllBlogs);