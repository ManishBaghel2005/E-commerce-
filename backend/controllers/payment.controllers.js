import crypto from "crypto";
import razorpay from "../config/razorpay.js";

// @desc    Create a new Razorpay Order
export const createOrder = async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount) {
            return res.status(400).json({ error: "Amount is required" });
        }

        const options = {
            amount: Math.round(parseFloat(amount) * 100),
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
export const verifyPayment = async (req, res) => {
    try {
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature, customer, cart } = req.body;
        const secret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ status: "failure", message: "Missing required verification parameters" });
        }

        // HMAC Signature Verification
        const generated_signature = crypto
            .createHmac("sha256", secret)
            .update(razorpay_order_id + "|" + razorpay_payment_id)
            .digest("hex");

        if (generated_signature === razorpay_signature) {
            
            // Total amount calculation
            const totalAmount = Array.isArray(cart) 
                ? cart.reduce((sum, item) => sum + (item.price * item.qty), 0) 
                : 0;

            // Item summary for WhatsApp / Pabbly (e.g. "Product A (2x), Product B (1x)")
            const itemsSummary = Array.isArray(cart)
                ? cart.map(item => `${item.name} (${item.qty}x)`).join(", ")
                : "";

            // 1. Google Sheet Webhook Sync (Existing Code)
            const googleSheetWebhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
            if (googleSheetWebhookUrl) {
                fetch(googleSheetWebhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        order_id: razorpay_order_id,
                        payment_id: razorpay_payment_id,
                        customer: customer,
                        cart: cart,
                        amount: totalAmount
                    })
                }).catch(err => console.error("Google Sheet Sync Error:", err));
            }

            // 2. 🔥 PABBLY WEBHOOK SYNC (Naya Add Kiya Gaya Hai)
            const pabblyWebhookUrl = process.env.PABBLY_WEBHOOK_URL; // .env me URL daalein
            if (pabblyWebhookUrl) {
                fetch(pabblyWebhookUrl, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        event: "payment_success",
                        order_id: razorpay_order_id,
                        payment_id: razorpay_payment_id,
                        customer_name: customer?.name || "",
                        customer_phone: customer?.phone || "",
                        customer_address: customer?.address || "",
                        items: itemsSummary,
                        total_amount: totalAmount,
                        date: new Date().toLocaleDateString('en-IN')
                    })
                })
                .then(() => console.log("✅ Pabbly Webhook Sent Successfully!"))
                .catch(err => console.error("❌ Pabbly Webhook Error:", err));
            }

            return res.status(200).json({ 
                status: "success", 
                message: "Payment Verified Successfully",
                orderData: {
                    order_id: razorpay_order_id,
                    payment_id: razorpay_payment_id,
                    customer,
                    cart,
                    amount: totalAmount,
                    date: new Date().toLocaleDateString('en-IN')
                }
            });
        } else {
            console.warn("⚠️ Signature Mismatch: Verification failed.");
            return res.status(400).json({ status: "failure", message: "Invalid payment signature" });
        }
    } catch (error) {
        console.error("Verification Error:", error);
        res.status(500).json({ error: error.message });
    }
};

export const testConnection = (req, res) => {
    res.json({ message: "Haan bhai! Backend se connection ekdum mast chal raha hai!" });
};