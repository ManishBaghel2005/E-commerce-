import Blog from '../models/blog.models.js';

// 1. Create and Publish Blog Post
export const createBlogPost = async (req, res) => {
    try {
        const { title, slug, content, metaTitle, category, metaDesc, coverUrl } = req.body;

        if (!title || !slug || !content || !category) {
            return res.status(400).json({ success: false, message: "Required fields are missing." });
        }

        // Check unique slug duplication
        const existingBlog = await Blog.findOne({ slug });
        if (existingBlog) {
            return res.status(400).json({ success: false, message: "A post with this slug already exists." });
        }

        // Image prioritization check (Uploaded file wins over text URL)
        let finalCover = coverUrl || "";
        if (req.file) {
            finalCover = `/uploads/${req.file.filename}`;
        }

        const newBlog = new Blog({
            title,
            slug: slug.toLowerCase().trim().replace(/ /g, '-'),
            content,
            metaTitle,
            category,
            metaDesc,
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