import BASE_URL from "./config.js";

let pendingCartAction = null;

// Explicitly register events on global window for inline onclick execution
window.openLeadModal = function(actionElement) {
    pendingCartAction = actionElement; 
    const modal = document.getElementById('leadModal');
    if (modal) modal.classList.remove('hidden');
};

window.closeLeadModal = function() {
    const modal = document.getElementById('leadModal');
    if (modal) modal.classList.add('hidden');
    pendingCartAction = null;
};

window.handleCartButtonClick = function(buttonElement) {
    const isLeadFilled = localStorage.getItem('leadFilled');
    
    if (isLeadFilled === 'true') {
        if (typeof window.toggleCartState === 'function') {
            window.toggleCartState(buttonElement);
        } else if (typeof toggleCartState === 'function') {
            toggleCartState(buttonElement);
        } else {
            console.error("Critical: toggleCartState handler missing on this layout viewport.");
        }
    } else {
        window.openLeadModal(buttonElement);
    }
};

window.handleLeadSubmit = async function(event) {
    event.preventDefault();
    
    const name = document.getElementById('leadName').value;
    const email = document.getElementById('leadEmail').value;
    const phone = document.getElementById('leadPhone').value;
    const address = document.getElementById('leadAddress').value;

    try {
        const response = await fetch(`${BASE_URL}/api/lead/newlead`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, address })
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('leadFilled', 'true');
            window.closeLeadModal();
            
            alert("Details verified successfully!");
            
            if (pendingCartAction) {
                if (typeof window.toggleCartState === 'function') {
                    window.toggleCartState(pendingCartAction);
                } else {
                    toggleCartState(pendingCartAction);
                }
            }
        } else {
            alert(data.error || "Please check the form fields.");
        }
    } catch (err) {
        console.error("Lead submission network error:", err);
        alert("Server validation processing failed.");
    }
};