import SimpleProduct from "../models/product.models.js";
import fs from 'fs';
import path from "path";

// 1. CREATE (Naya Product Add Karna)

export const addnewproduct = async (req, res) => {
    try {
        let { name, description, category, rating, totalReviews, isAvailable } = req.body;
        
        // 🚨 Duplicate HTML name handle karne ke liye
        if (Array.isArray(category)) {
            category = category[0];
        }

        let variants = [];
        if (req.body.variants && req.body.variants !== "") {
            try {
                // Agar variants string format me aaya hai toh parse karo, varna direct accept karo
                variants = typeof req.body.variants === 'string' 
                    ? JSON.parse(req.body.variants) 
                    : req.body.variants;
            } catch (e) {
                return res.status(400).json({ error: "Variants array parsing text format invalid hai!" });
            }
        }

        const addproduct = {
            name,
            description,
            category, 
            rating: rating ? Number(rating) : 4.5,
            totalReviews: totalReviews ? Number(totalReviews) : 0,
            isAvailable: isAvailable === 'true' || isAvailable === true, 
            variants 
        };

        // 🖼️ Main Image Handling (Single Image)
        if (req.files && req.files['imagepath'] && req.files['imagepath'].length > 0) {
            addproduct.imagepath = `/uploads/${req.files['imagepath'][0].filename}`;
        } else if (req.file) { 
            // Fallback: Agar router me abhi bhi upload.single('imagepath') laga ho
            addproduct.imagepath = `/uploads/${req.file.filename}`;
        }

        // 🖼️ Gallery Images Handling (Multiple Images Array Fix)
        if (req.files && req.files['galleryImages'] && req.files['galleryImages'].length > 0) {
            addproduct.galleryImages = req.files['galleryImages'].map(
                (file) => `/uploads/${file.filename}`
            );
        } else {
            addproduct.galleryImages = []; // Agar photos upload na hui ho toh empty array rakho
        }

        const newProduct = new SimpleProduct(addproduct);
        const savedProduct = await newProduct.save();
        
        res.status(201).json(savedProduct);

    } catch (err) {
        console.error("Controller Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// 2. READ (Saare Products Get Karna)
export const readproduct = async (req, res) => {
    try {
        const products = await SimpleProduct.find();
        res.status(200).json(products);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. UPDATE (Product Details Badalna)
export const updateproduct = async (req, res) => {
    try {
        const { id } = req.params;
        let updateProductData = { ...req.body };

        // 🔹 FIX 1: Duplicate field Array handling for Category
        if (Array.isArray(updateProductData.category)) {
            updateProductData.category = updateProductData.category[0];
        }

        // 🔹 FIX 2: Variants array JSON Parsing
        if (req.body.variants) {
            try {
                updateProductData.variants = typeof req.body.variants === 'string' 
                    ? JSON.parse(req.body.variants) 
                    : req.body.variants;
            } catch (e) {
                return res.status(400).json({ error: "Variants parsing failed: JSON string invalid hai" });
            }
        }

        // 🔹 FIX 3: Type conversions
        if (req.body.isAvailable !== undefined) {
            updateProductData.isAvailable = req.body.isAvailable === 'true' || req.body.isAvailable === true;
        }
        if (req.body.rating) updateProductData.rating = Number(req.body.rating);
        if (req.body.totalReviews) updateProductData.totalReviews = Number(req.body.totalReviews);

        // 🔹 FIX 4: Image handle
        if (req.file) {
            updateProductData.imagepath = `/uploads/${req.file.filename}`;
        } else if (req.body.oldProfile) {
            updateProductData.imagepath = req.body.oldProfile;
        }

        delete updateProductData.oldProfile;

        // 🔹 DB Update query with Schema validation
        const updatedProduct = await SimpleProduct.findByIdAndUpdate(
            id,
            updateProductData, 
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product database me nahi mila!" });
        }

        res.status(200).json(updatedProduct);
    } catch (err) {
        console.error("Update Controller Error:", err);
        res.status(500).json({ error: err.message });
    }
};

// 4. DELETE (Product aur Uski Attached File Hata Dena)
export const deleteproduct = async (req, res) => {
    try {
        const { id } = req.params;
        const deleteProduct = await SimpleProduct.findByIdAndDelete(id);
        if (!deleteProduct) {
            return res.status(404).json({ message: "Product nahi mila" });
        }

        if (deleteProduct.imagepath) {
            // FIX: Removes the leading slash context to correctly map path alignment from project folder root
            const relativePath = deleteProduct.imagepath.replace(/^\//, '');
            const image = path.join(process.cwd(), relativePath);
            
            fs.access(image, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.unlink(image, (unlinkErr) => {
                        if (unlinkErr) console.error("Image file delete karne me error:", unlinkErr);
                        else console.log("Image folder se bhi ekdum saaf!");
                    });
                } else {
                    console.log("Image file folder me mili hi nahi at:", image);
                }
            });
        }
        res.status(200).json({ message: "Product successfully deleted!" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 5. GET SINGLE PRODUCT
export const getproductbyid = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await SimpleProduct.findById(id);

        if (!product) {
            return res.status(404).json({ error: "Product nahi mila" });
        }

        res.status(200).json(product);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 6. SEARCH PRODUCTS (Fixed reference model name to SimpleProduct and price selection to variants)
// GET /api/products/search?q=query
export const searchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, products: [] });
    }

    // 🔴 Debugging log lagayein taaki terminal me query dikhe
    console.log("Searching for query:", q); 

    const products = await SimpleProduct.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    }).limit(6);

    res.status(200).json({ success: true, products });
  } catch (error) {
    // 🔴 Is line ko dhyan se console.error karein taaki exact galti terminal me dikhe
    console.error("Backend Search Error Detail:", error); 
    res.status(500).json({ success: false, message: error.message });
  }
};