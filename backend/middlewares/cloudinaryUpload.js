import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';
import dotenv from 'dotenv';
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ecommerce', // All images will go into this folder in Cloudinary
    allowedFormats: ['jpeg', 'png', 'jpg', 'webp'],
  },
});

const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // 5 MB Limit
    }
});

export const deleteFromCloudinary = async (imageUrl) => {
    try {
        if (!imageUrl || typeof imageUrl !== 'string' || !imageUrl.includes('cloudinary.com')) return;
        
        // Extract public_id from URL
        // Example: https://res.cloudinary.com/.../image/upload/v1234567890/ecommerce/abcde12345.png
        const parts = imageUrl.split('/upload/');
        if (parts.length === 2) {
            let pathWithoutVersion = parts[1].replace(/^v\d+\//, ''); // Remove version part
            const publicId = pathWithoutVersion.split('.')[0]; // Remove extension
            
            await cloudinary.uploader.destroy(publicId);
            console.log(`Deleted image from Cloudinary: ${publicId}`);
        }
    } catch (err) {
        console.error("Cloudinary Deletion Error:", err);
    }
};

export default upload;
