import mongoose from 'mongoose';

const querySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, default: 'Pending' }, // Admin ke liye status (Pending/Resolved)
    createdAt: { type: Date, default: Date.now }
});

export const Query = mongoose.model('Query', querySchema);