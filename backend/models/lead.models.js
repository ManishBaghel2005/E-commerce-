import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        lowercase: true
    },
    phone: {
        type: String,
        required: true,
        trim: true,
        validate: {
            validator: function(v) {
                // Indian phone number rule: Starts with 6-9 and exactly 10 digits
                return /^[6-9]\d{9}$/.test(v);
            },
            message: props => `${props.value} ek valid Indian phone number nahi hai! Kripya 10-digit ka number dalein jo 6, 7, 8, ya 9 se shuru hota ho.`
        }
    },
    address: {
        type: String,
        required: true,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;