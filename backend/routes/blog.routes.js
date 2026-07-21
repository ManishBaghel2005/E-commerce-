import express from 'express';
import multer from 'multer';
import path from 'path';
import { 
    createBlogPost, 
    getAllBlogs, 
    getBlogBySlug, 
    updateBlogPost, 
    deleteBlogPost 
} from '../controllers/blog.controllers.js';

const router = express.Router();

// Multer Disk Storage Configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Generates unique filename
    }
});

const upload = multer({ storage });

// ==========================================
// API Endpoints
// ==========================================

// 1. Create Blog
router.post('/create', upload.single('coverImage'), createBlogPost);

// 2. Get All Blogs (Frontend requests /api/blogs OR /api/blogs/all)
router.get('/', getAllBlogs);
router.get('/all', getAllBlogs);

// 3. Get Single Blog by Slug or ID
router.get('/:slug', getBlogBySlug);
router.get('/post/:slug', getBlogBySlug);

// 4. Update / Edit Blog
router.put('/:id', upload.single('coverImage'), updateBlogPost);
router.put('/update/:id', upload.single('coverImage'), updateBlogPost);

// 5. Delete Blog
router.delete('/:id', deleteBlogPost);
router.delete('/delete/:id', deleteBlogPost);

export default router;