import BASE_URL from './config.js'; // Make sure config.js provides your API domain URL

// 1. Initialize Quill Editor
const quill = new Quill('#editor-container', {
    modules: {
        toolbar: [
            [{ 'header': [1, 2, 3, false] }],
            ['bold', 'italic', 'underline', 'strike'],        
            [{ 'color': [] }, { 'background': [] }],          
            [{ 'align': [] }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['blockquote', 'link', 'image'],                  
            ['clean']                                         
        ]
    },
    placeholder: 'Write your beautiful blog post here...',
    theme: 'snow'
});

// 2. Event Listener for Live Image Preview
const coverUpload = document.getElementById('cover-upload');
const coverPreview = document.getElementById('cover-preview');
const uploadPlaceholder = document.getElementById('upload-placeholder');

coverUpload.addEventListener('change', function(event) {
    const input = event.target;
    
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            coverPreview.src = e.target.result;
            coverPreview.classList.remove('hidden');       // Preview image dikhao
            uploadPlaceholder.classList.add('hidden');    // Icon/text chupaao
        }
        
        reader.readAsDataURL(input.files[0]);
    }
});

// 3. Handle Form Submit and API Request
const blogForm = document.getElementById('blog-form');
const submitBtn = document.getElementById('submit-btn');

blogForm.addEventListener('submit', async function(event) {
    event.preventDefault(); // Default submission reload rokne ke liye

    // Input values collect karna
    const title = document.getElementById('title').value.trim();
    const slug = document.getElementById('slug').value.trim();
    const metaTitle = document.getElementById('metaTitle').value.trim();
    const category = document.getElementById('category').value.trim();
    const metaDesc = document.getElementById('metaDesc').value.trim();
    const coverUrl = document.getElementById('cover-url').value.trim();
    
    // Quill Rich text editor se direct HTML string nikalna
    const content = quill.root.innerHTML; 
    const coverFile = coverUpload.files[0];

    // Form validation checks
    if (!title || !slug || quill.getText().trim().length === 0) {
        alert("Bhai! Title, Slug aur Blog Content fill karna mandatory hai.");
        return;
    }

    // Backend payload design using FormData (Kyunki hum image file upload kar rahe hain)
    const formData = new FormData();
    formData.append('title', title);
    formData.append('slug', slug);
    formData.append('content', content);
    formData.append('metaTitle', metaTitle);
    formData.append('category', category);
    formData.append('metaDesc', metaDesc);

    // Agar image select kari hai toh file bhejo, warna URL fallback karo
    if (coverFile) {
        formData.append('coverImage', coverFile);
    } else if (coverUrl) {
        formData.append('coverImageUrl', coverUrl);
    }

    try {
        // UI handling: Button processing state
        submitBtn.innerText = "Publishing...";
        submitBtn.disabled = true;

        // Fetch command mapping to your backend server architecture
        const response = await fetch(`${BASE_URL}/api/blogs/create`, {
            method: 'POST',
            body: formData 
            // Note: browser multi-part header khud inject karega, custom content-type handle mat karna.
        });

        const data = await response.json();

        if (response.ok || data.success) {
            alert("🎉 Gajab! Aapka blog successfully backend pe publish ho gaya.");
            window.location.href = "./seoallpost.html"; // All posts module page par redirect karega
        } else {
            alert(`Error: ${data.message || 'Kuch galat hua post save karte waqt.'}`);
        }

    } catch (error) {
        console.error("API Integration Failure:", error);
        alert("Server network disconnect ya backend crash hua hai. Dubara check karein!");
    } finally {
        // Resetting default button state
        submitBtn.innerText = "Publish Post";
        submitBtn.disabled = false;
    }
});