import Blog from '../models/blog.models.js';

// 1. Create and Publish Blog Post
export const createBlogPost = async (req, res) => {
    try {
        // 🔴 Debug karne ke liye sabse pehle console.log lagayein
        console.log("=== RECEIVED BODY ===", req.body);

        const { title, slug, content, metaTitle, keywords, category, metaDesc, schema, publisher, coverUrl } = req.body;

        if (!title || !slug || !content || !category) {
            return res.status(400).json({ success: false, message: "Required fields are missing." });
        }

        // 💡 Slug formatting ko unique check se PEHLE laayein
        const formattedSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '-').replace(/-+/g, '-');

        // Check unique slug duplication using formatted slug
        const existingBlog = await Blog.findOne({ slug: formattedSlug });
        if (existingBlog) {
            return res.status(400).json({ success: false, message: "A post with this slug already exists." });
        }

        let finalCover = coverUrl || "";
        if (req.file) {
            finalCover = `/uploads/${req.file.filename}`;
        }

        const newBlog = new Blog({
            title,
            slug: formattedSlug, // formatted slug saved
            content,
            metaTitle,
            keywords,     
            category,
            metaDesc,
            schema,       
            publisher,    
            coverImage: finalCover
        });

        await newBlog.save();
        return res.status(201).json({ success: true, message: "Blog published successfully!", data: newBlog });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Fetch All Blog Cards
export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        return res.status(200).json({ success: true, data: blogs });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Fetch Single Deep Article Content via Slug URL
export const getBlogBySlug = async (req, res) => {
    try {
        const blog = await Blog.findOne({ slug: req.params.slug });
        if (!blog) return res.status(404).json({ success: false, message: "Article not found." });
        return res.status(200).json({ success: true, data: blog });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};