import express from 'express';
import multer from 'multer';
import path from 'path';
import { createBlogPost, getAllBlogs, getBlogBySlug } from '../controllers/blog.controllers.js';

const router = express.Router();

// Multer Disk Storage Configuration (Saves inside backend/uploads)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Generates unique filename
    }
});

const upload = multer({ storage });

// API Endpoints mapped directly to controllers
router.post('/create', upload.single('coverImage'), createBlogPost);
router.get('/all', getAllBlogs);
router.get('/post/:slug', getBlogBySlug);

export default router;