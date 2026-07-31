import crypto from "crypto";
import razorpay from "../config/razorpay.js";

// Helper function: Meta WhatsApp Cloud API se message bhejne ke liye
const sendMetaWhatsAppMessage = async (toPhone, messageText) => {
    try {
        const token = process.env.META_WHATSAPP_TOKEN;
        const phoneId = process.env.META_PHONE_NUMBER_ID;

        if (!token || !phoneId) {
            console.warn("⚠️ Meta credentials missing in .env file");
            return;
        }

        // Phone Number formatting (Indian 10-digit to 91XXXXXXXXXX)
        let formattedPhone = toPhone.replace(/[^0-9]/g, '');
        if (formattedPhone.length === 10) {
            formattedPhone = `91${formattedPhone}`;
        }

        const url = `https://graph.facebook.com/v20.0/${phoneId}/messages`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: formattedPhone,
                type: "text",
                text: { preview_url: false, body: messageText }
            })
        });

        const data = await response.json();
        
        if (response.ok) {
            console.log(`✅ Meta WhatsApp sent to ${formattedPhone}`);
        } else {
            console.error(`❌ Meta API Error for ${formattedPhone}:`, data);
        }
    } catch (error) {
        console.error("❌ Meta WhatsApp Fetch Error:", error.message);
    }
};

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

// @desc    Verify Razorpay Payment Signature & Send WhatsApp Notifications
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

            // Items List string formatting
            const itemsList = Array.isArray(cart)
                ? cart.map((item, idx) => `${idx + 1}. ${item.name} (${item.size || 'Std'}) x ${item.qty} = ₹${item.price * item.qty}`).join("\n")
                : "No items";

            // 1. Google Sheet Webhook Sync (Existing Logic)
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

            // 2. 🔥 META WHATSAPP NOTIFICATIONS (Customer & Admin)
            const customerMsg = `🎉 *Order Confirmed - ALORA PRODUCTS*\n\n` +
                `Hi *${customer?.name || 'Customer'}*,\n` +
                `Aapka order successfully receive ho gaya hai!\n\n` +
                `📦 *Order ID:* ${razorpay_order_id}\n` +
                `💳 *Payment ID:* ${razorpay_payment_id}\n\n` +
                `🛒 *Items:*\n${itemsList}\n\n` +
                `💰 *Total Paid:* ₹${totalAmount}\n` +
                `📍 *Address:* ${customer?.address || 'N/A'}\n\n` +
                `Thank you for shopping with us!`;

            const adminMsg = `🚨 *NEW ORDER RECEIVED!*\n\n` +
                `👤 *Customer:* ${customer?.name || 'N/A'}\n` +
                `📞 *Phone:* ${customer?.phone || 'N/A'}\n` +
                `📍 *Address:* ${customer?.address || 'N/A'}\n\n` +
                `🛒 *Items Ordered:*\n${itemsList}\n\n` +
                `💰 *Total Amount:* ₹${totalAmount}\n` +
                `🆔 *Razorpay Order ID:* ${razorpay_order_id}\n` +
                `💳 *Payment ID:* ${razorpay_payment_id}`;

            // Notifications trigger karein
            if (customer?.phone) {
                sendMetaWhatsAppMessage(customer.phone, customerMsg);
            }

            const adminPhone = process.env.ADMIN_PHONE;
            if (adminPhone) {
                sendMetaWhatsAppMessage(adminPhone, adminMsg);
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