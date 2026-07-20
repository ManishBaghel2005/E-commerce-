import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
    productId: {
        type: String,
        required: true,
        default: "alora-best-seller" // Default product ID agar use na ho
    },
    username: {
        type: String,
        required: [true, 'Username is required'],
        trim: true
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: [true, 'Comment text is required']
    }
}, {
    timestamps: true // Yeh automatically createdAt aur updatedAt add kar dega
});

const Review = mongoose.model('Review', reviewSchema);
export default Review;