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
        
        // MVC integration ke mutabik routes: /api/payments/...
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
            "name": "ALORA PRODUCTS",
            "description": "WELCOME TO ALORA",
            "order_id": orderData.order.id,
            "handler": async function (response) {
                console.log("Payment details from Razorpay: ", response);
                try {
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
                        // Payment verify hone par custom success popup show hoga
                        showPaymentSuccessPopup();
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
                "color": "#A0522D" // Theme color matching
            }
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
        
    } catch (error) {
        alert("Connect Failed! Browser ka Inspect Element check karo.");
        console.error("Error details: ", error);
    }
});

// Custom Payment Success Popup Function
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
                <h2 style="margin: 0 0 8px 0; color: #2e7d32; font-size: 22px;">Thank you for payment!</h2>
                <p style="color: #555; margin: 0 0 24px 0; font-size: 14px; line-height: 1.4;">
                    Aapka payment successfully verify ho gaya hai.
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

    // OK Button click handler: Cart empty karke redirect karega
    document.getElementById('success-ok-btn').addEventListener('click', function() {
        localStorage.removeItem('glowCart');
        window.location.href = "./index.html";
    });
}