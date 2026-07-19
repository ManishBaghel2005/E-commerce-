import mongoose from "mongoose";

const ProductVariantSchema = new mongoose.Schema({
    volume: { 
        type: String,
        enum: ['100g', '50g', '30ml', '100ml', '200ml', '500ml'], 
        required: [true, 'Variant ka volume zaroori hai']
    },
    price: { 
        type: Number, 
        required: [true, 'Is variant ki offer price zaroori hai'], 
        min: 0 
    },
    comparePrice: { 
        type: Number, 
        min: 0 
    },
    stock: { 
        type: Number, 
        required: true, 
        default: 10 
    }
});

const SimpleProductSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Product name zaroori hai'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Product description zaroori hai'],
        trim: true
    },
    category: {
        type: String,
        required: [true, 'Product category zaroori hai'],
        enum: {
            values: ['skin', 'face', 'cream', 'body'],
            message: '{VALUE} valid category nahi hai. Choose from: skin, face, cream, body'
        },
        trim: true
    },
    imagepath: {
        type: String,
        required: [true, 'Product image path zaroori hai']
    },
    galleryImages: [{ 
        type: String
    }],
    variants: {
        type: [ProductVariantSchema],
        validate: [v => v.length > 0, 'Kam se kam ek product variant hona zaroori hai']
    },
    isAvailable: { 
        type: Boolean, 
        default: true 
    },
    rating: {
        type: Number,
        default: 4.5,
        min: 0,
        max: 5
    },
    totalReviews: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

const SimpleProduct = mongoose.model('SimpleProduct', SimpleProductSchema);
export default SimpleProduct;