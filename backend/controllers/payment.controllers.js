import crypto from "crypto";
import razorpay from "../config/razorpay.js";

// @desc    Create a new Razorpay Order
// @route   POST /api/payments/create-order
export const createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount) {
            return res.status(400).json({ error: "Amount is required" });
        }

        const options = {
            amount: Math.round(parseFloat(amount) * 100), // Decimal floating point issue se bachne ke liye round off kiya
            currency: "INR",
            receipt: `receipt_${Date.now()}`
        };

        const order = await razorpay.orders.create(options);
        
        res.status(200).json({
            order: order,
            razorpay_key_id: process.env.RAZORPAY_KEY_ID
        });
    } catch (error) {
        console.error("Create Order Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payments/verify-payment
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ status: "failure", message: "Missing required verification parameters" });
        }

        // ✅ FIXED: Standard sha256 generation using native crypto library (No webhook mixups)
        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        // ✅ Matching signatures
        if (generated_signature === razorpay_signature) {
            // Yahan par status success dene ke sath aap chahein toh database me order place/verify kar sakte hain
            res.status(200).json({ status: "success", message: "Payment Verified Successfully" });
        } else {
            console.warn("⚠️ Signature Mismatch: Verification failed.");
            res.status(400).json({ status: "failure", message: "Invalid payment signature" });
        }
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ error: error.message });
    }
};

// @desc    Test connection status
// @route   GET /api/payments/test-connect
export const testConnection = (req, res) => {
    res.json({ message: "Haan bhai! Backend se connection ekdum mast chal raha hai!" });
};