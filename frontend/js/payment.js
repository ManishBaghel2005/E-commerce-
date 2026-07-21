import BASE_URL from './config.js';

const button = document.getElementById("payNow");

button?.addEventListener("click", async (e) => {
    e.preventDefault();

    // 1. HTML Form se Delivery Details fetch karein
    const nameInput = document.getElementById("custName");
    const phoneInput = document.getElementById("custPhone");
    const addressInput = document.getElementById("custAddress");

    const name = nameInput?.value.trim();
    const phone = phoneInput?.value.trim();
    const address = addressInput?.value.trim();

    // 2. Form Validation
    if (!name || !phone || !address) {
        alert("Kripya pehle apni Delivery Details (Name, Phone, Address) poori bharein!");
        if (!name && nameInput) nameInput.focus();
        else if (!phone && phoneInput) phoneInput.focus();
        else if (!address && addressInput) addressInput.focus();
        return;
    }

    // Phone number validation (10 digits)
    if (phone.length !== 10 || isNaN(phone)) {
        alert("Kripya valid 10-digit mobile number dalein!");
        phoneInput.focus();
        return;
    }

    // 3. Cart items extract karein
    const cartItems = JSON.parse(localStorage.getItem("glowCart") || "[]");

    // 4. Total Amount calculate/extract karein
    const billTotalElement = document.getElementById("bill-total");
    if (!billTotalElement) {
        alert("Bill Total Element nahi mila!");
        return;
    }

    const rawAmount = billTotalElement.innerText;
    const payamount = parseFloat(rawAmount.replace(/[^0-9.]/g, ''));

    if (!payamount || payamount <= 0) {
        alert("Amount invalid hai! Cart me koi item check karein.");
        return;
    }

    try {
        // 5. Backend ko Call lagayein aur Order Create karein
        const response = await fetch(`${BASE_URL}/api/payments/create-order`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                amount: payamount,
                notes: {
                    address: address,
                    phone: phone,
                    name: name
                }
            })
        });

        const orderData = await response.json();

        if (!orderData.order || !orderData.order.id) {
            alert("Order ID generate nahi ho payi. Backend log check karein!");
            return;
        }

        // 6. Razorpay Options Options Construct karein
        const options = {
            "key": orderData.razorpay_key_id,
            "amount": orderData.order.amount,
            "currency": orderData.order.currency,
            "name": "ALORA PRODUCTS",
            "description": "Product Purchase",
            "order_id": orderData.order.id,

            // Razorpay Dashboard me details save karne ke liye notes
            "notes": {
                "shipping_address": address,
                "customer_phone": phone,
                "customer_name": name
            },

            // Payment Handler Function
            "handler": async function (response) {
                console.log("Payment Details: ", response);

                try {
                    // Backend par verification call
                    const verifyResponse = await fetch(`${BASE_URL}/api/payments/verify-payment`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            // Extra Order Info for DB
                            customer: { name, phone, address },
                            cart: cartItems
                        })
                    });

                    const verificationResult = await verifyResponse.json();

                    if (verificationResult.status === "success") {
                        // 🧹 Payment Success hone par CART EMPTY KAREIN
                        localStorage.removeItem('glowCart');

                        showPaymentSuccessPopup();
                    } else {
                        alert("❌ Payment verification failed! Contact Support.");
                    }
                } catch (error) {
                    console.error("Verification error: ", error);
                    alert("Verification API call fail ho gayi.");
                }
            },
            
            // Customer Autofill in Razorpay Popup
            "prefill": {
                "name": name,
                "contact": phone
            },
            "theme": {
                "color": "#A0522D"
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();

    } catch (error) {
        console.error("Error creating order: ", error);
        alert("Connect failed! Backend server check karein.");
    }
});

// Custom Success Popup Function
function showPaymentSuccessPopup() {
    const modal = document.createElement('div');
    modal.id = 'payment-success-modal';
    modal.innerHTML = `
        <div style="
            position: fixed;
            top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.6);
            display: flex; align-items: center; justify-content: center;
            z-index: 9999;
            font-family: inherit;
        ">
            <div style="
                background: #ffffff;
                padding: 30px;
                border-radius: 12px;
                text-align: center;
                max-width: 380px;
                width: 85%;
                box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            ">
                <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
                <h2 style="margin: 0 0 8px 0; color: #2e7d32; font-size: 22px;">Payment Successful!</h2>
                <p style="color: #555; margin: 0 0 24px 0; font-size: 14px; line-height: 1.4;">
                    Aapka order successfully place ho gaya hai.
                </p>
                <button id="success-ok-btn" style="
                    background-color: #A0522D;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    font-size: 15px;
                    border-radius: 6px;
                    cursor: pointer;
                    width: 100%;
                    font-weight: 600;
                    transition: background-color 0.2s;
                ">OK</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);

    document.getElementById('success-ok-btn').addEventListener('click', function() {
        window.location.href = "./index.html";
    });
}