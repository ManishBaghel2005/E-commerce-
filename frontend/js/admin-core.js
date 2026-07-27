import BASE_URL, { GOOGLE_SHEET_API_URL } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
    
    // 1. ADMIN LOGOUT FUNCTIONALITY
    const adminLogoutBtn = document.getElementById("adminLogoutBtn");
    if (adminLogoutBtn) {
        adminLogoutBtn.addEventListener("click", async () => {
            try {
                await fetch(`${BASE_URL}/api/auth/logout`, { 
                    method: "POST", 
                    credentials: "include" 
                });
                localStorage.clear();
                window.location.href = "./login.html";
            } catch (err) {
                console.error("Admin Logout error:", err);
                localStorage.clear();
                window.location.href = "./login.html";
            }
        });
    }

    // 2. FRONTEND ROUTE GUARD
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || user.role !== "admin") {
        localStorage.clear();
        window.location.href = "./login.html";
    }

    // 3. FETCH ORDERS DIRECTLY FROM GOOGLE SHEET
    fetchOrdersFromGoogleSheet();

    // 4. MODAL CLOSE LOGIC
    const modal = document.getElementById("invoiceModal");
    document.getElementById("closeInvoiceBtn")?.addEventListener("click", () => modal?.classList.add("hidden"));
    document.getElementById("closeInvoiceBtn2")?.addEventListener("click", () => modal?.classList.add("hidden"));
});

// Google Sheet Se Orders Fetch karne ka Function
async function fetchOrdersFromGoogleSheet() {
    const tableBody = document.getElementById("ordersTableBody");
    if (!tableBody) return;

    try {
        tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Google Sheet se orders load ho rahe hain...</td></tr>`;

        // Redirect: "follow" Google Apps Script ke 302 Redirect ko bypass karta hai
        const response = await fetch(GOOGLE_SHEET_API_URL, {
            method: "GET",
            redirect: "follow",
            headers: {
                "Content-Type": "text/plain;charset=utf-8",
            }
        });

        const orders = await response.json();

        if (!orders || orders.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Sheet me koi order nahi mila.</td></tr>`;
            return;
        }

        // Table Rows Rendering
        tableBody.innerHTML = orders.map((order) => {
            return `
                <tr class="hover:bg-gray-50 border-b">
                    <td class="p-4 font-mono font-medium text-xs">${order.order_id || 'N/A'}</td>
                    <td class="p-4">
                        <div class="font-bold text-gray-800">${order.name || 'Customer'}</div>
                        <div class="text-xs text-gray-500">${order.phone || ''}</div>
                    </td>
                    <td class="p-4 font-bold text-gray-800">₹${order.amount || 0}</td>
                    <td class="p-4">
                        <span class="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold">PAID</span>
                    </td>
                    <td class="p-4">
                        <button onclick='openInvoiceModal(${JSON.stringify(order).replace(/'/g, "&apos;")})' class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-md text-xs flex items-center gap-1 transition-all">
                            <i class="fa-solid fa-receipt"></i> Print Invoice
                        </button>
                    </td>
                </tr>
            `;
        }).reverse().join("");

    } catch (error) {
        console.error("Error loading Google Sheet data:", error);
        tableBody.innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-500 font-semibold">Data load nahi ho paya. Please config.js me Apps Script URL verify karein.</td></tr>`;
    }
}

// Global scope me Invoice Popup View function
window.openInvoiceModal = function(order) {
    const setElementText = (id, text) => {
        const el = document.getElementById(id);
        if (el) el.innerText = text;
    };

    setElementText("invOrderId", `#${order.order_id || 'N/A'}`);
    setElementText("invCustomer", order.name || 'N/A');
    setElementText("invEmail", `Phone: ${order.phone || 'N/A'} | Addr: ${order.address || 'N/A'}`);
    setElementText("invDate", `Date: ${order.date || ''}`);
    setElementText("invTotalAmount", `₹${order.amount || 0}`);

    // Cart items parsing
    const itemsTable = document.getElementById("invItemsTable");
    if (itemsTable) {
        if (order.cart) {
            const cartLines = order.cart.split('\n');
            itemsTable.innerHTML = cartLines.map(line => `
                <tr class="border-b text-xs">
                    <td class="p-2" colspan="2">${line}</td>
                    <td class="p-2 text-right text-gray-500">--</td>
                </tr>
            `).join("");
        } else {
            itemsTable.innerHTML = `<tr><td class="p-2 text-xs text-gray-500" colspan="3">No Items Detail Available</td></tr>`;
        }
    }

    // Modal show karein
    document.getElementById("invoiceModal")?.classList.remove("hidden");
};