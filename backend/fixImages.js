import SimpleProduct from "./models/product.models.js";
import db from "./config/db.js";

const brokenProductIds = [
    '6a67321df00e8cebacb2bc77',
    '6a673265f00e8cebacb2bc79',
    '6a6732a8f00e8cebacb2bc7b',
    '6a6732e5f00e8cebacb2bc7d',
    '6a673dd8f00e8cebacb2bda2'
];

async function fixBrokenImages() {
    try {
        await db();
        console.log("Database connected");

        for (const id of brokenProductIds) {
            const product = await SimpleProduct.findById(id);
            if (product) {
                product.imagepath = '';
                await product.save();
                console.log(` Fixed: ${product.name}`);
            }
        }

        console.log("All images cleared successfully!");
        process.exit(0);
    } catch (error) {
        console.error("Error:", error.message);
        process.exit(1);
    }
}

fixBrokenImages();
