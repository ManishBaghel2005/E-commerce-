import SimpleProduct from "../models/product.models.js";
import fs from 'fs';
import path from "path";

// 1. CREATE (Naya Product Add Karna)
export const addnewproduct = async (req, res) => {
    try {
        const { name, description, category, rating, totalReviews, isAvailable } = req.body;
        
        let variants = [];
        if (req.body.variants && req.body.variants !== "") {
            try {
                variants = JSON.parse(req.body.variants);
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

        if (req.file) {
            addproduct.imagepath = `/uploads/${req.file.filename}`;
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

        if (req.body.variants) {
            try {
                updateProductData.variants = JSON.parse(req.body.variants);
            } catch (e) {
                // Input validation fallback
            }
        }

        if (req.body.isAvailable !== undefined) {
            updateProductData.isAvailable = req.body.isAvailable === 'true' || req.body.isAvailable === true;
        }
        if (req.body.rating) updateProductData.rating = Number(req.body.rating);
        if (req.body.totalReviews) updateProductData.totalReviews = Number(req.body.totalReviews);

        if (req.file) {
            updateProductData.imagepath = `/uploads/${req.file.filename}`;
        } else if (req.body.oldProfile) {
            updateProductData.imagepath = req.body.oldProfile;
        }

        delete updateProductData.oldProfile;

        const updatedProduct = await SimpleProduct.findByIdAndUpdate(
            id,
            updateProductData, 
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product database me nahi mila ya update fail hua" });
        }

        res.status(200).json(updatedProduct);
    } catch (err) {
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
export const searchProducts = async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.trim() === "") {
            return res.status(200).json([]);
        }

        // Case-insensitive regex search
        const products = await SimpleProduct.find({
            name: { $regex: query, $options: "i" }
        })
        .select("name imagepath variants _id") // Fixed: SimpleProduct model mapping aur 'price' ki jagah 'variants' fetch kiya
        .limit(6); 

        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};