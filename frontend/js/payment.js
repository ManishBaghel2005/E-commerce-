import BASE_URL from './config.js';

const button = document.getElementById("payNow");

button.addEventListener("click", async (e) => {
    e.preventDefault();

    // 1. HTML se Total Payable amount nikalna aur clean karna
    const billTotalElement = document.getElementById("bill-total");
    if (!billTotalElement) {
        alert("Bill Total element HTML par nahi mila!");
        return;
    }

    // "₹ 1,499" ya "₹ 499" jaisi string se numbers nikalne ke liye regex aur formatting:
    const rawAmount = billTotalElement.innerText;
    const payamount = parseFloat(rawAmount.replace(/[^0-9.]/g, ''));

    if (!payamount || payamount <= 0) {
        alert("Bhai, pehle sahi amount toh generate hone do (Total Payable ₹ 0 hai)!");
        return;
    }
    
    try {
        console.log(`Backend ko call lag raha hai amount: ₹${payamount} ke liye...`);
        
        // MVC integration ke mutabik routes badal diye gaye hain: /api/payments/...
        const response = await fetch(`${BASE_URL}/api/payments/create-order`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ amount: payamount })
        });
        
        const orderData = await response.json();
        console.log("Backend se Order mil gaya hai: ", orderData);

        if (!orderData.order || !orderData.order.id) {
            alert("Order ID generate nahi ho payi. Backend check karo!");
            return;
        }

        const options = {
            "key": orderData.razorpay_key_id,
            "amount": orderData.order.amount,
            "currency": orderData.order.currency,
            "name": "ALORA  PRODUCTS",
            "description": "WELCOME TO ALORA",
            "order_id": orderData.order.id,
            "handler": async function (response) {
                console.log("Payment details from Razorpay: ", response);
                try {
                    // Verifying path is also updated for MVC
                    const verifyResponse = await fetch(`${BASE_URL}/api/payments/verify-payment`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        })
                    });

                    const verificationResult = await verifyResponse.json();
                    
                    if (verificationResult.status === "success") {
                        alert("🎉 Waah! Payment verify bhi ho gayi aur safe hai!");
                        // Payment success hone par cart khali kar sakte hain ya redirect kar sakte hain:
                        localStorage.removeItem('glowCart');
                        window.location.href = "/index.html";
                    } else {
                        alert("❌ Payment verification failed! Tampering detect hui.");
                    }
                } catch (error) {
                    console.error("Verification error: ", error);
                    alert("Verification API Call fail ho gayi.");
                }
            },
            "prefill": {
                "name": "Customer Name",
                "email": "customer@example.com",
                "contact": "9999999999"
            },
            "theme": {
                "color": "#A0522D" // Aapke theme color se matching
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        
    } catch (error) {
        alert("Connect Failed! Browser ka Inspect Element check karo.");
        console.error("Error details: ", error);
    }
});